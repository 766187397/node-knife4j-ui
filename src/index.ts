import * as path from "path";
import type { OpenAPIObject } from "@nestjs/swagger";

/**
 * Swagger/OpenAPI 文档配置接口
 */
export type SwaggerJson =
  | OpenAPIObject
  | {
      openapi?: string;
      info?: {
        title?: string;
        version?: string;
        description?: string;
      };
      paths?: {
        [path: string]: {
          [method: string]: {
            tags?: string[];
            summary?: string;
            description?: string;
            responses?: {
              [status: string]: {
                description?: string;
              };
            };
          };
        };
      };
      [key: string]: any;
    };

/**
 * Knife4j 文档中间件类
 * @class
 * @typedef {Object} SwaggerJson
 */
export class Knife4jDoc {
  private swaggerJson: SwaggerJson;
  private name: string;

  /**
   * 创建 Knife4j 文档中间件
   * @param {SwaggerJson} [swaggerJson={}] - Swagger JSON 对象
   */
  constructor(swaggerJson: SwaggerJson = {}, name: string = "API接口文档") {
    this.swaggerJson = swaggerJson;
    this.name = name;
  }

  /**
   * 获取 Swagger JSON 配置
   * @returns {SwaggerJson} Swagger JSON 配置
   */
  getSwaggerJson(): SwaggerJson {
    return this.swaggerJson;
  }

  /**
   * 服务 Knife4j 文档接口，返回 Express 中间件函数
   * @param {string} [prefix=''] - 路径前缀，默认为空字符串，要求和 静态文件路径前缀一致，如果静态文件路径为'/'，则不需要传
   * 示例：
   * ```javascript
   * const knife4jDoc = new Knife4jDoc(swaggerSpec);
   * const knife4jDocPath = knife4jDoc.getKnife4jUiPath();
   * // 静态文件为'/', 则不需要传prefix
   * app.use('/', knife4jDoc.serve(), express.static(knife4jDocPath));
   * // 静态文件为'/doc', 则需要传'/doc'
   * app.use('/doc', knife4jDoc.serve('/doc'), express.static(knife4jDocPath));
   * ```
   * @returns {(req: any, res: any, next: any) => void} Express 中间件函数
   */
  serveExpress(prefix: string = ""): (req: any, res: any, next: any) => void {
    const swaggerJson = this.swaggerJson;

    return (req: any, res: any, next: any): void => {
      if (!swaggerJson || typeof swaggerJson !== "object") {
        console.error("Knife4jDoc: swaggerJson is invalid or undefined");
        res.status(500).json({
          error: "Swagger configuration is not available",
          message: "Please check if swaggerJson was properly passed to Knife4jDoc constructor",
        });
        return;
      }

      const swaggerDocs = JSON.parse(JSON.stringify(this.swaggerJson));
      if (req.url === "/services.json") {
        const services = [
          {
            name: this.name,
            url: `${prefix}/swagger.json`,
            location: this.getSwagger(),
            swaggerVersion: "3.0.0",
          },
        ];
        res.json(services);
        return;
      } else if (req.url === `${prefix}/swagger.json`) {
        res.json(swaggerDocs);
        return;
      } else {
        next();
      }
    };
  }

  /**
   * 服务 Knife4j 文档接口，返回 Koa 中间件函数
   * @param {string} [prefix=''] - 路径前缀，默认为空字符串，要求和 静态文件路径前缀一致，如果静态文件路径为'/'，则不需要传
   * 示例：
   * ```javascript
   * const knife4jDoc = new Knife4jDoc(swaggerSpec);
   * const knife4jDocPath = knife4jDoc.getKnife4jUiPath();
   * // 静态文件为'/', 则不需要传prefix
   * app.use(knife4jDoc.serveKoa());
   * app.use(koaStatic(knife4jDocPath));
   * // 静态文件为'/doc', 则需要传'/doc'
   * app.use(koaMount('/doc', knife4jDoc.serveKoa('/doc')));
   * app.use(koaMount('/doc', koaStatic(knife4jDocPath)));
   * ```
   * @returns {(ctx: any, next: any) => Promise<void>} Koa 中间件函数
   */
  serveKoa(prefix: string = ""): (ctx: any, next: any) => Promise<void> {
    const swaggerJson = this.swaggerJson;

    return async (ctx: any, next: any): Promise<void> => {
      if (!swaggerJson || typeof swaggerJson !== "object") {
        console.error("Knife4jDoc: swaggerJson is invalid or undefined");
        ctx.status = 500;
        ctx.body = {
          error: "Swagger configuration is not available",
          message: "Please check if swaggerJson was properly passed to Knife4jDoc constructor",
        };
        return;
      }

      const swaggerDocs = JSON.parse(JSON.stringify(this.swaggerJson));
      if (ctx.url === "/services.json") {
        const services = [
          {
            name: this.name,
            url: `${prefix}/swagger.json`,
            location: this.getSwagger(),
            swaggerVersion: "3.0.0",
          },
        ];
        ctx.body = services;
        return;
      } else if (ctx.url === `${prefix}/swagger.json`) {
        ctx.body = swaggerDocs;
        return;
      } else {
        await next();
      }
    };
  }

  /**
   * 暴露 Knife4j UI 静态资源路径给调用者使用
   * @returns {string} 静态资源路径
   */
  getKnife4jUiPath(): string {
    // 使用 process.cwd() 获取当前工作目录，然后拼接静态资源路径
    // 这样可以在 ES Modules 和 CommonJS 环境中都正常工作
    return path.join(process.cwd(), "node_modules/node-knife4j-ui/static");
  }

  private getSwagger() {
    return path.join(process.cwd(), "static/swagger.json");
  }
}

export default Knife4jDoc;
