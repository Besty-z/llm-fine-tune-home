# -*- coding: utf-8 -*-
"""RT-DETR FastAPI 推理服务（Render 免费版 · 纯 CPU）。

接口一览：
    GET  /         服务状态（首页）
    GET  /healthz  Render 健康检查
    POST /predict  上传图片，返回检测框 / 类别 / 置信度
    GET  /docs     Swagger 交互式文档（FastAPI 自动生成）

权重说明：
    仓库内不保存 best.pt。服务启动时自动从魔搭 ModelScope 下载权重，
    下载地址通过环境变量 MODEL_URL 配置（必须是公开模型的文件直链）。
"""

import asyncio
import gc
import io
import logging
import os
import time
from contextlib import asynccontextmanager

import requests
from PIL import Image, UnidentifiedImageError

# 必须在 import torch 之前设置：限制底层数学库线程数，降低内存 / CPU 占用
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

import torch  # noqa: E402
from fastapi import FastAPI, File, Query, Request, UploadFile  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402

# ------------------------- 配置项（均可用环境变量覆盖） -------------------------
MODEL_URL = os.getenv(
    "MODEL_URL",
    # ModelScope 公开模型文件直链格式：
    # https://modelscope.cn/api/v1/models/<命名空间>/<模型名>/repo?FilePath=best.pt
    "https://modelscope.cn/api/v1/models/your_namespace/your_model/repo?FilePath=best.pt",
)
WEIGHTS_DIR = os.getenv("WEIGHTS_DIR", "weights")
MODEL_PATH = os.path.join(WEIGHTS_DIR, "best.pt")
DOWNLOAD_TIMEOUT = int(os.getenv("DOWNLOAD_TIMEOUT", "600"))    # 单次下载超时（秒）
DOWNLOAD_RETRIES = int(os.getenv("DOWNLOAD_RETRIES", "2"))      # 失败后的重试次数
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))  # 上传上限 10MB
MIN_WEIGHT_BYTES = 1024 * 1024                                  # 权重最小体积，防止下载到错误页
DEVICE = "cpu"

# 单线程推理：免费版 CPU 很弱，多线程只会增加内存和上下文切换开销
torch.set_num_threads(int(os.getenv("TORCH_THREADS", "1")))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("rtdetr-api")

# ------------------------- 全局状态 -------------------------
model = None        # RTDETR 模型实例
model_error = None  # 初始化失败原因（用于接口返回友好提示）


