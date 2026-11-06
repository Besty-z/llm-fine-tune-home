# -*- coding: utf-8 -*-
"""RT-DETR FastAPI 推理服务（纯 CPU，适配 Render 免费部署）。

接口一览：
    GET  /         服务状态（查看模型是否加载成功）
    GET  /docs     Swagger 文档，可直接上传图片调试
    POST /predict  上传图片，返回检测框 xyxy、置信度、类别 id 与类别名称

权重说明：
    best.pt 必须与 app.py 放在同一目录（rtdetr-api/best.pt），
    服务启动时直接加载本地文件，不再联网下载。
"""

import asyncio
import io
import logging
import os
import time
from contextlib import asynccontextmanager

from PIL import Image, UnidentifiedImageError

# 必须在 import torch 之前设置：限制底层数学库线程数，降低免费版 CPU / 内存压力
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

import torch  # noqa: E402
from fastapi import FastAPI, File, Query, Request, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402

# ------------------------- 配置项 -------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best.pt")          # 本地权重，与 app.py 同级
MAX_IMAGE_BYTES = 10 * 1024 * 1024                      # 上传图片上限 10MB
DEVICE = "cpu"                                          # Render 免费版无 GPU

# 免费版 CPU 算力有限，单线程推理反而更省内存
torch.set_num_threads(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("rtdetr-api")

# ------------------------- 全局状态 -------------------------
model = None        # 模型实例，加载失败时为 None
model_error = None  # 加载失败原因，用于向调用方返回友好提示


def _load_model() -> None:
    """加载本地 best.pt 并按 CPU + eval 模式初始化。

    文件缺失或格式错误时只记录原因、不抛出，保证进程仍能启动并返回 503，
    便于通过 /docs 或日志定位问题。

    :return: 无返回值，结果写入全局 model / model_error
    """
    global model, model_error

    if not os.path.isfile(MODEL_PATH):
        model_error = f"模型文件不存在：{MODEL_PATH}（请将 best.pt 放到 app.py 同级目录）"
        logger.error(model_error)
        return

    try:
        from ultralytics import RTDETR  # 延迟导入，降低冷启动内存峰值

        logger.info("正在加载模型：%s", MODEL_PATH)
        instance = RTDETR(MODEL_PATH)
        instance.model.eval()  # 推理模式，关闭 BatchNorm / Dropout
        model = instance
        logger.info("模型加载完成（device=%s）", DEVICE)
    except Exception as exc:
        model_error = f"模型加载失败：{type(exc).__name__}: {exc}"
        logger.exception(model_error)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """应用生命周期：启动时在线程池中加载模型，避免阻塞事件循环。"""
    await asyncio.to_thread(_load_model)
    yield


app = FastAPI(
    title="RT-DETR 目标检测 API",
    description="基于 ultralytics RT-DETR 的 CPU 推理服务，加载本地 best.pt，适配 Render 免费部署。",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS：允许 Vue3 前端跨域调用（竞赛项目直接放开全部来源）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 上传大小限制（星号表示任意字段名，便于前端用 form-data 自由命名）
MAX_IMAGE_BYTES_MB = MAX_IMAGE_BYTES // 1024 // 1024


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    """兜底异常：统一返回 JSON，避免把堆栈直接暴露给前端。"""
    logger.exception("未处理异常：%s", exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "服务内部错误", "detail": str(exc)[:200]},
    )


@app.get("/", summary="服务状态")
def root() -> dict:
    """返回服务与模型状态，部署后可直接打开确认模型是否就绪。"""
    return {
        "success": True,
        "service": "RT-DETR 目标检测 API",
        "status": "running",
        "model_loaded": model is not None,
        "model_error": model_error,
        "docs": "/docs",
    }


@app.post("/predict", summary="上传图片进行目标检测")
async def predict(
    file: UploadFile = File(..., description="待检测图片（jpg/png/webp，≤10MB）"),
    conf: float = Query(0.25, ge=0.01, le=0.99, description="置信度阈值"),
    imgsz: int = Query(640, ge=160, le=960, description="推理输入边长，越小越快越省内存"),
):
    """接收图片并执行 RT-DETR 推理。

    :param file:  multipart/form-data 中的图片文件
    :param conf:  置信度阈值（0.01 ~ 0.99）
    :param imgsz: 推理输入边长（160 ~ 960），限制上限以保护 512MB 内存
    :return:      JSON，包含检测框 xyxy、置信度、类别 id 与类别名称
    """
    # 1. 模型未就绪（best.pt 缺失或加载失败）
    if model is None:
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "模型未就绪",
                "detail": model_error or "模型加载失败，请查看服务日志",
            },
        )

    # 2. 读取并校验上传内容
    raw = await file.read()
    if not raw:
        return JSONResponse(status_code=400, content={"success": False, "error": "上传内容为空"})
    if len(raw) > MAX_IMAGE_BYTES:
        return JSONResponse(
            status_code=413,
            content={
                "success": False,
                "error": "图片过大",
                "detail": f"当前 {len(raw) / 1024 / 1024:.1f}MB，上限 {MAX_IMAGE_BYTES_MB}MB",
            },
        )

    # 3. 解码图片：损坏文件在此处提前拦截
    try:
        image = Image.open(io.BytesIO(raw))
        image.load()  # 立即解码，避免后续推理阶段才暴露损坏
        image = image.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "图片无法解析",
                "detail": f"文件可能已损坏或不是有效图片（{type(exc).__name__}）",
            },
        )

    # 4. 推理（放入线程池，避免阻塞 FastAPI 事件循环）
    start = time.perf_counter()
    try:
        results = await asyncio.to_thread(_run_inference, image, imgsz, conf)
    except Exception as exc:
        logger.exception("推理失败")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "推理失败", "detail": str(exc)[:200]},
        )
    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

    # 5. 组装返回结构
    detections = []
    boxes = results[0].boxes
    names = model.names
    if boxes is not None:
        for box in boxes:
            cls_id = int(box.cls[0].item())
            x1, y1, x2, y2 = (round(v, 1) for v in box.xyxy[0].tolist())
            detections.append(
                {
                    "xyxy": [x1, y1, x2, y2],                    # 检测框左上角、右下角坐标
                    "conf": round(float(box.conf[0].item()), 4),  # 置信度
                    "class": cls_id,                             # 类别 id
                    "class_name": _class_name(names, cls_id),     # 类别名称
                }
            )

    return {
        "success": True,
        "count": len(detections),
        "inference_ms": elapsed_ms,
        "detections": detections,
    }


def _run_inference(image: Image.Image, imgsz: int, conf: float):
    """在线程池中执行同步推理，全程关闭梯度计算。

    :param image: PIL RGB 图片
    :param imgsz: 推理输入边长
    :param conf:  置信度阈值
    :return:      ultralytics Results 列表
    """
    with torch.inference_mode():
        return model.predict(image, imgsz=imgsz, conf=conf, device=DEVICE, verbose=False)


def _class_name(names, cls_id: int) -> str:
    """根据类别 id 取类别名，兼容 dict / list 两种 names 结构。

    :param names:  模型类别映射
    :param cls_id: 类别 id
    :return:       类别名称；取不到时回退为 id 字符串
    """
    if isinstance(names, dict):
        return str(names.get(cls_id, cls_id))
    if isinstance(names, (list, tuple)) and 0 <= cls_id < len(names):
        return str(names[cls_id])
    return str(cls_id)


if __name__ == "__main__":
    import uvicorn

    # 本地调试入口；Render 上由启动命令注入 $PORT
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", "8000")), workers=1)
