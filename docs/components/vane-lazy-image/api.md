# 图片懒加载 · API

## `LazyLoadImageCore`

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | - | 图片地址（必填） |
| `alt` | `string` | `""` | 替代文本，插件可智能补全 |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | 加载策略 |
| `rootMargin` | `string` | `"0px"` | 视口边距 |
| `threshold` | `number \| number[]` | `0.01` | 可见度阈值 |
| `containerClassName` / `containerStyle` | - | - | 容器样式 |
| `imageClassName` / `imageStyle` | - | - | 图片样式 |
| `onLoad` / `onError` | `() => void` | - | 加载回调（会被插件钩子转发） |
| `containerRefExternal` | `RefObject` | - | 由 `withPlugins` 注入 |

不支持 `IntersectionObserver` 时自动降级为立即加载。

## `withPlugins(Core, plugins)`

```tsx
withPlugins(LazyLoadImageCore, [
  createWatermarkPlugin({ text: "VANE", position: "bottom-right" }),
  createFadeInPlugin({ durationMs: 600 }),
  createRetryOnErrorPlugin({ maxRetries: 3, retryDelay: 1000 }),
]);
```

## 领域钩子

| 钩子 | 说明 |
| --- | --- |
| `onLoad` | 图片开始加载（可改写 URL，返回新地址） |
| `onLoadSuccess` | 加载成功 |
| `onLoadError` | 加载失败（返回 `true` 表示已处理） |
| `renderOverlay` | 覆盖层（水印、角标、进度条等） |

## 插件上下文

在 `@vane/plugin-core` 的 `PluginContext` 之上附加：

| 字段 | 说明 |
| --- | --- |
| `src` | 当前图片地址 |
| `displaySrc` | 实际用于渲染的地址（可能被 `onLoad` 改写） |
| `naturalSize` | 图片原始尺寸（加载成功后可用） |

## 自定义插件

```ts
import type { Plugin } from "vane-lazy-image";

export const createMyPlugin = (config = {}) => ({
  name: "my-plugin",
  config,
  hooks: {
    onLoadSuccess: (ctx) => console.log("loaded", ctx.displaySrc),
    renderOverlay: (ctx) => <div className="badge" />,
  },
});
```
