# 图片懒加载 · API

## `LazyLoadImageCore`

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | - | 图片地址（必填） |
| `alt` | `string` | `""` | 替代文本，插件可智能补全 |
| `loading` | `"lazy" \| "eager" \| "auto"` | `"lazy"` | 加载策略 |
| `isLCP` | `boolean` | `false` | 标记 LCP 图片：强制 eager + `fetchpriority=high` |
| `fetchPriority` | `"high" \| "low" \| "auto"` | `"auto"` | 加载优先级 |
| `rootMargin` | `string` | `"0px"` | 视口边距 |
| `threshold` | `number \| number[]` | `0` | 可见度阈值 |
| `unobserveOnVisible` | `boolean` | `true` | 进入视口后停止观察 |
| `containerClassName` / `containerStyle` | - | - | 容器样式 |
| `imageClassName` / `imageStyle` | - | - | 图片样式 |
| `crossOrigin` | `string` | - | 跨域策略（像素读取等场景需要） |
| `enablePerformanceMonitor` | `boolean` | `false` | 启用单图性能监控（`getPerformanceReport`） |
| `onLoad` / `onError` 等 | 回调 | - | 由 `withPlugins` 注入以连接插件链，一般不需要直接传 |

`LazyLoadImageCoreRef`：`reload()` / `reset()` / `getState()` / `getPerformanceReport()`。

不支持 `IntersectionObserver` 时自动降级为立即加载。

## `withPlugins(Core, plugins)`

```tsx
withPlugins(LazyLoadImageCore, [
  createBlurUpPlugin({ startBlur: 12 }),
  createFetchLoaderPlugin({ maxRetries: 3 }),
]);
```

也可以用配置对象：`withPlugins(LazyLoadImageCore, { plugins: [...], enableDebug: true })`。

插件执行顺序由 `vane-plugin-core` 的 `DependencyResolver` 决定：**依赖约束绝对优先，优先级只在就绪候选间生效**（平级保持注册顺序）。本包领域 `priority` 语义为「越小越优先，默认 100」，装配时自动转换为内核语义。

## 领域钩子

| 钩子 | 说明 |
| --- | --- |
| `onBeforeLoad` | 加载前触发，返回 `false` 阻止加载 |
| `onLoad` | 自定义加载逻辑，返回最终 URL（objectURL / dataURL / 原 URL） |
| `onLoadSuccess` | 加载成功，第二参为最终显示的地址 |
| `onLoadError` | 加载失败，返回 `true` 表示已处理 |
| `onEnterViewport` / `onLeaveViewport` | 视口进入/离开 |
| `onProgress` | 加载进度（经 bus `progress` 事件桥接，含 speed/ETA） |
| `onSrcChange` | `src` 属性变化 |
| `onNetworkChange` / `onResize` | 网络/设备变化（全局单例集中监听） |
| `onMount` / `onUnmount` | 生命周期（返回函数注册为清理） |
| `transformProps` | 渲染前链式改写 props |
| `renderOverlay` / `renderHeader` / `renderFooter` | 渲染插槽 |

返回值语义：`false` 中断钩子链；其他非 `undefined`/`true` 的值短路返回。

## 插件上下文

`LazyImageContext` = 内核 `PluginContext`（`props` / `bus` / `refs` / `state` / `shared` / `deviceInfo` / `logger` …）& 领域字段：

| 字段 | 说明 |
| --- | --- |
| `src` | 当前图片地址 |
| `imageState` | `{ isIdle, isLoading, isLoaded, isError }` |
| `isIntersecting` | 是否处于视口内 |
| `imageRef` / `containerRef` | 图片/容器 DOM 引用 |
| `networkInfo` | 网络信息（`effectiveType` / `downlink` / `rtt` / `saveData`） |
| `performanceData` | `{ loadStartTime, loadEndTime?, duration? }` |

## 自定义插件

```ts
import type { LazyImagePlugin } from "vane-lazy-image/plugins";

export const createMyPlugin = (config = {}): LazyImagePlugin => ({
  name: "my-plugin",
  config,
  hooks: {
    onLoadSuccess: (ctx) => console.log("loaded", ctx.src),
    renderOverlay: (ctx) => <div className="badge" />,
  },
});
```

完整开发规范（doc.json 三件套、分组、presets）见文档站「插件开发 SOP」。
