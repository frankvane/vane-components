# 底部弹层 · API

## `ModalSheetCore`

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `isOpen` | `boolean` | 必填 | 受控开关；置为 `false` 时先跑关闭补间（默认 240ms）再卸载，且外部关闭不重复回调用户 `onClose` |
| `onClose` | `() => void` | - | 关闭回调（拖拽关闭 / `close()` / 插件触发统一走这里） |
| `snapPoints` | `number[]` | `[1]` | 吸附点，升序；0–1 = 抽伸轴尺寸比例（纵向按视口高、横向按视口宽），>1 = 像素 |
| `initialSnap` | `number` | `0` | 初始吸附档索引（0 = 最高档） |
| `detent` | `"default" \| "content" \| "full"` | `"default"` | 尺寸语义：按 snapPoints / 按内容自然尺寸 / 满视口 |
| `placement` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | 抽伸方位：纵向（bottom/top）沿视口高、横向（left/right）沿视口宽；横向的 `snapPoints` 像素值即抽屉宽度，拖拽轴与把手方向自动切换 |
| `dragVelocityThreshold` | `number` | `500` | 快速下滑关闭速度阈值（px/s） |
| `dragCloseThreshold` | `number` | `0.6` | 拖出比例关闭阈值（0–1） |
| `tweenDuration` | `number` | `240` | 补间时长 ms |
| `prefersReducedMotion` | `boolean` | `false` | 跳过动画（无障碍） |
| `zIndex` | `number` | `1000` | 弹层根节点 z-index |
| `width` | `number \| string` | `"100%"` | 面板宽度：数字按 px，字符串按任意 CSS 宽度；PC 浮窗常用 `width={560}`；横向方位（left/right）忽略，抽屉宽度由 `snapPoints` 决定 |
| `maxHeight` | `number \| string` | 不设（无上限） | 面板最大高度：数字按 px，字符串支持 `"480px"` / `"72vh"` / `"80%"`（`vh` / `%` 按视口高度换算）；非法或 ≤0 视为无上限，每档尺寸都会夹到该值；横向方位下作为交叉轴（高度）上限并垂直居中 |
| `horizontalAlign` | `"left" \| "center" \| "right"` | `"center"` | 面板水平停靠；仅纵向方位且 `width` 非全宽时生效（PC 浮窗常用 `"center"`，全宽时无视觉差异） |
| `ariaLabel` | `string` | - | 无障碍名称；与 `ariaLabelledby` 都为空时不写 aria 名称属性 |
| `ariaLabelledby` | `string` | - | 关联标题元素的 id（与 `HeaderPlugin` 的 `titleId` 配套） |
| `onSnap` / `onOpen` | 回调 | - | 吸附 / 打开补间完成（HOC 会在其上再跑插件钩子链） |
| `panelStyle` / `contentStyle` | `React.CSSProperties` | - | 面板 / 内容区样式覆盖（背景色等 token） |
| `containerClassName` / `containerStyle` | - | - | 弹层根节点类名/样式 |
| `onMount` / `onUnmount` | `() => void` | - | 挂载/卸载回调（会被插件钩子转发） |
| `debug` | `boolean` | `false` | 打印插件注册与钩子日志 |

### Ref

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取弹层根 DOM |
| `getPanel()` | 取面板 DOM |
| `snapTo(index)` | 吸附到指定档；关闭中 / 已关闭时 no-op |
| `close()` | 关闭（带补间，时长由 `tweenDuration` 控制） |
| `getProgress()` | 取当前打开进度（0–1） |
| `getCurrentSnap()` | 取当前档索引 |
| `setViewportInset(px)` | 设置视口占用 inset（键盘避让用） |
| `getDragProps()` | 取拖拽面 props（spread 到任意元素即成拖拽面） |
| `forceUpdate()` | 强制刷新 |

关闭语义：

