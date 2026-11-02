# 底部弹层 · 组合配方

配方 = 一组插件的预设组合，用来降低「面对一堆插件不知道选谁」的成本。

> 下文示例省略了重复的插件 import：每个工厂都从 `vane-modal-sheet/custom-plugins/<Name>Plugin` 子路径引入（包 `exports` 与之一一对应）。

## 推荐组合

### 联系人选择（搜索 + 列表 + 吸底确认）

```tsx
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createSearchBarPlugin } from "vane-modal-sheet/custom-plugins/SearchBarPlugin";
import { createFooterPlugin } from "vane-modal-sheet/custom-plugins/FooterPlugin";
import { createScrollLockPlugin } from "vane-modal-sheet/custom-plugins/ScrollLockPlugin";
import { createFocusTrapPlugin } from "vane-modal-sheet/custom-plugins/FocusTrapPlugin";

export const ContactPicker = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
  createHeaderPlugin({ title: "选择联系人" }),
  createSearchBarPlugin({ placeholder: "Search" }),
  createFooterPlugin({ primaryText: "确定", onPrimary: confirm }),
  createScrollLockPlugin(),
  createFocusTrapPlugin(),
]);
```

### 分步表单（键盘避让 + 步骤条）

```tsx
export const FormSheet = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createHeaderPlugin({ title: "创建账户" }),
  createStepFlowPlugin({ steps: ["基本信息", "确认", "完成"], onFinish }),
  createKeyboardAvoidPlugin(),
  createScrollLockPlugin(),
  createFocusTrapPlugin(),
]);
```

### 轻提示面板（无遮罩、不锁背景）

```tsx
export const PeekPanel = withModalSheetPlugins(ModalSheetCore, [
  createDragHandlePlugin(),
  createSnapDotsPlugin(),
]);
// isOpen 由消费方控制；无遮罩时点击外部区域可穿透
```

### PC 居中浮窗（560 定宽 + 640 高度上限）

`width` 直接决定面板宽度，`maxHeight` 限制高度并留出顶部空白，`horizontalAlign="center"` 让它在 PC 视口里居中；需要底部悬浮间距时叠加 `createResponsivePlugin()`。同一份代码在触屏上仍可拖拽。

```tsx
import { useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";

// 模块顶层装配一次，width / maxHeight 变化只改 props，不重建组件类型
const PcDialog = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
  createHeaderPlugin({ title: "编辑资料" }),
]);

export function PcDialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>打开</button>
      <PcDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        width={560}
        maxHeight={640}
        horizontalAlign="center"
        snapPoints={[0.6]}
      >
        <p style={{ padding: "8px 20px 24px" }}>PC 下是居中浮窗，上下留白。</p>
      </PcDialog>
    </>
  );
}
```

需要窄屏自动回到底部弹层时，再叠加 `createResponsivePlugin()`（宽屏限宽 + 四角圆角 + 悬浮间距，窄屏保持 bottom sheet）。

### 四向抽伸（右侧 / 左侧抽屉）

`placement` 决定面板从哪条边滑入：`bottom`（默认）/ `top` / `left` / `right`。纵向方位沿视口高抽伸（`snapPoints` 比例按高度折算，`width` / `horizontalAlign` 生效）；横向方位沿视口宽抽伸，`snapPoints` 的像素值就是抽屉宽度，`maxHeight` 变为高度上限并垂直居中。拖拽轴与把手方向随方位自动切换。

```tsx
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createEscClosePlugin } from "vane-modal-sheet/custom-plugins/EscClosePlugin";

const Drawer = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
  createHeaderPlugin({ title: "筛选" }),
  createEscClosePlugin(),
]);

export function RightDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      placement="right"
      snapPoints={[360]}   // 横向方位：像素值即抽屉宽度
      maxHeight={520}      // 横向方位：高度上限并垂直居中
    >
      抽屉内容
    </Drawer>
  );
}
```

打开态也可以切换 `placement`：它被纳入几何签名，变化时会即时重新测量并保持当前档，不会关闭重开。

### 打开中切换 snapPoints / detent / maxHeight

