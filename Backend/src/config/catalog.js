// 微调目录：为「新建任务」表单提供可选模型、数据集与训练方法（参考 LLaMA-Factory / LLaMA-Board）
// 说明：目录为静态配置，真实训练时由后端执行器按这些标识解析本地路径
const catalog = {
  // 可选基座模型
  models: [
    { id: 'qwen2.5-0.5b', name: 'Qwen2.5-0.5B', params: '0.5B', sizeGb: 1.2, recommendedMethod: 'lora', description: '极小参数量，适合验证流程与快速跑通训练' },
    { id: 'qwen2.5-7b', name: 'Qwen2.5-7B', params: '7B', sizeGb: 15.2, recommendedMethod: 'qlora', description: '中文能力均衡，单卡 QLoRA 即可完成领域微调' },
    { id: 'qwen2.5-14b', name: 'Qwen2.5-14B', params: '14B', sizeGb: 28.5, recommendedMethod: 'qlora', description: '效果更强，建议 24G 显存以上使用 QLoRA' },
    { id: 'llama3-8b', name: 'Llama-3-8B-Instruct', params: '8B', sizeGb: 16.1, recommendedMethod: 'qlora', description: '英文指令跟随能力强，社区数据集与模板丰富' },
    { id: 'llama3-70b', name: 'Llama-3-70B-Instruct', params: '70B', sizeGb: 141.0, recommendedMethod: 'qlora', description: '超大模型，需多卡或大显存，全参微调极易 OOM' },
    { id: 'deepseek-v2-lite', name: 'DeepSeek-V2-Lite', params: '16B', sizeGb: 32.0, recommendedMethod: 'qlora', description: 'MoE 结构轻量版本，中文与代码表现优秀' },
    { id: 'glm4-9b', name: 'GLM-4-9B-Chat', params: '9B', sizeGb: 18.6, recommendedMethod: 'qlora', description: '智谱开源对话模型，中文对齐效果好' },
    { id: 'internlm2-7b', name: 'InternLM2-7B', params: '7B', sizeGb: 14.8, recommendedMethod: 'lora', description: '书生浦语系列，长文本与工具调用能力突出' }
  ],

  // 微调方法
  methods: [
    { value: 'lora', label: 'LoRA', description: '仅训练低秩旁路矩阵，显存占用低，效果稳定，推荐首选' },
    { value: 'qlora', label: 'QLoRA', description: '基座 4/8bit 量化 + LoRA，显存再降一半以上，适合消费级显卡' },
    { value: 'full', label: '全参微调', description: '更新全部权重，效果最佳但显存需求极高，通常需要多卡' }
  ],

  // 推荐数据集（结构化示例集，便于演示）
  datasets: [
    { id: 'alpaca_zh', name: 'Alpaca 中文指令集', size: '约 5 万条', format: 'instruction/input/output', description: '通用中文指令微调，覆盖问答、创作、摘要等任务' },
    { id: 'identity_zh', name: '自我认知数据集', size: '约 1 千条', format: 'instruction/output', description: '让模型建立稳定的角色设定与自我介绍' },
    { id: 'medical_zh', name: '医疗问答数据集', size: '约 2 万条', format: 'instruction/output', description: '医疗领域知识注入，注意合规与免责声明' },
    { id: 'code_zh', name: '中文代码指令集', size: '约 3 万条', format: 'instruction/code', description: '代码生成与解释任务，适合研发助手场景' },
    { id: 'finance_zh', name: '金融研报数据集', size: '约 8 千条', format: 'instruction/output', description: '金融问答与研报摘要，适合行业客服助手' }
  ],

  // 表单默认值（贴合常见单卡微调配置）
  defaults: {
    method: 'lora',
    learningRate: 2e-4,
    epochs: 3,
    batchSize: 4,
    gradientAccumulation: 4,
    loraRank: 8,
    loraAlpha: 16,
    cutoffLen: 1024,
    quantBits: 4,
    dataset: 'alpaca_zh'
  }
}

module.exports = catalog
