# llm-fine-tune-home · 大模型微调技术之家

面向大模型微调学习者的技术门户网站：开源项目榜单（Star 每日自动同步）、技术科普、
FAQ 问答、企业方案、文章与广告位，并提供管理员后台所需的 CRUD 能力与 LLM 微调任务管理。

前后端分离架构，代码分为 `Backend`（接口服务）与 `Frontend`（网站前台）两个独立工程。

---

## 在线访问（Render 免费部署）

| 服务 | 地址 | 说明 |
| --- | --- | --- |
| 网站前端 | https://llm-web-28e7.onrender.com | Vue3 静态站，用户访问入口 |
| 后端 API | https://llm-api-df53.onrender.com | Express 接口服务 |
| 接口文档 | https://llm-api-df53.onrender.com/api-docs | Swagger 在线调试 |
| RT-DETR 检测 | https://llm-fine-tune-home.onrender.com | 独立的目标检测推理服务（FastAPI） |

> 三个服务均为 Render 免费实例，闲置 15 分钟会休眠，首次访问需 30~60 秒冷启动，属正常现象。

---

## 技术栈

### 前端

| 分类 | 技术 | 版本 |
| --- | --- | --- |
| 框架 | Vue 3（Composition API + `<script setup>`） | 3.5 |
| 路由 | Vue Router（hash 模式） | 4.5 |
| UI 组件 | Element Plus + @element-plus/icons-vue | 2.9 |
| HTTP | Axios（统一封装请求/响应拦截器） | 1.7 |
| 构建工具 | Vite | 6.0 |

前端已做响应式适配：`≤768px` 断点下导航切换为抽屉菜单，榜单页由表格切换为卡片列表。

### 后端

| 分类 | 技术 | 版本 |
| --- | --- | --- |
| 运行时 | Node.js | ≥ 18（开发环境为 24.x） |
| Web 框架 | Express | 4.21 |
| 数据库 | MongoDB + Mongoose | 8.9 |
| 鉴权 | jsonwebtoken（JWT）+ bcryptjs（密码哈希） | 9.0 / 2.4 |
| 参数校验 | Zod | 4.6 |
| 接口文档 | swagger-jsdoc + swagger-ui-express | 6.3 / 5.0 |
| 文件上传 | multer | 2.5 |
| 日志 | winston（控制台 + 错误落文件） | 3.19 |
| 安全 | helmet + cors 白名单 | 8.3 / 2.8 |
| 定时任务 | node-cron | 3.0 |
| 外部请求 | axios（GitHub API） | 1.7 |

### 可选服务

`rtdetr-api/` 是独立的 RT-DETR 目标检测推理服务（Python + FastAPI + ultralytics，纯 CPU），
与主站无代码耦合，按需单独部署，不影响主站运行。

---

## 目录结构

```
llmfinetunehome/
├── Backend/                  # 后端服务
│   ├── .env.example          # 环境变量模板（复制为 .env 后修改）
│   ├── logs/                 # winston 错误日志输出目录
│   ├── uploads/              # 上传图片存放目录（启动时自动创建）
│   └── src/
│       ├── app.js            # Express 实例：中间件、文档、静态资源、路由挂载
│       ├── server.js         # 入口：环境变量 → 连库 → 定时任务 → 监听端口
│       ├── config/           # 数据库连接、Swagger 配置
│       ├── models/           # User / Project / Faq / Article / Advert / Task / SyncRecord
│       ├── routes/           # 路由 + Swagger JSDoc 注释
│       ├── controllers/      # 业务逻辑
│       ├── middleware/       # auth（JWT/RBAC）、validate（Zod）、error（404/异常）
│       ├── validations/      # 各模块 Zod schema
│       ├── schedule/         # GitHub Star 定时同步
│       └── utils/            # logger / resp / apiError / pagination
├── Frontend/                 # 前端工程
│   └── src/
│       ├── api/              # Axios 封装与接口定义
│       ├── views/            # 首页 / 技术总览 / 榜单 / FAQ / 企业方案 / 登录 / 注册
│       ├── components/       # 导航栏等公共组件
│       ├── router/           # 路由表
│       └── styles/           # 全局样式与主题变量
├── docs/                     # 项目文档
├── nginx/                    # 生产环境 Nginx 配置
├── assets/                   # 静态素材
└── rtdetr-api/               # 独立的 RT-DETR 推理服务（可选）
```

---

## 环境要求

- Node.js ≥ 18（建议 20 LTS 及以上）
- npm ≥ 9
- MongoDB ≥ 6（本地实例或 MongoDB Atlas 云端集群均可）

---

