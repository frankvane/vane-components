# vane-plugin-core

vane 插件式组件的共用内核：事件总线、插件管理器、沙箱、依赖解析、`withPlugins` HOC。所有 `vane-*` 组件包的插件能力都建立在这一个包上，**不允许各包自己复制一份**。

## 安装

```bash
npm install vane-plugin-core
```

`react` 是 peer dependency（`>=16.8`），不随包分发。

## 30 秒上手

```tsx
import {
  withPlugins,
  createPluginBus,
  type Plugin,
} from "vane-plugin-core";

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
- `enabled: false` → 插件完全停用：不参与钩子、transform 与插槽渲染；
- 依赖的插件被停用时，依赖方一并跳过（记入错误账本）；**依赖完全未注册时仍照常执行并告警**。

## 插件契约（必须遵守）

1. **transform 必须返回新对象**：`transformProps` / `transformData` 不得原地修改入参，一律返回浅拷贝或新对象，否则上层浅比较会误判、订阅方也可能读到被改写的历史值。
2. **`withPlugins` 不自动触发 `onPropsChange`**：HOC 只转发 `onMount` / `onUnmount` / `onError`；需要感知 props 变化时，由宿主 Core 自行调用 `runtime.execute("onPropsChange", prev, next)` 或改用 `usePluginRuntime` 接线。
3. **HOC 接管的 props**：`containerRefExternal`、`children`、`debug` 由 `withPlugins` 写入。宿主显式传 `containerRefExternal` 会被覆盖并打印告警；需要容器时用 `ctx.refs.container`。
4. **设备信息字段语义与稳定性**：`detectDevice()` 是模块级缓存（SSR 下返回中性值 `desktop / 1024×768 / dpr 1`）；需重新检测传 `detectDevice(true)` 或调用 `resetDeviceCache()`。`DeviceInfo.os` / `browser` **当前均为原始 UA 字符串**（不是短名），字段名与语义保持稳定；改成解析后的短名（如 `ios` / `chrome`）属于破坏性变更，**暂不提供**，下游埋点（如 vane-lazy-image）可继续按原始 UA 使用。
5. **总线写入**：`setData` 只在值变化时通知订阅方；A→B→A 的联动写入超过 50 层会被中断并告警，避免栈溢出；`getAll()` 返回无原型对象，`__proto__` 等键不会被特殊处理。
6. **`manager.clear()` 返回 `Promise<void>`**：先同步执行所有 cleanup，再等待异步 `destroy` 完成；`await manager.clear()` 用于卸载确认，忽略返回值仍与旧用法兼容。
7. **错误边界复位**：`PluginErrorBoundary` 支持 `resetKeys` / `onReset`，`resetKeys` 浅比较变化且当前处于错误态时自动复位，不会无条件重挂载子树。

## 渲染插槽

`renderOverlay` / `renderHeader` / `renderFooter` 由 HOC 同步调用，按 `config.order` 升序排列；`config.slotPosition` 控制 `before/after`。**渲染钩子内禁止调用 React hooks**——需要 hooks 时导出组件并渲染 `<Comp ctx={ctx} />`，或用 `usePluginContext()`。

## 包体积

| 入口 | Gzip |
| --- | --- |
| `vane-plugin-core` | ~2.5 KB |
| `vane-plugin-core/bus` | ~0.6 KB |

## License

MIT
