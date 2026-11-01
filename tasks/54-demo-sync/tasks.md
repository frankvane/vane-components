# Demo 同步任务清单（Tasks）

> 对应 Spec：`tasks/54-demo-sync/spec.md`
> 原则：只改 demo；不改组件源码；一包一 commit。

## T1 · vane-file-preview demo 同步（P0）

- [x] T1.1 `packages/vane-file-preview/demo/src/lib/previews.tsx`
  - `pdf` 条目改为 `createPdfPreviewPlugin({ sandbox: false })`，加注释说明「本站静态可信样本」。
  - 删除 `"pdf:embed"` 条目。
  - 新增 `"pdf:sandbox"` 条目（`createPdfPreviewPlugin()`，保留默认安全策略）。
- [x] T1.2 `packages/vane-file-preview/demo/src/data/plugin-catalog.ts`
  - 删除 `pdf:embed` variant，新增 `pdf:sandbox` variant。
  - 重写 `pdf` 分组 `note`：默认 sandbox 策略 + 本页样本可信 + 为何 demo 关闭 sandbox。
- [x] T1.3 `packages/vane-file-preview/demo/src/scenarios/02-mail-attachments.tsx`
  - `createPdfPreviewPlugin({ sandbox: false })`；`meta.plugs` 补可信来源说明。
- [x] T1.4 `packages/vane-file-preview/demo/src/scenarios/03-doc-approval.tsx`
  - `createPdfPreviewPlugin({ sandbox: false })`；`meta.plugs` 补可信来源说明。
- [x] T1.5 全 demo 搜索 `pdf:embed` / `<embed>`，确保无残留引用。

验证：
- [x] `pnpm --filter vane-file-preview typecheck`
- [x] `pnpm --filter vane-file-preview lint`
- [x] `pnpm --filter vane-file-preview test`（25/25 通过）
- [x] `pnpm --filter vane-file-preview build`
- [x] `pnpm check:demo`

## T2 · vane-profile demo 文案同步（P1）

- [x] T2.1 `packages/vane-profile/demo/src/demos/05-followecho.tsx`
  - `meta.plugs[0].why` 补「`mutual` 点击即取消关注（目标态 `none`）」。
  - 补 `meta.note` 说明受控语义与真实关系回写。

验证：
- [x] `pnpm --filter vane-profile typecheck`
- [x] `pnpm --filter vane-profile lint`
- [x] `pnpm --filter vane-profile test`（3/3 通过）
- [x] `pnpm --filter vane-profile build`

## T3 · 复核「不改」的 7 个包

- [x] T3.1 复核 card：券无 `discountType`、SKU 均有 `stock`、图片为 data-URI。
- [x] T3.2 复核 comment / coupon / sign-in / sku：demo selftest 在 vitest 中执行并通过。
- [x] T3.3 复核 lazy-image：占位 SVG 为完整 `<svg>`，defs/animate 未被清洗；关键场景显式 `rootMargin`。
- [x] T3.4 复核 waterfall：Gap 无断点、FixedHeight 显式高度、A11y `enableTabIndex:false`、页码由总数计算。

## T4 · 全量门禁

- [x] T4.1 `pnpm verify`（lint / typecheck / test / check / check:structure / check:config / check:demo）exit 0。
- [x] T4.2 `git status` 确认仅 demo 文件与 `tasks/54-demo-sync/` 变更，无源码改动。

## T5 · 提交与双推

- [x] T5.1 `chore(file-preview): 同步 demo 到 sandbox/无 embed 的新行为`（含 T1 与 spec/tasks）
- [x] T5.2 `chore(profile): 同步 FollowEcho mutual 点击语义文案`（含 T2）
- [x] T5.3 `git push origin main`
- [x] T5.4 `git push github main`
- [x] T5.5 `git ls-remote` 校验 origin / github 均为最新提交，工作区 clean。
