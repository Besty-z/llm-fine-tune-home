// Swagger 接口文档配置：基于 swagger-jsdoc 扫描路由注释生成 OpenAPI 文档
const path = require('path')
const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '大模型微调技术之家 - 后端接口文档',
      version: '1.0.0',
      description: 'Express + Mongoose + JWT 后端服务接口文档，统一响应结构 { code, message, data }'
    },
    servers: [{ url: '/api', description: '当前服务' }],
    components: {
      // JWT 鉴权方式：请求头携带 Authorization: Bearer <token>
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        // 统一响应结构
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 200, description: '业务状态码，与 HTTP 状态码一致' },
            message: { type: 'string', example: 'success' },
            data: { type: 'object', nullable: true }
          }
        }
      }
    }
  },
  // 扫描路由文件中的 @swagger 注释（绝对路径 + POSIX 风格，兼容 Windows 与任意启动目录）
  apis: [path.join(__dirname, '../routes/*.js').replace(/\\/g, '/')]
}

module.exports = swaggerJsdoc(options)
