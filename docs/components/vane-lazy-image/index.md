# 图片懒加载

> 不止于"进入视口才加载"：把图片加载的全链路（占位、渐进、容灾、可访问性、监控）做成插件容器。

## 特性

- 插件化架构：`LazyLoadImageCore` 只做观察与渲染，其余全部是插件，按需引入、tree-shaking 友好
- 60 个内置插件、8 大领域分组（视觉 / 加载策略 / 网络 / 缓存 / 可访问性 / 错误处理 / 监控 / 视口），只增不减
- 5 个场景化配方（presets）：社交信息流 / 商品画廊 / 长文阅读 / 性能优先 / 离线优先
- `GlobalContext` + `ObserverPool`：N 个图片实例共享一次设备检测、一个 IntersectionObserver
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
import { createBlurUpPlugin } from "vane-lazy-image/custom-plugins/BlurUpPlugin";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createBlurUpPlugin({ startBlur: 12, durationMs: 600 }),
]);

<LazyImage
  src="https://picsum.photos/800/600"
  alt="示例图片"
  containerStyle={{ width: 480, height: 300 }}
/>;
```

不用插件时 `LazyLoadImageCore` 可单独使用（视口检测 + ObserverPool 共享）。

## 导入方式与体积

| 导入 | 说明 | 实测 Gzip |
| --- | --- | --- |
| `vane-lazy-image/core` | 仅核心（Core + ObserverPool） | ~8 KB |
| `vane-lazy-image/plugins` | 插件系统（withPlugins + 领域类型 + 一等公民插件） | ~10 KB |
| `vane-lazy-image` | 完整包（核心 + 插件系统 + 类型） | ~13.6 KB |
| `vane-lazy-image/custom-plugins/X` | 单个插件（60 选 1） | ~0.2 KB 起 |
| `vane-lazy-image/custom-plugins` | 全部插件桶文件（逃生口，常规不推荐） | ~2 KB + 插件本体 |
| `vane-lazy-image/presets/X` | 场景配方（5 选 1） | ~0.2 KB + 插件本体 |
| `vane-lazy-image/advanced` | 依赖解析 + 版本工具 | ~0.5 KB |
| `vane-lazy-image/monitoring` | 性能监控 + 全局上下文 | ~1 KB |

> 源码路径 == 发布子路径，未引入的插件不进产物。
> 根入口不桶导出插件与配方——引入插件/配方请走对应子路径（见[插件目录](plugins.md)与[组合配方](recipes.md)）。

## 从 1.x 迁移

2.0.0 更换了插件系统内核（`@vane/plugin-core`），主要差异：

- **插件引入路径**：插件工厂不再从根入口导出，改为 `vane-lazy-image/custom-plugins/<XxxPlugin>` 子路径引入（根入口只保留核心 + 插件系统 + 类型，保证按需引入时最小体积）；确需全量可用桶文件 `vane-lazy-image/custom-plugins`；
- 插件工厂签名不变（`createXxxPlugin(config)`），`priority` 语义仍为「越小越优先，默认 100」，与 1.x 一致；
- 旧版直接可用的 `createPluginManager` / `createPluginBus` / `createPluginSandbox` 等底层 API 改为从 `vane-lazy-image/plugins` 转发（实现来自 `@vane/plugin-core`）；
- 移除：插件热更新（`hotReload` / `savePluginState`）、`hookFactory`、`renderDeps`、bus 通配符与批处理——1.x 中无内置插件使用这些能力，自定义插件如依赖需自行实现；
- `render` 渲染钩子合并为 `renderOverlay`（1.x 仅 BadgePlugin 使用）。

## 文档

- [API](api.md)
- [插件目录](plugins.md)
- [组合配方](recipes.md)

## License

MIT
