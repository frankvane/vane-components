# 从零开发一个新组件（SOP）

> 目标：从 `pnpm new` 到第一个可用版本，控制在一次专注的工作时段内。

## Step 0 · 选题判定

命中 4 条以上才开工（详见《还可以开发哪些插件式组件》的结论）：

1. 核心职责能压到极薄且长期稳定；
2. 需求长尾发散（配置项会持续膨胀）；
3. 有清晰生命周期和事件可挂钩子；
4. 有天然渲染插槽（overlay / header / footer / item）；
5. 按需加载能明显省体积。

## Step 1 · 生成骨架

```bash
pnpm new vane-table --title "数据表格" --desc "插件式 React 数据表格"
pnpm install
```

会得到：

- `packages/vane-table/`（模板副本，占位符已替换）
- `docs/components/vane-table/`（文档骨架，导航自动收录）

## Step 2 · 先写核心，再写插件

顺序很重要：**核心稳定之前不要写插件**。

1. 改 `src/components/TablePlugin/TableCore.tsx`：只保留渲染 + `containerRefExternal` + `onMount/onUnmount` + `children` 透传；
2. 改 `src/components/TablePlugin/plugins/types.ts`：定义 props / ref / 领域钩子；
3. 跑 `pnpm --filter vane-table dev` 确认 demo 能跑。

自检：核心文件能否控制在 150 行以内？超过就说明有逻辑漏进核心了。

## Step 3 · 写第一个插件

复制 `custom-plugins/ExamplePlugin` → `MyPlugin`，三件套齐全：

```
doc.json     # name/description/since/tags/config/example
create.ts    # create<Name>Plugin 工厂 + .meta
index.ts     # 桶导出
```

## Step 4 · 测试

`test/` 与 `src/` 同构。最低要求：

- 插件工厂返回结构正确（name / hooks / meta）；
- `withPlugins` 装配后 `onMount` 被调用、`renderOverlay` 出现在 DOM；
- 插件抛错不影响其他插件（沙箱）。

```bash
pnpm --filter vane-table test
```

## Step 5 · 文档与体积

```bash
pnpm docs:plugins      # doc.json → plugins.md 表格 + 文档站导航
pnpm docs:sync         # docs/components/vane-table/index.md → packages/vane-table/README.md
pnpm sync:exports      # 入口 → package.json exports
pnpm build             # 构建 + 生成 d.ts
pnpm check             # 依赖声明 / README 首屏 / 体积预算
```

## Step 6 · 发版

```bash
pnpm changeset         # 选包、选 bump、写 changelog
git add -A && git commit
pnpm release:version   # 改版本 + 更新 CHANGELOG
pnpm release:publish   # 发布到 npm
```

详见[发布流程](./releasing.md)。

## 完成定义（Definition of Done）

- [ ] `pnpm verify` 全绿（lint + typecheck + test + check）
- [ ] README 首屏有 `npm install` 和 30 秒上手
- [ ] `docs/components/<pkg>/` 四个文件齐全
- [ ] 至少 1 个 preset 配方
- [ ] changeset 已提交