def _download_weights() -> None:
    """从 ModelScope 下载 RT-DETR 权重到本地。

    若本地已存在有效权重则跳过下载；下载先写入临时文件再原子替换，
    避免中途失败留下损坏文件。

    :raises RuntimeError: 重试多次仍失败，或下载内容明显不是权重文件。
    """
    if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) >= MIN_WEIGHT_BYTES:
        size_mb = os.path.getsize(MODEL_PATH) / 1024 / 1024
        logger.info("本地权重已存在（%s，%.1f MB），跳过下载", MODEL_PATH, size_mb)
        return

    os.makedirs(WEIGHTS_DIR, exist_ok=True)
    tmp_path = MODEL_PATH + ".tmp"
    last_error = None

    for attempt in range(1, DOWNLOAD_RETRIES + 2):
        try:
            logger.info("开始下载权重（第 %d 次尝试）：%s", attempt, MODEL_URL)
            with requests.get(MODEL_URL, stream=True, timeout=DOWNLOAD_TIMEOUT) as resp:
                if resp.status_code != 200:
                    raise RuntimeError(
                        f"HTTP {resp.status_code}，请确认 MODEL_URL 是 ModelScope 公开模型的文件直链"
                    )
                with open(tmp_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            f.write(chunk)

            size = os.path.getsize(tmp_path)
            if size < MIN_WEIGHT_BYTES:
                os.remove(tmp_path)
                raise RuntimeError(
                    f"下载内容仅 {size} 字节，疑似 HTML 错误页，请检查 MODEL_URL 是否指向 best.pt 文件"
                )
            os.replace(tmp_path, MODEL_PATH)
            logger.info("权重下载完成：%s（%.1f MB）", MODEL_PATH, size / 1024 / 1024)
            return
        except (requests.RequestException, OSError, RuntimeError) as exc:
            last_error = exc
            logger.warning("第 %d 次下载失败：%s", attempt, exc)

    raise RuntimeError(f"权重下载失败（共尝试 {DOWNLOAD_RETRIES + 1} 次）：{last_error}")


def _load_model() -> None:
    """加载 RT-DETR 模型到内存（CPU + eval 模式），并做一次小图预热。

    内存优化：eval 模式 + inference_mode 关闭梯度；延迟导入 ultralytics
    以缩短模块加载时间。预热可避免首个请求因惰性初始化而超时。

    :raises RuntimeError: 权重文件损坏或格式不受支持。
    """
    global model
    from ultralytics import RTDETR  # 延迟导入，降低冷启动内存峰值

    logger.info("正在加载模型：%s", MODEL_PATH)
    instance = RTDETR(MODEL_PATH)
    instance.model.eval()

    dummy = Image.new("RGB", (64, 64), (0, 0, 0))
    with torch.inference_mode():
        instance.predict(dummy, imgsz=64, device=DEVICE, verbose=False)

    model = instance
    logger.info("模型加载完成（device=%s）", DEVICE)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """应用生命周期：启动时下载并加载模型；失败时记录原因而不退出进程，

    使接口能返回友好的 503 错误而不是直接崩溃。
    """
    global model_error
    start = time.perf_counter()
    try:
        await asyncio.to_thread(_download_weights)
        await asyncio.to_thread(_load_model)
        logger.info("初始化完成，耗时 %.1f 秒", time.perf_counter() - start)
    except Exception as exc:  # 初始化失败也保持进程存活，便于排查
        model_error = f"{type(exc).__name__}: {exc}"
        logger.exception("模型初始化失败：%s", model_error)
    yield


app = FastAPI(
    title="RT-DETR 目标检测 API",
    description="基于 ultralytics RT-DETR 的纯 CPU 推理服务，适配 Render 免费版（512MB 内存）。",
    version="1.0.0",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    """兜底异常处理：统一返回 JSON，避免向客户端暴露堆栈。"""
    logger.exception("未处理异常：%s", exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "服务内部错误", "detail": str(exc)[:200]},
    )


@app.get("/", summary="服务状态（首页）")
def root() -> dict:
    """返回服务运行状态与模型加载状态。"""
    return {
        "success": True,
        "service": "RT-DETR 目标检测 API",
        "status": "running",
        "model_loaded": model is not None,
        "model_error": model_error,
        "device": DEVICE,
        "docs": "/docs",
    }


@app.get("/healthz", summary="Render 健康检查")
def healthz() -> dict:
    """健康检查接口：进程存活即返回 200，模型状态体现在响应体中。"""
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict", summary="上传图片进行目标检测")
async def predict(
    file: UploadFile = File(..., description="待检测图片（jpg/png 等常见格式，≤10MB）"),
    conf: float = Query(0.25, ge=0.01, le=0.99, description="置信度阈值"),
    imgsz: int = Query(640, ge=160, le=960, description="推理边长，越小越快、越省内存"),
):
    """接收上传图片，执行 RT-DETR 推理，返回检测框、类别与置信度。

    :param file:  multipart 表单中的图片文件
    :param conf:  置信度阈值（0.01 ~ 0.99）
    :param imgsz: 推理输入边长（160 ~ 960，限制上限以保护 512MB 内存）
    :return:      检测框坐标、类别、置信度及耗时；各类失败均返回友好 JSON
    """
    if model is None:
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "模型未就绪",
                "detail": model_error or "权重下载或加载失败，请查看服务日志并检查 MODEL_URL 配置",
            },
        )

    raw = await file.read()
    if not raw:
        return JSONResponse(status_code=400, content={"success": False, "error": "上传内容为空"})
    if len(raw) > MAX_IMAGE_BYTES:
        return JSONResponse(
            status_code=413,
            content={
                "success": False,
                "error": "图片过大",
                "detail": f"当前 {len(raw) / 1024 / 1024:.1f}MB，上限 {MAX_IMAGE_BYTES / 1024 / 1024:.0f}MB",
            },
        )

    try:
        image = Image.open(io.BytesIO(raw))
        image.load()  # 立即解码，提前暴露损坏文件
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

    detections = []
    boxes = results[0].boxes
    names = model.names
    if boxes is not None:
        for box in boxes:
            cls_id = int(box.cls[0].item())
            x1, y1, x2, y2 = (round(v, 1) for v in box.xyxy[0].tolist())
            detections.append(
                {
                    "class_id": cls_id,
                    "label": _class_name(names, cls_id),
                    "confidence": round(float(box.conf[0].item()), 4),
                    "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                }
            )

    del results, boxes
    gc.collect()  # 512MB 内存紧张，主动回收

    return {
        "success": True,
        "count": len(detections),
        "inference_ms": elapsed_ms,
        "image": {"width": image.width, "height": image.height},
        "detections": detections,
    }


def _run_inference(image: Image.Image, imgsz: int, conf: float):
    """在线程池中同步执行推理（避免阻塞事件循环），全程关闭梯度。

    :param image: PIL RGB 图片
    :param imgsz: 推理输入边长
    :param conf:  置信度阈值
    :return:      ultralytics Results 列表
    """
    with torch.inference_mode():
        return model.predict(image, imgsz=imgsz, conf=conf, device=DEVICE, verbose=False)


def _class_name(names, cls_id: int) -> str:
    """根据类别 id 取类别名，兼容 dict / list 两种 names 结构。

    :param names:  模型的类别名映射
    :param cls_id: 类别 id
    :return:       类别名；取不到时返回 id 字符串
    """
    if isinstance(names, dict):
        return str(names.get(cls_id, cls_id))
    if isinstance(names, (list, tuple)) and 0 <= cls_id < len(names):
        return str(names[cls_id])
    return str(cls_id)


if __name__ == "__main__":
    import uvicorn

    # 本地调试入口；Render 上由 render.yaml 的 startCommand 注入 $PORT
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", "8000")), workers=1)
