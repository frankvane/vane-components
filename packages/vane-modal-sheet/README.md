<p align="center">
  <a href="https://www.npmjs.com/package/vane-modal-sheet"><img src="https://img.shields.io/npm/v/vane-modal-sheet.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-modal-sheet"><img src="https://img.shields.io/npm/dm/vane-modal-sheet.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>
# 底部弹层

> 插件式 React 底部弹层（snap 吸附 + 原生拖拽 + 零第三方依赖）
>
> 插件式组件：`ModalSheetCore` 是 snap/拖拽几何的唯一决策者，视觉件与行为能力全部通过插件按需组合。

## 特性

- **主要面向 PC，同时兼容触屏**：`width`（数字 px 或任意 CSS 宽度）、`horizontalAlign`（left / center / right）、`maxHeight`（数字 / `"480px"` / `"72vh"` / `"80%"`）直接控制面板尺寸与停靠；宽屏下即为居中浮窗 + 上下留白（`maxHeight` 限制高度，`ResponsivePlugin` 提供桌面态四角圆角与底部悬浮间距），触屏上仍可按住拖拽、吸附与下滑关闭
- **四向抽伸**：`placement="bottom"`（默认）/ `"top"` / `"left"` / `"right"`；纵向沿视口高、横向沿视口宽抽伸，横向的 `snapPoints` 像素值即抽屉宽度、`maxHeight` 作为高度上限并垂直居中，把手与拖拽轴随方位自动转向
- **零第三方运行时依赖**：原生 Pointer Events + CSS transform 补间，不依赖 motion / framer-motion / @react-spring
- **snap 吸附**：多档吸附点（比例/像素）、快速下滑关闭、拖出比例关闭，决策全在纯函数引擎里（CI 可全量单测）
- **插件化**：21 个内置插件（遮罩 / 把手 / 档位点 / 标题 / 步骤条 / 搜索框 / 吸底操作区 / 键盘避让 / 锁滚 / 焦点圈定 / 环境行为 / 反馈态），全部按需装配
- **进度联动**：内核逐帧写 `--vane-ms-progress` CSS 变量，插件零渲染成本做联动动画
- **可访问性**：`role=dialog` / `aria-modal` 内置；`ariaLabel` / `ariaLabelledby` 可标注名称，焦点圈定、`prefersReducedMotion` 走插件
- **client-only**：SSR 守卫，`document` 不存在时不渲染，客户端挂载后正常 portal 到 body
- TypeScript 类型完备，与 `vane-plugin-core` 共用同一套插件规范

## 插件与示例

**21 个内置插件**（A 视觉 7 / B 行为 9 / C 反馈 5）：

| 组 | 数量 | 插件 |
| --- | --- | --- |
| A 视觉 | 7 | `BackdropPlugin` / `DragHandlePlugin` / `SnapDotsPlugin` / `HeaderPlugin` / `StepFlowPlugin` / `SearchBarPlugin` / `FooterPlugin` |
| B 行为 | 9 | `KeyboardAvoidPlugin` / `ScrollLockPlugin` / `FocusTrapPlugin` / `EscClosePlugin` / `NestedScrollPlugin` / `SafeAreaPlugin` / `ResponsivePlugin` / `KeepMountedPlugin` / `HistoryPlugin` |
| C 反馈 | 5 | `ModalEffectPlugin` / `HapticsPlugin` / `AnnouncerPlugin` / `LoadingStatePlugin` / `EmptyStatePlugin` |

**11 个逐项示例**（`demo/src/demos/00–10`）：

`00 basic` / `01 multi-snap` / `02 detent-content` / `03 unstyled` / `04 keyboard-form` / `05 imperative` / `06 environment` / `07 responsive-pc` / `08 a11y-feedback` / `09 states` / `10 nested-scroll`

演示台里的**插件工坊**可勾选即装配：勾选变化直接产出真插件实例交给 HOC，装配结果与「自己写 `withModalSheetPlugins`」完全一致。

## 安装

```bash
npm install vane-modal-sheet
```

## 30 秒上手

PC 用法：定宽 560、最高 640、单档 60% 视口吸附，装配遮罩 / 把手 / 标题栏。

```tsx
import { useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";

// 模块顶层装配一次；props 变化不会重建组件类型
const Sheet = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
  createHeaderPlugin({ title: "选择联系人" }),
]);

export function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>打开</button>
      <Sheet
        isOpen={open}
        onClose={() => setOpen(false)}
        width={560}
        maxHeight={640}
        snapPoints={[0.6]}
      >
        <ul style={{ margin: 0, padding: "8px 20px 24px" }}>
          <li>Connor Smith</li>
          <li>Daniel Smith</li>
        </ul>
      </Sheet>
    </>
  );
}
```

`width={560}` 让面板在 PC 上成为居中的 560px 浮窗（`horizontalAlign` 默认 `"center"`），`maxHeight={640}` 限制高度并留出顶部空白；需要底部悬浮间距时叠加 `createResponsivePlugin()`。触屏上同一份代码照样可以拖拽。

## 不要在 render 体内装配插件

`withModalSheetPlugins` **每次调用都会返回新的组件类型**。如果在 render 体内装配，React 会把它当成另一个组件，从而卸载重挂：

```tsx
// ❌ 错误：每次 render 都重建组件类型
function Demo({ open, close }: { open: boolean; close: () => void }) {
  const Enhanced = withModalSheetPlugins(ModalSheetCore, [
    createBackdropPlugin(),
    createDragHandlePlugin(),
  ]);
  return <Enhanced isOpen={open} onClose={close} />;
}
```

典型症状：输入框失焦、`getProgress` 轮询/定时器重新开始、插件内部状态丢失、拖拽被中断。正确做法是模块顶层常量，或按勾选集合 `useMemo`：

```tsx
import { useMemo } from "react";

// ✅ 静态装配：模块顶层只执行一次
const StaticSheet = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
]);

// ✅ 动态装配：useMemo 依赖勾选集合，勾选不变就不重建
function DynamicSheet({
  selected,
  open,
  close,
}: {
  selected: string[];
  open: boolean;
  close: () => void;
}) {
  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        ...(selected.includes("backdrop") ? [createBackdropPlugin()] : []),
        ...(selected.includes("handle") ? [createDragHandlePlugin()] : []),
      ]),
    [selected]
  );
  return <Enhanced isOpen={open} onClose={close} />;
}
```

## 包体积

| 导入方式 | Gzip |
| --- | --- |
| 根入口（Core + 装配 + 类型） | ~8 KB |
| 单插件子路径 | ~1–2 KB |

## 文档

- [API](../../docs/components/vane-modal-sheet/api.md)
- [插件目录](../../docs/components/vane-modal-sheet/plugins.md)
- [组合配方](../../docs/components/vane-modal-sheet/recipes.md)

## License

MIT