- `ref.snapTo(index)` 在 `closing` / `closed` 阶段是 **no-op**，不会把面板从关闭态拉回；
- 父级把 `isOpen` 置为 `false` 时，内核先跑 240ms 关闭补间（可用 `tweenDuration` 调整），补间完成后才卸载 portal；
- 这次**外部受控关闭不再重复调用用户的 `onClose`**（父级已经知道关闭发生），插件的 `onClose` 钩子仍会执行收尾。

## `withModalSheetPlugins(Core, plugins)`

把插件装配到核心组件上。两种写法等价：

```tsx
withModalSheetPlugins(ModalSheetCore, [createBackdropPlugin()]);
withModalSheetPlugins(ModalSheetCore, { plugins: [createBackdropPlugin()], enableDebug: true });
```

装配后插件经领域上下文拿到时基值（全部 getter，拖拽中逐帧新鲜）：

```ts
ctx.progress;        // 0–1 打开进度
ctx.currentSnap;     // 当前档索引
ctx.height;          // 面板可见高度 px
ctx.snapCount;       // 档数
ctx.snapTo(i);       // 吸附
ctx.close();         // 关闭
ctx.getDragProps();  // 拖拽面注册
ctx.setViewportInset(px); // 键盘避让通知内核
```

## 插件接口

```ts
interface Plugin<TProps = any> {
  name: string;                 // 唯一标识，kebab-case
  hooks: ModalSheetPluginHooks; // 通用钩子 + 领域钩子
  dependencies?: string[];      // 依赖的插件（先注册依赖）
  priority?: number;            // 越大越先执行；槽位内越大越靠后
  sandbox?: boolean;            // 默认 true，错误隔离
  config?: Record<string, any>; // 渲染排序用 config.order
}
```

通用钩子：`onMount` / `onUnmount` / `onPropsChange` / `onError` / `transformProps` / `transformData` / `renderOverlay` / `renderHeader` / `renderFooter`。

领域钩子（`plugins/types.ts`）：

| 钩子 | 说明 |
| --- | --- |
| `renderBackdrop(ctx)` | 遮罩槽（面板背后） |
| `renderHandle(ctx)` | 把手槽（面板顶部，常兼拖拽面） |
| `onSnap(ctx, index)` | 吸附完成 |
| `onOpen(ctx)` / `onClose(ctx)` | 打开/关闭补间完成 |

槽位渲染顺序：`config.order` 升序 → `priority` 降序；单插件抛错由错误边界隔离。

## CSS Tokens

| Token | 默认值 | 说明 |
| --- | --- | --- |
| `--vane-ms-progress` | 内核写入 | 打开进度 0–1（联动动画用，勿手写） |
| `--vane-modal-sheet-bg` | `#ffffff` | 面板背景 |
| `--vane-modal-sheet-ink` | `#1f2329` | 面板文字色 |
| `--vane-modal-sheet-radius` | `16px` | 面板顶部圆角 |
| `--vane-modal-sheet-primary` | `#1f2329` | 主按钮/进度条强调色 |
| `--vane-modal-sheet-handle` | `#6b7280` | 把手颜色 |
| `--vane-modal-sheet-dot` / `-dot-active` | `#7c8288` / `#1f2329` | 档位点颜色 |
| `--vane-modal-sheet-muted` | `#5d636a` | 次要文字色 |

## 自定义插件

```tsx
import type { ModalSheetPluginCreator } from "vane-modal-sheet";

export interface MyPluginConfig {
  text?: string;
}

export const createMyPlugin: ModalSheetPluginCreator<MyPluginConfig> = (config = {}) => ({
  name: "my-plugin",
  config,
  priority: 90,
  hooks: {
    onSnap(ctx, index) {
      // 吸附后触发；改闭包状态后记得 ctx.forceUpdate()
    },
    renderHandle(ctx) {
      const drag = ctx.getDragProps();
      return <div {...drag}>拖我</div>;
    },
  },
});
```
