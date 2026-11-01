# 弹幕 · API

## `DanmakuCore`（canvas 渲染内核）

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `DanmakuItem[]` | `[]` | 弹幕数据（已按 `transformData` 富化/过滤；无插件时即原始列表） |
| `currentTime` | `number` | `0` | 当前播放时间（秒），驱动哪些弹幕可见 |
| `playing` | `boolean` | `true` | 是否播放中；暂停时弹幕静止（仍绘制当前帧） |
| `trackHeight` | `number` | `28` | 轨道高度（px） |
| `baseFontSize` | `number` | `22` | 基础字号（px） |
| `opacity` | `number` | `1` | 全局不透明度 0–1 |
| `containerClassName` | `string` | - | 容器类名 |
| `containerStyle` | `React.CSSProperties` | - | 容器样式（需给出明确尺寸，canvas 才能测量） |
| `avoidZoneProvider` | `() => Rect[]` | - | 避让区来源（由 `withDanmakuPlugins` 从运行时 shared 桥接）。内核每帧读取：轨道调度优先避开，绘制期再做 `evenodd` 裁剪把避让区挖空 |
| `topInset` / `bottomInset` | `number` | `0` | 顶部/底部安全区（px），给统计条、输入框等浮层控件留位，弹幕不渲染到这里 |
| `onMount` / `onUnmount` | `() => void` | - | 挂载/卸载回调（会被插件钩子转发） |
| `debug` | `boolean` | `false` | 打印插件注册与钩子日志 |

### Ref（`DanmakuCoreRef`）

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取根 DOM |
| `forceUpdate()` | 强制刷新 |
| `getSize()` | 取容器尺寸 |
| `getCanvas()` | 取 canvas 元素（消费方做截图 / 接 MediaPipe 帧源） |
| `getStats()` | `{ active, dropped }`：当前在飞条数（真正参与绘制的量，出画即回收）与本周期因饱和被丢弃的条数 |

## `withDanmakuPlugins(Core, plugins)`

把插件装配到核心组件上（领域 HOC，跑 `transformData` 数据面链路 + 桥接防遮挡避让区）。两种写法等价：

```tsx
withDanmakuPlugins(DanmakuCore, [createSensitiveFilterPlugin()]);
withDanmakuPlugins(DanmakuCore, { plugins: [createSensitiveFilterPlugin()], enableDebug: true });
```

## `DanmakuItem`

```ts
interface DanmakuItem {
  id: string;
  text: string;
  mode: "scroll" | "top" | "bottom" | "reverse"; // 右→左 / 顶部固定 / 底部固定 / 左→右
  time: number;                 // 出现时间（秒，相对视频）
  duration?: number;            // 飞行时长（scroll/reverse；top/bottom 作停留时长）
  meta: DanmakuMeta;            // userId / userName / level / fanBadge / isAdmin / color / fontSize / emoji
  renderHint?: DanmakuRenderHint; // 插件写这里：track / ring / pinned / masked / avoidZones
  _cmd?: DanmakuCommand;        // CmdParse 识别后不渲染，改触发动作
}
```

**铁律**：插件绝不直绘 canvas，只通过 `transformData` 改 `DanmakuItem`（过滤/富化/重排/拦截指令）并写 `renderHint`，由内核渲染器消费。

## 插件接口

```ts
interface Plugin<TProps = any> {
  name: string;                 // 唯一标识，kebab-case
  hooks: PluginHooks<TProps>;   // 通用钩子 + 领域钩子
  dependencies?: string[];      // 依赖的插件（先注册依赖）
  priority?: number;            // 越大越先执行
  sandbox?: boolean;            // 默认 true，错误隔离
  timeout?: number;             // 异步钩子超时，默认 3000ms
  config?: Record<string, any>; // 渲染排序用 config.order / config.slotPosition
}
```

通用钩子：`onMount` / `onUnmount` / `onPropsChange` / `onError` / `transformProps` / `transformData` / `renderOverlay` / `renderHeader` / `renderFooter`。

**数据面插件**用 `transformData(context, data: DanmakuData): DanmakuData` 操作弹幕流（`DanmakuData = { items: DanmakuItem[]; now?: number }`）。**UI 面插件**用 `renderOverlay` / `renderHeader` / `renderFooter` 返回 React 节点（绝对定位浮在 canvas 之上）。

钩子返回语义：`false` 中断链；其他非 `undefined/true` 的值短路返回。

## 上下文（`DanmakuPluginContext`）

```ts
interface PluginContext<TProps = any, TData = any> {
  props: TProps;
  data: TData;                  // 弹幕领域：DanmakuData（必填）
  bus: PluginBus;               // emit/on/once/off + getData/setData
  refs: { container, getContainer };
  state: Record<string, unknown>;
  setState(patch): void;
  shared: Map<string, unknown>; // SafeZonePlugin 把避让区 provider 写到这里
  deviceInfo: DeviceInfo;
  forceUpdate(): void;
  getSize(): { width, height };
  logger: PluginLogger;
}
```

## 自定义数据面插件

```ts
import type { DanmakuPlugin } from "vane-danmaku";

export const createMyPlugin = (config = {}) => ({
  name: "my-plugin",            // kebab-case，全局唯一
  priority: 10,
  hooks: {
    transformData: (ctx, data) => {
      // 过滤 / 富化 / 重排 / 拦截指令，返回新的 data
      return data;
    },
  },
}) as DanmakuPlugin;
```
