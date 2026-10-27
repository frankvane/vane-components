import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface ExamplePluginConfig {
  text?: string;
}

/**
 * 插件工厂标准写法：
 *  1. 返回 Plugin 对象（name 用 kebab-case，全局唯一）；
 *  2. 挂载 meta（来自 doc.json），供 docs:plugins 生成文档与 demo 导航；
 *  3. 渲染钩子保持同步、纯净，禁止调用 React hooks。
 */
export const createExamplePlugin: PluginCreator<ExamplePluginConfig> = (config = {}) => {
  const { text = "" } = config;

  return {
    name: "example-plugin",
    version: "0.1.0",
    description: doc.description,
    config,
    hooks: {
      renderOverlay: (ctx) => {
        if (!text) return null;
        return (
          <div
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              padding: "2px 8px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              fontSize: 12,
              pointerEvents: "none",
            }}
          >
            {text}
          </div>
        );
      },
    },
  };
};

createExamplePlugin.meta = doc as PluginDoc;
