<p align="center">
  <a href="https://www.npmjs.com/package/vane-asset-library"><img src="https://img.shields.io/npm/v/vane-asset-library.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-asset-library"><img src="https://img.shields.io/npm/dm/vane-asset-library.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>
# 素材库 vane-asset-library

> 插件式 React 素材网格墙：图片 / 视频的浏览、筛选、排序、分页、多选与拖拽上传占位，20 个官方插件按需组合。

`AssetLibraryCore` 只渲染网格骨架（卡片 = 媒体区 + 标题 + 三个 per-card 槽）与键盘导航；筛选、排序、分页、选择、拖拽上传、大图预览全部由插件承接。组件**只表达素材，不传输素材**：不发起请求、不管上传进度、不做持久化。

## 特性

- 插件化架构：核心只做「网格渲染 + 生命周期转发」，可变能力全交插件
- 20 个官方插件：8 个槽位（拖拽区 / 工具栏 / 卡片角标 / 卡片操作 / 卡片元信息 / 页脚 / 空态 / 浮层），多对多挂载
- 领域语义内建：`processing` / `failed` 素材可见但不可选；`maxSelected` 只约束未选中的项；筛选后「全选」只作用于当前页
- 受控数据：`items` 由宿主传入，选择态可受控（`selectedIds`）也可非受控（`defaultSelectedIds`）
- 键盘可达：方向键按真实列数移动、`Space` 勾选、`Enter` 激活、`Home/End` 首尾；`role="listbox"` + `aria-selected`
- Tree-shaking 友好：插件走子路径导入，只打包你用到的
- 容器自带 `color` + `background`，对比度符合 ADR-13

## 安装

```bash
npm install vane-asset-library
# peer：react / react-dom / vane-plugin-core
```

样式单独引入（`dist/style.css`，含设计令牌与组件样式）：

```ts
import "vane-asset-library/style.css";
```

## 30 秒上手

```tsx
import { withPlugins, AssetLibraryCore } from "vane-asset-library";
import { createSearchPlugin } from "vane-asset-library/custom-plugins/SearchPlugin";
import { createKindFilterPlugin } from "vane-asset-library/custom-plugins/KindFilterPlugin";
import { createSelectMarkPlugin } from "vane-asset-library/custom-plugins/SelectMarkPlugin";
import { createBulkBarPlugin } from "vane-asset-library/custom-plugins/BulkBarPlugin";
import type { AssetItem } from "vane-asset-library";

const items: AssetItem[] = [
  {
    id: "a-001",
    kind: "image",
    src: "https://cdn.example.com/cover.png",
    title: "首页主视觉",
    width: 1920,
    height: 1080,
    size: 486233,
    tags: ["banner", "首页"],
    folderId: "f-1",
    folderName: "官网",
    createdAt: "2026-11-02",
  },
  {
    id: "a-002",
    kind: "video",
    src: "https://cdn.example.com/demo.mp4",
    thumbnail: "https://cdn.example.com/demo.jpg",
    duration: 96,
  },
];

const Library = withPlugins(AssetLibraryCore, [
  createSearchPlugin(),
  createKindFilterPlugin(),
  createSelectMarkPlugin(),
  createBulkBarPlugin(),
]);

<Library
  items={items}
  folders={[{ id: "f-1", name: "官网" }]}
  onSelectionChange={(ids) => console.log("已选", ids)}
  onAssetAction={(action, payload) => console.log(action, payload)}
  onUpload={(files) => upload(files)}
/>;
```

不传任何插件也能跑：裸网格墙（卡片 + 键盘导航 + 兜底空态）。

## 插件一览（20 个）

| 插件 | 子路径 | 槽位 | 一句话 |
| --- | --- | --- | --- |
| Dropzone | `custom-plugins/DropzonePlugin` | 拖拽区 | 拖入 / 点选文件，过滤类型后交回宿主 |
| Search | `custom-plugins/SearchPlugin` | 工具栏 | 关键词搜索，200ms 防抖 + ⌘K |
| KindFilter | `custom-plugins/KindFilterPlugin` | 工具栏 | 图片 / 视频筛选，带各类型计数 |
| TagFilter | `custom-plugins/TagFilterPlugin` | 工具栏 | 标签面，多选 OR |
| FolderFilter | `custom-plugins/FolderFilterPlugin` | 工具栏 | 分组 chip（平铺，不做树） |
| Sort | `custom-plugins/SortPlugin` | 工具栏 | 名称 / 时间 / 体积 / 时长 |
| ViewSwitch | `custom-plugins/ViewSwitchPlugin` | 工具栏 | 网格 / 列表 |
| Count | `custom-plugins/CountPlugin` | 工具栏 | 总数 / 当前页 / 已选 |
| SelectAll | `custom-plugins/SelectAllPlugin` | 工具栏 | 全选本页 / 取消选择 |
| SelectMark | `custom-plugins/SelectMarkPlugin` | 卡片角标 | 勾选圈 + 选择序号 |
| KindBadge | `custom-plugins/KindBadgePlugin` | 卡片角标 | PIC / VID 角标 |
| Duration | `custom-plugins/DurationPlugin` | 卡片角标 | 视频时长 |
| StatusBadge | `custom-plugins/StatusBadgePlugin` | 卡片角标 | 转码中 / 处理失败遮罩 |
| Favorite | `custom-plugins/FavoritePlugin` | 卡片角标 | 收藏星标（回调宿主） |
| CardActions | `custom-plugins/CardActionsPlugin` | 卡片操作 | 预览 / 下载 / 删除 |
| MetaLine | `custom-plugins/MetaLinePlugin` | 卡片元信息 | 体积 / 分辨率 / 分组 / 日期 |
| BulkBar | `custom-plugins/BulkBarPlugin` | 页脚 | 已选数量 + 批量动作 |
| Pagination | `custom-plugins/PaginationPlugin` | 页脚 | 页码 + 每页条数 |
| EmptyState | `custom-plugins/EmptyStatePlugin` | 空态 | 空库 / 筛选无结果分叉 |
| LightBox | `custom-plugins/LightBoxPlugin` | 浮层 | 大图 / 视频预览 |

全部插件在 `vane-asset-library/entries/plugins` 有一份整装导出（demo 与原型用）；生产代码建议按子路径引入。

## 边界（明确不做）

| 不做 | 原因 |
| --- | --- |
| 上传请求 / 进度 / 重试 / 断点 | 上传器是宿主的基础设施，组件只收集 `File[]` 并回调 |
| 文件树侧栏、常驻详情抽屉 | 那是「资产管理工作台」，本包定位是网格墙 |
| 内置请求 / 无限滚动 loader | `items` 受控传入，异步与缓存留在宿主 |
| 音频 / 文档 / 字体渲染 | 只做 `image` / `video` 两类 |

需要文档预览用 `vane-file-preview`，需要单图懒加载用 `vane-lazy-image`。

## 许可

MIT
