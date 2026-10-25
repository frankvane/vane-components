# 内核 API（@vane/plugin-core）

所有 vane 组件的插件能力都来自这一个包。本文是它的速查表，完整定义见 `packages/plugin-core/src/types.ts`。

## 导出总览

| 分类 | 导出 |
| --- | --- |
| 总线 | `createPluginBus` |
| 管理器 | `createPluginManager` |
| 依赖解析 | `resolveDependencyOrder` |
| 沙箱 | `runHookInSandbox`、`PluginErrorBoundary` |
| 装配 | `withPlugins`、`usePluginRuntime`、`PluginRuntimeProvider` |
| 插槽 | `renderPluginSlot`、`composeSlots` |
| 工具 | `detectDevice`（模块级缓存）、`resetDeviceCache` |

## `withPlugins(Core, plugins | config)`

```tsx
withPlugins(Core, [pluginA, pluginB]);
withPlugins(Core, { plugins: [pluginA], enableDebug: true, displayName: "MyCard" });
```

做的事：创建 runtime → 转发 `onMount` / `onUnmount` / `onError` → 注入 `containerRefExternal` → 组装插槽 → 提供 `PluginRuntimeProvider`。

## `usePluginRuntime()`

在 `withPlugins` 包装的组件内部可用：

```tsx
const { bus, context, execute, state, setState, orderedPlugins } = usePluginRuntime<MyProps>();
```

适合写"React 插件组件"——需要 hooks 时用它，而不是在渲染钩子里调 hooks。

## `PluginBus`

| 方法 | 说明 |
| --- | --- |
| `emit(event, data)` | 广播 |
| `on(event, handler)` | 订阅，返回取消函数 |
| `once(event, handler)` | 只触发一次 |
| `off(event, handler?)` | 退订（不传 handler 清空该事件） |
| `getData/setData/deleteData/hasData` | 跨插件共享数据 |
| `getAll()` / `clear()` | 全量读取 / 清空 |

## `createPluginManager(options)`

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `sandbox` | `true` | 钩子错误隔离 |
| `timeout` | `3000` | 异步钩子超时（ms） |
| `onError` | - | 错误上报回调 |

方法：`register` / `registerAll` / `unregister` / `getPlugin` / `getAllPlugins` / `getEnabledPlugins` / `getExecutionOrder` / `enable` / `disable` / `has` / `executeHook` / `clear` / `getErrors`。

## 执行顺序

```
依赖拓扑序（稳定） → priority 降序
```

- 生命周期/数据钩子走 `executeHook`（异步、沙箱、超时）；
- 渲染插槽走 `renderPluginSlot`（同步、按 `config.order` 升序）。
