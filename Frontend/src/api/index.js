import axios from 'axios'

/**
 * API 层说明
 * ----------
 * 已接入真实后端接口（USE_MOCK = false）。本地 Mock 数据保留用于离线调试，置回 true 即可切换。
 * 后端统一返回格式 { code, message, data }，下方真实请求已统一解包 data：
 *   - POST /api/users/login  登录，入参 { username, password }，data 为 { token, username, role }
 *   - GET  /api/projects     开源项目榜单（后端定时调用 GitHub API 更新 star 数并按 star 降序）
 *   - GET  /api/faqs         FAQ 问答列表
 */
const USE_MOCK = false

// Axios 实例：统一 baseURL、超时与鉴权头
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：自动携带 token
request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一提取后端 { code, message } 中的错误信息，页面直接展示
request.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message || '网络请求失败'
    return Promise.reject(new Error(message))
  }
)

/* ================= 鉴权相关 ================= */

const TOKEN_KEY = 'llm_finetune_token'
const USERNAME_KEY = 'llm_finetune_username'
/** 登录状态变化事件名（NavBar 等组件监听以刷新 UI） */
export const AUTH_CHANGE_EVENT = 'llm-auth-change'

/** 获取本地存储的 token */
export const getToken = () => localStorage.getItem(TOKEN_KEY)

/** 获取本地存储的用户名 */
export const getUsername = () => localStorage.getItem(USERNAME_KEY)

/** 保存登录态并广播事件 */
export const saveAuth = (token, username) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USERNAME_KEY, username)
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

/** 清除登录态并广播事件 */
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

/**
 * 登录
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise<{token: string, username: string}>}
 */
export const login = (username, password) => {
  if (USE_MOCK) {
    // Mock：任意非空账号密码即可登录，1 秒延迟模拟网络
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username && password) {
          resolve({ token: `mock-token-${Date.now()}`, username })
        } else {
          reject(new Error('用户名或密码不能为空'))
        }
      }, 1000)
    })
  }
  // 真实接口：后端返回 { code, message, data }，取 data（{ token, username, role }）
  return request.post('/users/login', { username, password }).then((res) => res.data.data)
}

/**
 * 注册
 * @param {string} username 用户名（2-20 位）
 * @param {string} password 密码（6-64 位）
 * @returns {Promise<{id: string, username: string, role: string}>}
 */
export const register = (username, password) => {
  if (USE_MOCK) {
    // Mock：任意非空账号密码即可注册成功
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username && password) {
          resolve({ id: `mock-${Date.now()}`, username, role: 'user' })
        } else {
          reject(new Error('用户名或密码不能为空'))
        }
      }, 800)
    })
  }
  // 真实接口：取 data（{ id, username, role }）；首个注册用户自动成为管理员
  return request.post('/users/register', { username, password }).then((res) => res.data.data)
}

/* ================= 开源项目榜单 ================= */

/**
 * 榜单 Mock 数据：大模型微调相关开源项目
 * 后端联调说明：后端定时任务调用 GitHub REST API（GET /repos/{owner}/{repo}）
 * 更新 stargazers_count，并按 star 降序返回，字段保持一致即可。
 */
