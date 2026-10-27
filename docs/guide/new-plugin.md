# 编写一个插件（SOP）

## 三件套

```
src/custom-plugins/FadeInPlugin/
├── doc.json     # 机器可读文档 —— 文档站和 npm README 的插件目录都由它生成
├── create.ts    # 工厂 + meta
└── index.ts     # 桶导出
```

### doc.json

```json
{
  "name": "FadeInPlugin",
  "description": "加载完成后淡入显示，可配置时长与缓动。",
  "since": "0.1.0",
  "tags": ["animation", "ux"],
  "config": [
    { "name": "duration", "type": "number", "default": "300", "description": "淡入时长(ms)" }
  ],
  "example": "withPlugins(Core, [createFadeInPlugin({ duration: 600 })])",
  "conflicts": []
}
```

### create.ts

```ts
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface FadeInConfig {
  duration?: number;
  easing?: string;
}

export const createFadeInPlugin: PluginCreator<FadeInConfig> = (config = {}) => {
  const { duration = 300, easing = "ease-out" } = config;
  return {
    name: "fade-in",
    version: "0.1.0",
    description: doc.description,
    config,
    hooks: {
      onMount: (ctx) => {
        const el = ctx.refs.getContainer?.();
        if (!el) return;
        el.style.transition = `opacity ${duration}ms ${easing}`;
        el.style.opacity = "0";
        const id = requestAnimationFrame(() => {
          el.style.opacity = "1";
        });
        return () => cancelAnimationFrame(id);
      },
    },
  };
};

createFadeInPlugin.meta = doc as PluginDoc;
```

### index.ts

```ts
export { createFadeInPlugin, type FadeInConfig } from "./create";
export { default as meta } from "./doc.json";
```

## 六条纪律

1. **单一职责**：一个插件只解决一个问题，不要把"淡入 + 水印 + 重试"写成一个插件；
2. **同步渲染钩子**：`renderXxx` 里禁止 React hooks；
3. **资源必须清理**：`onMount` 返回 cleanup，事件/定时器/Observer 全部回收；
4. **不碰核心**：插件通过 `ctx` 与 `bus` 通信，不允许 import 核心组件内部模块；
5. **默认值自治**：所有配置项有默认值，`createXxxPlugin()` 不传参也要能工作；
6. **错误自己吞**：可能抛错的逻辑包 try/catch，别把风险转嫁给宿主。

## 跨插件通信

```ts
// 插件 A：广播
ctx.bus.emit("sku:change", { id: 1 });

// 插件 B：订阅（在 onMount 里订阅，返回 cleanup）
onMount: (ctx) => ctx.bus.on("sku:change", (payload) => { ... });

// 跨插件共享数据（不走 React 渲染）
ctx.shared.set("price", 199);
ctx.shared.get("price");
```

事件命名：`域:动作`，如 `sku:change`、`price:change`、`analytics:exposure`。

## 优先级与排序

| 场景 | 用什么 |
| --- | --- |
| 钩子执行先后 | `priority`（越大越先） |
| 渲染插槽内顺序 | `config.order`（越小越靠前） |
| 渲染插槽位置 | `config.slotPosition`：`"before"` / `"after"` |
| 插件依赖 | `dependencies: ["other-plugin"]` |

## 重型插件：按需加载

```ts
const { createHeavyPlugin } = await import("vane-xxx/custom-plugins/HeavyPlugin");
```

## 自检清单

- [ ] `doc.json` 五个字段齐全（name/description/config/example/since）
- [ ] 工厂不传参可运行
- [ ] `onMount` 有 cleanup
- [ ] 单测覆盖默认配置与自定义配置两条路径
