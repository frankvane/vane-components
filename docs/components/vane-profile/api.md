# 个人主页引擎 · API

## `ProfileCore`

三段式布局壳。它本身不含业务行为，所有可视区块都来自插件贡献的领域槽。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | 内容区默认渲染内容；被 `WorksGrid` 等 `renderContentArea` 插件接管后由插件渲染 |
| `defaultActiveTab` | `string \| null` | `null` | 初始激活页签 id（由 `TabSync` 消费） |
| `stats` | `StatItem[]` | `[]` | 主页指标数据（`StatRow` 读取；也可由插件经 context 注入） |
| `followState` | `"none" \| "following" \| "mutual"` | `"none"` | 关注态（`FollowEcho` 读取） |
| `verified` | `boolean` | `false` | 是否认证（`VerifyBadge` 读取） |
| `badgeType` | `"personal" \| "institution"` | `"personal"` | 认证类型（`VerifyBadge` 读取） |
| `banner` | `ReactNode` | - | 头图区自定义内容（`BannerSlot` 读取；也可由插件经 context 注入） |
| `data` | `any` | - | 业务数据，透传给内核 `context.data` |
| `containerClassName` | `string` | - | 容器类名 |
| `containerStyle` | `React.CSSProperties` | - | 容器内联样式 |
| `containerRefExternal` | `RefObject<HTMLDivElement>` | - | 外部容器 ref，与插件 `ctx.refs.container` 指向同一 DOM |
| `onMount` / `onUnmount` | `() => void` | - | 挂载 / 卸载回调（透传给插件链） |
| `debug` | `boolean` | `false` | 打印插件注册与钩子日志 |

### Ref

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取根 DOM |
| `forceUpdate()` | 强制刷新 |
| `getSize()` | 取容器尺寸 `{ width, height }` |
| `getActiveTab()` | 读取当前激活页签（TabSync 驱动；内容区也可经 `useProfileContext` 订阅） |

## `withPlugins(Core, plugins)`

把插件装配到核心组件上。两种写法等价：

```tsx
withPlugins(ProfileCore, [createBannerSlotPlugin(), createStatRowPlugin()]);
withPlugins(ProfileCore, { plugins: [createBannerSlotPlugin()], enableDebug: true });
```

底层接 `vane-plugin-core` 的 runtime：装配层包一层 `ProfileSlotProvider`，并把 `ProfileCore` 的 props / ref 桥接进领域上下文（`ProfilePluginContext`）。

## 领域槽（ProfileSlotName）

领域槽是「结构化段落」插入点，由包内 `renderProfileSlot` 消费（复用内核 order 排序 + `priority` 决策 + `PluginErrorBoundary` 单槽隔离）。`ProfileCore` 的渲染顺序：

```
banner-area  ( renderBannerArea + renderBadgeArea 浮层 )
  └─ bio-area ( renderBioArea：BioSlot / SocialLinks / TagList 串联 )
meta-area    ( renderStatRow + renderFollowArea )
tab-bar      ( renderTabBar )
content-area ( renderContentArea，无内容插件时回退 children )
```

| 槽位 | 贡献插件 | 说明 |
| --- | --- | --- |
| `renderBannerArea` | `BannerSlot` | 封面 / 渐变 + 头像浮层 + 叠加文案 |
| `renderBioArea` | `BioSlot` / `SocialLinks` / `TagList` | 简介区：排在头图与数据行之间，多个插件按 `priority` 串联 |
| `renderStatRow` | `StatRow` | 关注 / 粉丝 / 获赞 / 作品指标横排 |
| `renderTabBar` | `TabSync` | 页签栏，点击切换 `activeTab` 并联动内容区 |
| `renderBadgeArea` | `VerifyBadge` | 认证徽标，浮于头图右上角 |
| `renderFollowArea` | `FollowEcho` | 关注 / 已关注 / 互相关注三态按钮 |
| `renderContentArea` | `WorksGrid` | 内容面板，随 `activeTab` 联动；存在时替代 `children` |

> 内核三槽（`renderOverlay` / `renderHeader` / `renderFooter`）仍可用作兜底叠加层；叠加类需求（如徽标想绝对定位浮在头图右上）可走 `renderOverlay`。

## 插件接口

```ts
interface Plugin<TProps = any> {
  name: string;                 // 唯一标识，kebab-case
  hooks: PluginHooks<TProps>;   // 通用钩子 + 领域钩子
  dependencies?: string[];      // 依赖的插件（先注册依赖）
  priority?: number;            // 越大越先执行（同槽排序用）
  sandbox?: boolean;            // 默认 true，错误隔离
  timeout?: number;             // 异步钩子超时，默认 3000ms
  config?: Record<string, any>; // 渲染排序用 config.order / config.slotPosition
}
```

通用钩子：`onMount` / `onUnmount` / `onPropsChange` / `onError` / `transformProps` / `transformData` / `renderOverlay` / `renderHeader` / `renderFooter`。

主页领域钩子（见 `plugins/types.ts` 的 `ProfilePluginHooks`）：上面 7 个领域槽钩子（`renderBannerArea` / `renderBioArea` / `renderStatRow` / `renderTabBar` / `renderBadgeArea` / `renderFollowArea` / `renderContentArea`）+ 页签切换事件钩子 `onTabChange(context, newTab, oldTab)`。

钩子返回语义：`false` 中断链；其他非 `undefined/true` 的值短路返回。

## 上下文（ProfilePluginContext）

在内核 `PluginContext` 基础上补充主页专属字段：

```ts
interface ProfilePluginContext<T = any> extends PluginContext<ProfileCoreProps<T>, T> {
  activeTab: string | null;                       // 当前激活页签（TabSync 写入）
  setActiveTab: (id: string | null) => void;      // 切换激活页签
  stats: StatItem[];                              // 主页指标（StatRow 源）
  followState: FollowState;                        // 关注态（FollowEcho 源）
  verified: boolean;                               // 是否认证（VerifyBadge 源）
  badgeType: BadgeType;                            // 认证类型（VerifyBadge 源）
  banner: ReactNode | null;                        // 头图区内容（BannerSlot 源）
}
```

内核通用字段：`props` / `data` / `bus`(`emit/on/once/off` + `getData/setData`) / `refs` / `state` / `setState(patch)` / `shared` / `deviceInfo` / `forceUpdate()` / `getSize()` / `logger`。

## 自定义插件

```ts
import type { ProfilePlugin, ProfilePluginContext } from "vane-profile";

export const createMyPlugin = (config = {}) => ({
  name: "my-plugin",
  priority: 10,
  config,
  hooks: {
    onMount: (ctx: ProfilePluginContext) => {
      return () => { /* cleanup */ };
    },
    renderBioArea: (ctx: ProfilePluginContext) => <div className="my-bio" />,
  },
} satisfies ProfilePlugin);
```

写 `doc.json` 后跑 `pnpm docs:plugins` 即可把插件收录进[插件目录](plugins.md)。
