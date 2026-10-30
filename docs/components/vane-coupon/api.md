# 优惠券 · API

## `CouponData`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 稳定标识 |
| `title` | `string` | 券名称 |
| `amount` | `number` | 面额（cash=元 / discount=折扣值，如 8.5） |
| `amountType?` | `"cash" \| "discount"` | 面额形态，默认 cash |
| `threshold?` | `number` | 使用门槛（满 X 元可用），0/undefined = 无门槛 |
| `thresholdText?` | `string` | 自定义门槛文案（覆盖默认推导） |
| `rules?` | `string[]` | 使用规则条目 |
| `validFrom?` / `validTo?` | `number` | 绝对有效期（epoch ms） |
| `validDays?` | `number` | 相对有效期（领取后 N 天） |
| `total?` / `claimed?` | `number` | 发放总量 / 已领取 |
| `stackable?` | `boolean` | 是否可叠加 |

## `CouponCore`

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `coupon` | `CouponData` | 券面数据 |
| `containerClassName` | `string` | 容器类名 |
| `containerStyle` | `React.CSSProperties` | 容器样式 |
| `onMount` / `onUnmount` | `() => void` | 挂载/卸载回调 |
| `debug` | `boolean` | 打印插件注册与钩子日志 |

`phase` 与 `slots` 由 `withPlugins` 注入，宿主一般不直接传。

### Ref

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取根 DOM |
| `forceUpdate()` | 强制刷新 |
| `getSize()` | 取容器尺寸 |
| `getPhase()` | 当前领取相位（裸核心返回 undefined） |

## `createCouponCard(plugins)`

把插件装配到 `CouponCore` 上，返回可直接使用的组件：

```tsx
const Coupon = createCouponCard([createClaimStatePlugin()]);
```

`withPlugins(CouponCore, plugins)` 与其等价（前者是绑定 Core 的快捷方式）。

## 领取状态机（CouponPhase）

```text
idle(未开始) → available(可领取) → claiming(领取中) → claimed(已领取) ─核销→ used(已使用)
                                      │失败回退 available
终态：used / soldout(已抢空) / expired(已过期)
```

- 领取失败不设独立态：回退 `available` 并触发 `onClaimError`
- `expired` 只覆盖非终态：已核销（used）的券不会被过期判定打回
- 联动来源：`state.validity.expired`（ValidityPlugin 写入）与 `stock ≤ 0`

## 插件上下文（CouponPluginContext）

内核 `PluginContext` 之外补充：

| 字段 | 说明 |
| --- | --- |
| `coupon` | 券面数据（实时引用） |
| `phase` | 当前相位（读内核 state，默认 available） |
| `setPhase(phase)` | 写相位（写入即触发 context 重建） |
| `validity` | 有效期判定结果（ValidityPlugin 写入，未安装为 null） |
| `rulesExpanded` / `toggleRules()` | 规则展开态与切换 |

领域事件钩子（`withPlugins` 在对应 state 变化后触发）：

- `onPhaseChange(context, phase, prev)`
- `onValidityChange(context, validity)`

## 上下文（内核通用）

```ts
interface PluginContext<TProps = any> {
  props: TProps;
  data?: any;
  bus: PluginBus;               // emit/on/once/off + getData/setData
  refs: { container, getContainer };
  state: Record<string, unknown>;
  setState(patch): void;
  shared: Map<string, unknown>;
  deviceInfo: DeviceInfo;
  forceUpdate(): void;
  getSize(): { width, height };
  logger: PluginLogger;
}
```

## 自定义插件

```tsx
import type { CouponPlugin } from "vane-coupon";

export const createHighlightPlugin = (config: { keyword: string } = { keyword: "限时" }): CouponPlugin => ({
  name: "highlight",
  version: "0.1.0",
  priority: 15,
  config: { slotPosition: "before", ...config },
  hooks: {
    renderHeader: (ctx) =>
      ctx.coupon.title.includes(config.keyword) ? (
        <span className="my-flag">限时</span>
      ) : null,
  },
});
```

事件钩子里改了闭包状态必须调用 `ctx.forceUpdate()`；写内核 `state`（`ctx.setState`）则无需——写入即触发 context 重建。

## 样式与换肤

组件样式全部内联（自带白底 + 字色 + 16px 内边距，ADR-13：有背景必有字色）。调色板常量在 `src/components/CouponPlugin/plugins/tokens.ts`，核心几项：

| 常量 | 值 | 用途 |
| --- | --- | --- |
| `rootStyle` | 白底 / `#1f2328` / 内边距 16 | 票券根 |
| `amountStyle` | `#d03050` | 面额 |
| `claimStyle` / `claimMutedStyle` | `#d03050` 白墨 / 灰底灰字 | 领取按钮（禁用对比度 ≥ 3:1） |
| `chipUrgentStyle` | `#a54a00` on `#fff7e6` | 紧迫角标 |
| `chipExpiredStyle` | `#b32d08` on `#fff1f0` | 过期角标 |

换肤走 `containerStyle` 覆盖根节点，或宿主包裹层统一处理；自定义插件 import tokens.ts 复用同一套色值。