内核把 `placement` / `snapPoints` / `detent` / `maxHeight` / `initialSnap` 作为几何签名：变化时自动重新测量，并在打开态用当前档索引吸附（索引超出则夹到最后一档）。**不会关闭重开**，打开进度与拖拽状态保持连续。

```tsx
import { useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";

const LiveSheet = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
  createHeaderPlugin({ title: "动态几何" }),
]);

export function LiveGeometryExample() {
  const [open, setOpen] = useState(false);
  const [snapPoints, setSnapPoints] = useState<number[]>([0.4, 0.8]);
  const [detent, setDetent] = useState<"default" | "content" | "full">("default");
  const [maxHeight, setMaxHeight] = useState<number | string>(480);

  const switchGeometry = () => {
    setSnapPoints([0.35, 0.7, 0.95]);
    setDetent("content");
    setMaxHeight("72vh");
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>打开</button>
      <button type="button" onClick={switchGeometry}>切换几何</button>
      <LiveSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        snapPoints={snapPoints}
        detent={detent}
        maxHeight={maxHeight}
      >
        <p style={{ padding: "8px 20px 24px" }}>切换后保持当前档位，不重开。</p>
      </LiveSheet>
    </>
  );
}
```

### 不要在 render 里装配 HOC

`withModalSheetPlugins` 每次调用都返回新的组件类型；在 render 体内装配会让 React 把面板当成新组件，触发卸载重挂。症状包括输入失焦、`progress` 轮询/定时器重新开始、插件内部状态丢失、拖拽中断。

```tsx
// ❌ 错误：render 体内每次重建组件类型
function BadSheet({ open, close }: { open: boolean; close: () => void }) {
  const Enhanced = withModalSheetPlugins(ModalSheetCore, [
    createBackdropPlugin(),
    createDragHandlePlugin(),
  ]);
  return <Enhanced isOpen={open} onClose={close} />;
}
```

```tsx
import { useMemo } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";

// ✅ 静态装配：模块顶层常量
const StaticSheet = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
]);

// ✅ 动态装配：useMemo 依赖勾选集合
export function WorkshopSheet({ selected }: { selected: string[] }) {
  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        ...(selected.includes("backdrop") ? [createBackdropPlugin()] : []),
        ...(selected.includes("handle") ? [createDragHandlePlugin()] : []),
      ]),
    [selected]
  );
  return <Enhanced isOpen onClose={() => {}} />;
}
```

## 从 react-modal-sheet 迁移

| react-modal-sheet | vane-modal-sheet |
| --- | --- |
| `<Sheet isOpen onClose snapPoints initialSnap detent>` | 同名 props 直接对应 |
| `<Sheet.Container>` + `<Sheet.Content>` | 不需要容器组件；`children` 直接进内容区 |
| `<Sheet.Header>` | `createHeaderPlugin()`（`renderHeader` 槽） |
| `<Sheet.Backdrop>` | `createBackdropPlugin()`（`renderBackdrop` 槽） |
| `useSheetRef().current.snapTo(i)` | `ref.snapTo(i)`（关闭中 / 已关闭时 no-op） |
| `onSnap` | `onSnap`（HOC 会在其上再跑插件 `onSnap` 钩子链） |

本项目**零 motion / framer-motion / @react-spring 依赖**：补间由内核直接写 CSS transform + 计时器完成。进度不是 motion value，而是 `ctx.progress` / `ref.getProgress()` getter，同时逐帧写 `--vane-ms-progress` CSS 变量供样式联动。

## 推荐做法

- 常用组合沉淀为配方导出在包内（建议 3–5 个起步，不设上限），让用户免于每次自己拼；
- 配方是「快捷方式」不是「白名单」——任何插件都可以单独引入；
- **优先级分带**：遮罩 10s / 把手 20s / 头尾 30–40s / 行为 50–60s / 反馈 80s / 领域 90s，自定义插件按带取号避免同槽撞车；
- 低频/重型插件用动态导入：`const { createStepFlowPlugin } = await import("vane-modal-sheet/custom-plugins/StepFlowPlugin")`。
