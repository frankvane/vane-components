# 电商卡片

> 以「卡片容器 + 插件系统 + 插槽区域」为核心的可扩展电商产品卡方案。

## 状态

**迁移中** —— 源码仍在 `archive-plugins/vane-card`，尚未按新结构迁入。

## 特性

- `CardCore` 容器 + `withPlugins` 装配 + 插槽（`renderHeader` / `renderFooter` / `renderOverlay` / `renderPriceArea`）
- 统一价格区：`config.order` 控制跨插件一致的展示顺序
- 20+ 插件：SKU、价格计算、比价、优惠券、库存、物流时效、图集、视频、评价、加购
- 曝光/点击/加购埋点（可配置 transport）
- 复合组件 40+（`compound/`）

## 安装

```bash
npm install vane-card
```

## 30 秒上手

```tsx
import { CardCore, withPlugins } from "vane-card/core";
import { createImagePlugin } from "vane-card/custom-plugins/ImagePlugin";
import { createBadgePlugin } from "vane-card/custom-plugins/BadgePlugin";

const ProductCard = withPlugins(CardCore, {
  plugins: [
    createImagePlugin({ src: "image.jpg" }),
    createBadgePlugin({ text: "热卖", type: "hot" }),
  ],
});

<ProductCard cardId="p-1001" data={{ price: 199, comparePrice: 299 }} />;
```

## 迁移待办

- [ ] 删除本地 `PluginBus` / `PluginManager` / `withPlugins`，改依赖 `@vane/plugin-core`
- [ ] `react`、`react-dom`、`react-markdown`、`react-router-dom` 等从 `dependencies` 移到 `peerDependencies` / `devDependencies`
- [ ] 自依赖 `vane-card` 移除
- [ ] 为 20+ 插件补 `doc.json`
- [ ] 拆出 `presets/` 配方（基础卡 / 营销卡 / 秒杀卡）