const MOCK_PROJECTS = [
  {
    id: 1,
    name: 'LLaMA-Factory',
    githubUrl: 'https://github.com/hiyouga/LLaMA-Factory',
    description: '简单易用的大模型微调框架，支持 100+ 模型的 LoRA/QLoRA/全参微调，内置 Web UI 与丰富训练特性。',
    stars: 42500
  },
  {
    id: 2,
    name: 'unsloth',
    githubUrl: 'https://github.com/unslothai/unsloth',
    description: '主打极致性能的微调库：2 倍提速、显存占用降低 70%+，一行代码微调 Llama、Qwen、DeepSeek 等模型。',
    stars: 38200
  },
  {
    id: 3,
    name: 'DeepSpeed',
    githubUrl: 'https://github.com/microsoft/DeepSpeed',
    description: '微软开源的深度学习训练优化库，ZeRO 系列显存优化技术是大模型全参数微调的基础设施。',
    stars: 37100
  },
  {
    id: 4,
    name: 'PEFT',
    githubUrl: 'https://github.com/huggingface/peft',
    description: 'HuggingFace 官方参数高效微调库，统一封装 LoRA、Prefix-Tuning、P-Tuning、AdaLoRA 等主流方法。',
    stars: 19800
  },
  {
    id: 5,
    name: 'ms-swift',
    githubUrl: 'https://github.com/modelscope/ms-swift',
    description: '魔搭社区推出的大模型与多模态大模型微调推理框架，覆盖 Qwen 全系列及 500+ 文本、200+ 多模态模型。',
    stars: 9400
  },
  {
    id: 6,
    name: 'axolotl',
    githubUrl: 'https://github.com/axolotl-ai-cloud/axolotl',
    description: '以 YAML 配置驱动的大模型微调工具，支持 FSDP、DeepSpeed 及多种注意力优化，社区模板丰富。',
    stars: 10300
  },
  {
    id: 7,
    name: 'TRL',
    githubUrl: 'https://github.com/huggingface/trl',
    description: 'HuggingFace 强化学习微调库，提供 SFT、DPO、PPO、ORPO、KTO 等对齐训练的完整工具链。',
    stars: 13100
  },
  {
    id: 8,
    name: 'ColossalAI',
    githubUrl: 'https://github.com/hpcaitech/ColossalAI',
    description: '大规模分布式训练框架，提供并行策略与显存优化方案，常用于大模型预训练与全参微调。',
    stars: 39600
  },
  {
    id: 9,
    name: 'LitGPT',
    githubUrl: 'https://github.com/Lightning-AI/litgpt',
    description: 'Lightning AI 出品的单文件实现风格大模型工具箱，覆盖预训练、微调与部署全流程。',
    stars: 14900
  },
  {
    id: 10,
    name: 'torchtune',
    githubUrl: 'https://github.com/pytorch/torchtune',
    description: 'PyTorch 原生的大模型微调库，代码简洁透明，支持 Llama 等主流模型的 LoRA/QLoRA/全参微调。',
    stars: 6200
  }
]

/**
 * 获取开源项目榜单
 * 返回按 star 降序排序的项目列表
 * @returns {Promise<Array<{id:number, name:string, githubUrl:string, description:string, stars:number}>>}
 */
export const fetchProjectRanking = () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟后端行为：返回前按 star 降序排序
        resolve([...MOCK_PROJECTS].sort((a, b) => b.stars - a.stars))
      }, 600)
    })
  }
  // 真实接口：后端已按 stars 降序排序，取 data 数组
  return request.get('/projects').then((res) => res.data.data)
}

/* ================= FAQ 问答 ================= */

/** FAQ Mock 数据 */
const MOCK_FAQS = [
  {
    id: 1,
    question: '什么是大模型微调（Fine-tuning）？',
    answer:
      '微调是指在预训练大模型的基础上，使用特定领域或特定任务的数据继续训练，使模型掌握领域知识或对齐人类偏好。相比从头训练，微调成本更低、见效更快，是落地行业大模型的主流路径。'
  },
  {
    id: 2,
    question: '全参数微调、LoRA、QLoRA 有什么区别？',
    answer:
      '全参数微调更新模型全部权重，效果最好但显存开销巨大；LoRA 通过低秩矩阵旁路注入可训练参数，仅需训练 0.1%~1% 的参数；QLoRA 在 LoRA 基础上将基座模型量化为 4bit，进一步大幅降低显存，让单张消费级显卡也能微调大模型。'
  },
  {
    id: 3,
    question: '微调需要多少数据量？',
    answer:
      '取决于任务复杂度：指令微调（SFT）通常数千到数十万条高质量样本即可见效，数据质量远比数量重要；领域知识注入可能需要更大规模语料。建议从小规模高质量数据起步，通过评估迭代扩充。'
  },
  {
    id: 4,
    question: '微调榜单上的 Star 数量是实时更新的吗？',
    answer:
      '本站 Star 数据由后端服务定时调用 GitHub API 采集更新（非实时），并按 Star 数量自动排序。页面展示的是最近一次采集的数据快照。'
  },
  {
    id: 5,
    question: '微调后的模型如何评估效果？',
    answer:
      '常见方式包括：构建领域测试集做自动评测（如准确率、BLEU、ROUGE）、使用通用基准（MMLU、C-Eval、CMMLU）回归测试防止能力遗忘，以及人工盲评对比微调前后的回答质量。生产环境建议结合线上 A/B 测试。'
  },
  {
    id: 6,
    question: 'SFT 之后还需要 DPO / RLHF 吗？',
    answer:
      'SFT 解决「会做」的问题，DPO/RLHF 解决「做得好」的问题。如果场景对回答风格、安全性、偏好对齐要求较高（如客服、创作），建议在 SFT 之后增加偏好对齐训练；结构化抽取等确定性任务通常 SFT 即可。'
  }
]

/**
 * 获取 FAQ 问答列表
 * @returns {Promise<Array<{id:number, question:string, answer:string}>>}
 */
export const fetchFaqList = () => {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_FAQS]), 400))
  }
  // 真实接口：取 data 数组
  return request.get('/faqs').then((res) => res.data.data)
}
