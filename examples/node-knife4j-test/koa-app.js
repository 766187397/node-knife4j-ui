import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import swaggerJsdoc from 'swagger-jsdoc';
import koaSwagger from 'koa2-swagger-ui';
import Knife4jDoc from 'node-knife4j-ui';
import serve from 'koa-static';
import mount from 'koa-mount';


const app = new Koa();
const router = new Router();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser());

// Swagger配置选项
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Koa测试API',
      version: '1.0.0',
      description: '一个简单的Koa API测试服务',
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
  apis: ['./koa-app.js'] // 指定包含JSDoc注释的文件
};

// 生成Swagger规范
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 提供Swagger UI
const swaggerUi = koaSwagger.koaSwagger({
  routePrefix: '/swagger',
  swaggerOptions: {
    spec: swaggerSpec
  },
});

// 提供 Knife4j 文档
const knife4jDoc = new Knife4jDoc(swaggerSpec);
const knife4jDocPath = knife4jDoc.getKnife4jUiPath();
// koa没有自动拼接前缀，不用转请求接口的前缀
app.use(knife4jDoc.serveKoa());
// 暴露静态文件服务，没有拼接前缀，需要将静态文件分开弄
app.use(mount('/doc', serve(knife4jDocPath, { index: 'index.html' })));
app.use(serve(knife4jDocPath))


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
router.get('/test', (ctx) => {
  ctx.body = { message: '你好！' };
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
router.get('/getSwaggerSpec', (ctx) => {
  ctx.body = { swaggerSpec };
});

// 应用路由
app.use(router.routes());
app.use(router.allowedMethods());

// 应用Swagger UI
app.use(swaggerUi);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Koa服务器运行在 http://localhost:${PORT}`);
  console.log(`Swagger文档地址: http://localhost:${PORT}/swagger`);
  console.log(`Knife4j文档地址: http://localhost:${PORT}/doc`);
});

export default app;