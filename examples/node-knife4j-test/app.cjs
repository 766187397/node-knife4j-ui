const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { Knife4jDoc } = require('node-knife4j-ui');

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger配置选项
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express测试API',
      version: '1.0.0',
      description: '一个简单的Express API测试服务',
      contact: {
        name: 'API支持',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '开发服务器'
      }
    ]
  },
  apis: ['./app.cjs'] // 指定包含JSDoc注释的文件
};

// 生成Swagger规范
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 提供Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// 提供 Knife4j 文档
const knife4jDoc = new Knife4jDoc(swaggerSpec);
const knife4jDocPath = knife4jDoc.getKnife4jUiPath();
// 暴露静态文件服务
app.use('/doc', knife4jDoc.serveExpress('/doc'), express.static(knife4jDocPath));

/**
 * @swagger
 * /test:
 *   get:
 *     summary: 测试接口
 *     description: 返回简单的问候信息
 *     tags:
 *       - 测试
 *     responses:
 *       200:
 *         description: 成功返回问候信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 你好！
 */
app.get('/test', (req, res) => {
  res.json({ message: '你好！' });
});

/**
 * @swagger
 * /getSwaggerSpec:
 *   get:
 *     summary: 获取Swagger规范
 *     description: 返回完整的Swagger规范对象
 *     tags:
 *       - Swagger
 *     responses:
 *       200:
 *         description: 成功返回Swagger规范
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 swaggerSpec:
 *                   type: object
 *                   description: Swagger规范对象
 */
app.get('/getSwaggerSpec', (req, res) => {
  res.json({ swaggerSpec });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`Swagger文档地址: http://localhost:${PORT}/swagger`);
  console.log(`Knife4j文档地址: http://localhost:${PORT}/doc`);
  console.log('使用 CommonJS 导入方式');
});

module.exports = app;