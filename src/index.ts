import * as path from "path";

/**
 * Swagger/OpenAPI 文档配置接口
 */
export interface SwaggerJson {
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
}

/**
 * Knife4j 文档中间件类
 * @class
 * @typedef {Object} SwaggerJson
 */
export class Knife4jDoc {
  private swaggerJson: SwaggerJson;

  /**
   * 创建 Knife4j 文档中间件
   * @param {SwaggerJson} [swaggerJson={}] - Swagger JSON 对象
   */
  constructor(swaggerJson: SwaggerJson = {}) {
    this.swaggerJson = swaggerJson;
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
    // 保存swaggerJson引用，避免this上下文问题
    const swaggerJson = this.swaggerJson;

    return (req: any, res: any, next: any): void => {
      // 检查swaggerJson是否有效
      if (!swaggerJson || typeof swaggerJson !== "object") {
        console.error("Knife4jDoc: swaggerJson is invalid or undefined");
        res.status(500).json({
          error: "Swagger configuration is not available",
          message: "Please check if swaggerJson was properly passed to Knife4jDoc constructor",
        });
        return;
      }

      const swaggerDocs = swaggerJson;
      const groupName = req.query.groupName || "全部";

      // knife4j 接口文档配置
      if (req.url === "/v3/api-docs/swagger-config") {
        const groups = [
          {
            name: "全部",
            location: `${prefix}/api-docs/全部`,
            url: `${prefix}/api-docs/全部`,
            swaggerVersion: "3.0.0",
            servicePath: "",
          },
        ];

        // 遍历所有路径，提取分组信息
        const uniqueTags = new Set<string>();
        if (swaggerDocs.paths) {
          for (const path in swaggerDocs.paths) {
            if (swaggerDocs.paths.hasOwnProperty(path)) {
              const pathObject = swaggerDocs.paths[path];
              for (const method in pathObject) {
                if (pathObject.hasOwnProperty(method)) {
                  const operation = pathObject[method];
                  if (operation && operation.tags) {
                    operation.tags.forEach((tag: string) => {
                      uniqueTags.add(tag);
                    });
                  }
                }
              }
            }
          }
        }

        // 生成分组资源
        uniqueTags.forEach((tag: string) => {
          groups.push({
            name: tag,
            location: `${prefix}/api-docs/${tag}`,
            url: `${prefix}/api-docs/${tag}`,
            swaggerVersion: "3.0.0",
            servicePath: "",
          });
        });

        swaggerDocs.urls = groups;
        res.setHeader("Content-Type", "application/json");
        res.json(swaggerDocs);
        return;
      } else if (req.url === "/swagger-resources") {
        const groups = [
          {
            name: "全部",
            location: `${prefix}/api-docs/全部`,
            url: `${prefix}/api-docs/全部`,
            swaggerVersion: "3.0.0",
            servicePath: "",
          },
        ];

        // 遍历所有路径，提取分组信息
        const uniqueTags = new Set<string>();
        if (swaggerDocs.paths) {
          for (const path in swaggerDocs.paths) {
            if (swaggerDocs.paths.hasOwnProperty(path)) {
              const pathObject = swaggerDocs.paths[path];
              for (const method in pathObject) {
                if (pathObject.hasOwnProperty(method)) {
                  const operation = pathObject[method];
                  if (operation && operation.tags) {
                    operation.tags.forEach((tag: string) => {
                      uniqueTags.add(tag);
                    });
                  }
                }
              }
            }
          }
        }

        // 生成分组资源
        uniqueTags.forEach((tag: string) => {
          groups.push({
            name: tag,
            location: `${prefix}/api-docs/${tag}`,
            url: `${prefix}/api-docs/${tag}`,
            swaggerVersion: "3.0.0",
            servicePath: "",
          });
        });

        res.json(groups);
        return;
      } else if (req.url.startsWith("/api-docs/")) {
        const paths = swaggerDocs.paths;
        const groupPaths: { [key: string]: any } = {};

        if (groupName === "全部") {
          res.json(swaggerDocs);
          return;
        }

        if (paths) {
          for (const path in paths) {
            if (paths.hasOwnProperty(path)) {
              const pathObject = paths[path];
              for (const method in pathObject) {
                if (pathObject.hasOwnProperty(method)) {
                  const operation = pathObject[method];
                  if (operation && operation.tags && operation.tags.includes(groupName)) {
                    groupPaths[path] = groupPaths[path] || {};
                    groupPaths[path][method] = operation;
                  }
                }
              }
            }
          }
        }

        swaggerDocs.paths = groupPaths;
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
    // 保存swaggerJson引用，避免this上下文问题
    const swaggerJson = this.swaggerJson;

    return async (ctx: any, next: any): Promise<void> => {
      // 检查swaggerJson是否有效
      if (!swaggerJson || typeof swaggerJson !== "object") {
        console.error("Knife4jDoc: swaggerJson is invalid or undefined");
        ctx.status = 500;
        ctx.body = {
          error: "Swagger configuration is not available",
          message: "Please check if swaggerJson was properly passed to Knife4jDoc constructor",
        };
        return;
      }

      const swaggerDocs = swaggerJson;
      const groupName = ctx.query.groupName || "全部";

      // knife4j 接口文档配置
      if (ctx.url === "/v3/api-docs/swagger-config") {
        const groups = [
          {
            name: "全部",
            location: `${prefix}/api-docs/全部`,
            url: `${prefix}/api-docs/全部`,
            swaggerVersion: "3.0.0",
            servicePath: "",
          },
        ];

        // 遍历所有路径，提取分组信息
        const uniqueTags = new Set<string>();
        if (swaggerDocs.paths) {
          for (const path in swaggerDocs.paths) {
            if (swaggerDocs.paths.hasOwnProperty(path)) {
              const pathObject = swaggerDocs.paths[path];
              for (const method in pathObject) {
                if (pathObject.hasOwnProperty(method)) {
                  const operation = pathObject[method];
                  if (operation && operation.tags) {
                    operation.tags.forEach((tag: string) => {
                      uniqueTags.add(tag);
                    });
                  }
                }
              }
            }
          }
        }

        // 生成分组资源
        uniqueTags.forEach((tag: string) => {
          groups.push({
            name: tag,
            location: `${prefix}/api-docs/${tag}`,
            url: `${prefix}/api-docs/${tag}`,
            swaggerVersion: "3.0.0",
            servicePath: "",
          });
        });

        swaggerDocs.urls = groups;
        ctx.type = "application/json";
        ctx.body = swaggerDocs;
        return;
      } else if (ctx.url === "/swagger-resources") {
        const groups = [
          {
            name: "全部",
            location: `${prefix}/api-docs/全部`,
            url: `${prefix}/api-docs/全部`,
            swaggerVersion: "3.0.0",
            servicePath: "",
          },
        ];

        // 遍历所有路径，提取分组信息
        const uniqueTags = new Set<string>();
        if (swaggerDocs.paths) {
          for (const path in swaggerDocs.paths) {
            if (swaggerDocs.paths.hasOwnProperty(path)) {
              const pathObject = swaggerDocs.paths[path];
              for (const method in pathObject) {
                if (pathObject.hasOwnProperty(method)) {
                  const operation = pathObject[method];
                  if (operation && operation.tags) {
                    operation.tags.forEach((tag: string) => {
                      uniqueTags.add(tag);
                    });
                  }
                }
              }
            }
          }
        }

        // 生成分组资源
        uniqueTags.forEach((tag: string) => {
          groups.push({
            name: tag,
            location: `${prefix}/api-docs/${tag}`,
            url: `${prefix}/api-docs/${tag}`,
            swaggerVersion: "3.0.0",
            servicePath: "",
          });
        });

        ctx.body = groups;
        return;
      } else if (ctx.url.startsWith("/api-docs/")) {
        const paths = swaggerDocs.paths;
        const groupPaths: { [key: string]: any } = {};

        if (groupName === "全部") {
          ctx.body = swaggerDocs;
          return;
        }

        if (paths) {
          for (const path in paths) {
            if (paths.hasOwnProperty(path)) {
              const pathObject = paths[path];
              for (const method in pathObject) {
                if (pathObject.hasOwnProperty(method)) {
                  const operation = pathObject[method];
                  if (operation && operation.tags && operation.tags.includes(groupName)) {
                    groupPaths[path] = groupPaths[path] || {};
                    groupPaths[path][method] = operation;
                  }
                }
              }
            }
          }
        }

        swaggerDocs.paths = groupPaths;
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
    return path.join(__dirname, "../static");
  }
}

export default Knife4jDoc;

declare const module: NodeJS.Module;
if (typeof module !== "undefined" && module.exports) {
  (module.exports as typeof Knife4jDoc) = Knife4jDoc;
}