## 启动命令

### 1. 启动后端

```bash
cd Backend
npm install          # 首次安装依赖
cp .env.example .env # Windows: copy .env.example .env，然后按需修改配置
npm run dev          # 开发模式（nodemon 热重载）
```

生产模式用 `npm start`（等价于 `node src/server.js`，无热重载）。

启动成功后：

- 服务地址：http://localhost:5000
- 健康检查：http://localhost:5000/api/health
- 接口文档：http://localhost:5000/api-docs

### 2. 启动前端

```bash
cd Frontend
npm install          # 首次安装依赖
npm run dev          # 开发模式，访问 http://localhost:5173
```

开发模式下 Vite 已将 `/api` 代理到 `http://localhost:5000`，无需额外配置跨域。

### 3. 生产构建与预览

```bash
cd Frontend
npm run build        # 产物输出到 Frontend/dist
npm run preview      # 本地预览构建结果
```

生产部署时把 `dist` 交给 Nginx 托管，并按 `nginx/` 下的配置反向代理 `/api` 到后端。

### 4. 可选：启动 RT-DETR 推理服务

```bash
cd rtdetr-api
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

启动前请把训练好的 `best.pt` 放到 `rtdetr-api/` 下与 `app.py` 同级（服务启动直接加载本地权重，不再联网下载），
接口文档见 http://localhost:8000/docs。

---

## 环境变量（Backend/.env）

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `PORT` | 否 | 服务端口，默认 5000 |
| `MONGO_URI` | 是 | MongoDB 连接串；缺失时启动直接退出 |
| `JWT_SECRET` | 是 | JWT 签名密钥；缺失时登录不可用 |
| `NODE_ENV` | 否 | `development` / `production`，默认 development，影响异常信息与 CORS 策略 |
| `CORS_ORIGINS` | 生产必填 | 允许跨域的域名白名单，多个用英文逗号分隔 |
| `GITHUB_TOKEN` | 否 | GitHub API Token，可将限流额度从 60 次/小时提升到 5000 次/小时 |

`Backend/.env` 已被 `.gitignore` 忽略，请勿提交真实密钥。

---

## 接口概览

所有接口统一返回 `{ code, message, data }`，`code` 与 HTTP 状态码一致；错误信息在生产环境不暴露内部细节。

| 前缀 | 模块 | 说明 |
| --- | --- | --- |
| `/api/users` | 用户 | 注册、登录、个人信息、资料修改、用户列表（管理员） |
| `/api/projects` | 开源榜单 | 查询公开，增删改需管理员 |
| `/api/faqs` | FAQ | 查询公开，增删改需管理员 |
| `/api/articles` | 文章 | 查询公开，增删改需管理员 |
| `/api/adverts` | 广告 | 查询公开，增删改需管理员 |
| `/api/upload` | 上传 | 图片上传（登录用户，jpg/png/gif/webp，≤2MB） |
| `/api/tasks` | 微调任务 | 登录用户的 CRUD，普通用户仅限本人任务 |
| `/api/sync` | Star 同步 | 手动触发同步、同步记录查询（管理员） |

完整字段与示例见 Swagger：http://localhost:5000/api-docs

---

## 权限模型

- 角色分 `user` / `admin` 两种，**首个注册用户自动成为管理员**，之后注册的均为普通用户。
- JWT 载荷为 `{ id, username, role }`，请求头携带 `Authorization: Bearer <token>`。
- 路由层通过 `verifyToken`（登录校验）与 `requireAdmin` / `requireRole()`（角色校验）组合控制。
- 数据层对任务模块做归属隔离：普通用户只能操作 `createdBy` 为自己的任务，越权访问统一返回 404。
- 管理员可管理全站内容、用户、图片上传、Star 同步以及所有人的任务。

---

## 关键机制说明

- **软删除**：`Article` / `Faq` / `Project` / `Advert` / `Task` 均有 `isDeleted` 字段，删除接口只标记不物理删除，列表查询自动过滤已删除数据。
- **分页搜索**：`utils/pagination.js` 提供通用分页（`page` / `pageSize` / `keyword`），单页上限 100 条；不传分页参数时返回完整数组，兼容前台展示。
- **Star 同步**：每天 02:00（Asia/Shanghai）自动执行，同步过程限流（同一时间只允许一个任务）、单仓库失败自动重试，结果写入 `SyncRecord` 便于排查。
- **日志**：winston 输出到控制台，`error` 级别同时写入 `Backend/logs/error.log`。
- **异常区分**：开发环境返回错误详情与堆栈，生产环境 5xx 仅返回「服务器内部错误」。
