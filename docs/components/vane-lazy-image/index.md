# 图片懒加载

> 不止于"进入视口才加载"：把图片加载的全链路（占位、渐进、容灾、可访问性、监控）做成插件容器。

## 特性

- 插件化架构：`LazyLoadImageCore` 只做观察与渲染，其余全部是插件
- `GlobalContext` + `ObserverPool`：N 个图片实例共享一次设备检测、一个 Observer
- BlurUp / LQIP 渐进占位、骨架屏、进度条
- 智能重试、CDN 回退、降级图片、离线缓存
- ARIA 自动注入、智能 alt、`srcset/sizes`
- 性能监控与上报
- 零运行时依赖（react 为 peer），无需引入 CSS 文件

## 安装

```bash
npm install vane-lazy-image
```

## 30 秒上手

```tsx
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import { createFadeInPlugin } from "vane-lazy-image/custom-plugins/FadeInPlugin";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createFadeInPlugin({ durationMs: 600 }),
]);

<LazyImage
  src="https://picsum.photos/800/600"
  alt="示例图片"
  containerStyle={{ width: 480, height: 300 }}
  imageStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
/>;
```

## 导入方式与体积

| 导入 | 说明 | Gzip |
| --- | --- | --- |
| `vane-lazy-image/core` | 仅核心 | ~0.3 KB |
| `vane-lazy-image` | 核心 + 常用插件 | ~10 KB |
| `vane-lazy-image/custom-plugins/X` | 单个插件（最小） | ~1 KB |

> 不要用 `import * as LazyImage from "vane-lazy-image"`，会打包全部插件。

## 文档

- [API](api.md)
- [插件目录](plugins.md)
- [组合配方](recipes.md)

## License

MIT
