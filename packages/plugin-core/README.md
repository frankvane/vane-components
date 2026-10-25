# @vane/plugin-core

vane 插件式组件的共用内核：事件总线、插件管理器、沙箱、依赖解析、`withPlugins` HOC。所有 `vane-*` 组件包的插件能力都建立在这一个包上，**不允许各包自己复制一份**。

## 安装

```bash
npm install @vane/plugin-core
```

`react` 是 peer dependency（`>=16.8`），不随包分发。

## 30 秒上手

```tsx
import {
  withPlugins,
  createPluginBus,
  type Plugin,
} from "@vane/plugin-core";

const loggerPlugin: Plugin = {
  name: "logger",
  hooks: {
    onMount: (ctx) => ctx.bus.on("ready", (d) => console.log(d)),
  },
};

const Enhanced = withPlugins(MyCore, [loggerPlugin]);
```

## 核心概念

| 概念 | 说明 |
| --- | --- |
| `Plugin` | `{ name, hooks, dependencies?, priority?, sandbox?, timeout? }` |
| `PluginHooks` | 通用钩子（onMount/onUnmount/onPropsChange/transformProps/renderXxx）+ 领域钩子索引签名 |
| `PluginBus` | 实例级事件总线：`emit/on/once/off` + `getData/setData` 跨插件共享 |
| `createPluginManager` | 注册/启停/钩子执行，执行序 = 依赖拓扑序 → 优先级降序 |
| `runHookInSandbox` | 单插件错误隔离 + 异步超时（默认 3000ms） |
| `withPlugins` | HOC：装配 runtime、转发生命周期、组装渲染插槽 |
| `usePluginRuntime` | 需要完全自定义装配时直接拿 runtime |

## 钩子执行语义

- 返回 `false` → 中断后续插件；
- 返回其他非 `undefined/true` 的值 → 短路并作为 `executeHook` 的返回值；
- 抛错 → 沙箱捕获、记入 `manager.getErrors()`、继续执行下一个插件。

## 渲染插槽

`renderOverlay` / `renderHeader` / `renderFooter` 由 HOC 同步调用，按 `config.order` 升序排列；`config.slotPosition` 控制 `before/after`。**渲染钩子内禁止调用 React hooks**——需要 hooks 时导出组件并渲染 `<Comp ctx={ctx} />`，或用 `usePluginContext()`。

## 包体积

| 入口 | Gzip |
| --- | --- |
| `@vane/plugin-core` | ~2.5 KB |
| `@vane/plugin-core/bus` | ~0.6 KB |

## License

MIT
