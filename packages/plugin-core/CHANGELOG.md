# Changelog

## 0.1.2

### Patch Changes

- 修复无关重渲染下 `transformProps` / `transformData` / `render` 钩子重复执行、以及无 `onUnmount` 钩子时清理被推迟到微任务的问题：稳定化 `orderedPlugins` 数组身份，`transform` 回调改为渲染期 ref 读取 context；卸载时若无 `onUnmount` 钩子则同步 `clear()`。新增 3 条回归测试（断言执行次数）。

## 0.1.1

### Patch Changes

- 修复槽位渲染与运行时上下文的三处缺陷。

  - `renderPluginSlot` 支持 `position: footer`：footer 槽兼容历史 `after` 与缺省声明，底部插件不再被静默过滤。
  - 槽位 key 改为按插件名生成，调整插件顺序不再导致整颗子树重挂载。
  - `usePluginRuntime` 增加浅比较稳定化，props/data 内容不变时复用引用，避免宿主重渲染打穿 context。

## 0.1.0

`vane-plugin-core` 首个发布版本：vane 系列组件共用的插件运行时内核。

- `usePluginRuntime`：插件生命周期与上下文管理。
- `composeSlots`：插槽的组合与渲染位置裁决。
- `PluginErrorBoundary`：单插件错误隔离，避免一棵插件树带崩整页。
- `extendContext`：领域上下文注入选项。
- 卸载时先执行 `onUnmount` 链再清理插件；钩子类型改方法语法（领域可收窄 context 类型）。
- `priority` 越大越先执行（语义同向，不做反转）。

作为 `vane-lazy-image` / `vane-waterfall` 的 peer 依赖随主包一同发布。
