# Changelog

## 0.1.0

`@vane/plugin-core` 首个发布版本：vane 系列组件共用的插件运行时内核。

- `usePluginRuntime`：插件生命周期与上下文管理。
- `composeSlots`：插槽的组合与渲染位置裁决。
- `PluginErrorBoundary`：单插件错误隔离，避免一棵插件树带崩整页。
- `extendContext`：领域上下文注入选项。
- 卸载时先执行 `onUnmount` 链再清理插件；钩子类型改方法语法（领域可收窄 context 类型）。
- `priority` 越大越先执行（语义同向，不做反转）。

作为 `vane-lazy-image` / `vane-waterfall` 的 peer 依赖随主包一同发布。
