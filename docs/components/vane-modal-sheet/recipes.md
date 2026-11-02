# 底部弹层 · 组合配方

配方 = 一组插件的预设组合，用来降低「面对一堆插件不知道选谁」的成本。

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

## 推荐做法

- 常用组合沉淀为配方导出在包内（建议 3–5 个起步，不设上限），让用户免于每次自己拼；
- 配方是「快捷方式」不是「白名单」——任何插件都可以单独引入；
- **优先级分带**：遮罩 10s / 把手 20s / 头尾 30–40s / 行为 50–60s / 反馈 80s / 领域 90s，自定义插件按带取号避免同槽撞车；
- 低频/重型插件用动态导入：`const { createStepFlowPlugin } = await import("vane-modal-sheet/custom-plugins/StepFlowPlugin")`。
