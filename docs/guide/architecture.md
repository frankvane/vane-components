# 架构规范（Vane Plugin Spec）

这套规范是**所有 vane 组件的宪法**。任何一个新组件，读完这一页就可以开工。

## 一句话

> 核心组件只做一件事（渲染 + 转发生命周期），其余全部能力都是插件。

## 分层

```
┌─────────────────────────────────────────────┐
│ 应用层：业务组合（presets / 配方）              │
├─────────────────────────────────────────────┤
│ 插件层：custom-plugins/*  单一职责、可插拔      │
├─────────────────────────────────────────────┤
│ 装配层：withPlugins / usePluginRuntime        │
├─────────────────────────────────────────────┤
│ 内核层：vane-plugin-core                     │
│   Bus · Manager · Sandbox · DepResolver      │
├─────────────────────────────────────────────┤
│ 核心层：XxxCore  刻意保持薄                    │
└─────────────────────────────────────────────┘
```

依赖方向只能自上而下。**核心层不允许 import 插件层**，否则核心会被插件绑架。

## 核心组件的四条义务

1. 是 `forwardRef` 组件；
2. 接收 `containerRefExternal` 并挂到根节点（插件通过 `ctx.refs.container` 拿到同一个 ref）；
3. 挂载/卸载时调用 `props.onMount` / `props.onUnmount`；
4. 原样渲染 `props.children`（插槽由 HOC 组装）。

违反任意一条，插件就收不到事件或拿不到 DOM。

## 插件契约

```ts
interface Plugin<TProps = any> {
  name: string;                 // kebab-case，全局唯一
  hooks: PluginHooks<TProps>;
  dependencies?: string[];      // 先注册依赖，再注册自己
  priority?: number;            // 越大越先执行
  sandbox?: boolean;            // 默认 true
  timeout?: number;             // 异步钩子超时，默认 3000ms
  config?: Record<string, any>; // 渲染排序用 config.order / config.slotPosition
}
```

### 钩子执行语义

| 钩子返回 | 结果 |
| --- | --- |
| `false` | 中断后续插件 |
| 其他非 `undefined/true` 的值 | 短路返回，作为 `executeHook` 的结果 |
| 抛错 | 沙箱捕获 → 记入 `manager.getErrors()` → 继续执行下一个 |

### 渲染插槽

`renderOverlay` / `renderHeader` / `renderFooter` 由 HOC **同步**调用，排序：`config.order` 升序 → `priority` 降序。

> 渲染钩子内**禁止调用 React hooks**。需要 hooks 时导出组件并渲染 `<Comp ctx={ctx} />`，或在插件组件里用 `usePluginContext()`。

## 插件数量观：多不是问题，找不到才是

按 ADR-6，插件数量**不设上限、永不淘汰**——每个插件解决一类长尾需求，而"多"的两个副作用各有便宜解法：

| 顾虑 | 解法 |
| --- | --- |
| 消费方体积膨胀 | ESM + `sideEffects: false` + 子路径导出 → 未引入的插件被 tree-shaking，零成本 |
| 选择成本高 | 业务域分组（目录 + `tags`）+ presets 配方 + 文档站自动导航 |

因此本规范要求：

- 插件按业务域分组存放，超过 20 个必须分组（可递归子分组），分组目录即导航；
- 每个包维护 3-5 个以上 **presets（配方）**，见 `docs/components/<pkg>/recipes.md`；配方是快捷方式，不是白名单；
- 插件文档必须写在 `doc.json`（机器可读，含 `tags`），不允许只写在 README 里；
- 单个插件仍受体积红线约束（见下表），防止单点失控。

## 性能红线

| 指标 | 预算 |
| --- | --- |
| `vane-plugin-core` 入口导入图 gzip | ≤ 5 KB |
| 组件包默认入口 gzip | ≤ 12 KB（`package.json` 的 `vane.sizeBudgetKb`） |
| 单插件 gzip | ≤ 2 KB |
| 每实例 Observer / 监听器 | 全局共享，不允许每实例新建 |

> 体积按「入口文件 + 其静态引入的 chunk」合计计量（多入口构建会拆出共享 chunk，只量入口文件会低估）。

红线由 `pnpm check` 在 CI 强制。
