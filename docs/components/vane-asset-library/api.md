# 素材库 · API

## `<AssetLibraryCore>`

`withAssetLibraryPlugins(AssetLibraryCore, plugins)` 返回的组件接受以下 props。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `AssetItem[]` | 必填 | 全量素材。缺失 / 重复 `id` 会被丢弃并 `console.warn` |
| `folders` | `AssetFolder[]` | `[]` | 分组列表，供 `FolderFilter` 使用 |
| `selectedIds` | `string[]` | — | **受控**选择。传了就以它为准，点击只回传 `onSelectionChange` |
| `defaultSelectedIds` | `string[]` | `[]` | 非受控初值，只生效一次 |
| `maxSelected` | `number` | `0` | 选择上限，`0` = 不限。已达上限时未选中项进入 blocked 态 |
| `multiple` | `boolean` | `true` | `false` 时点击即单选替换 |
| `pageSize` | `number` | `24` | 每页条数，`0` = 不分页；动态变化会回到第 1 页 |
| `initialSort` | `AssetSort` | `{ key: "createdAt", dir: "desc" }` | 初始排序 |
| `initialView` | `"grid" \| "list"` | `"grid"` | 初始视图 |
| `columnWidth` | `number` | `176` | 网格基准列宽（px），列数由容器宽度自动推导 |
| `gap` | `number` | `12` | 网格间距（px） |
| `onSelectionChange` | `(ids: string[], items: AssetItem[]) => void` | — | 选择变化（`ids` 有序，即勾选顺序） |
| `onItemActivate` | `(item: AssetItem) => void` | — | 双击 / `Enter` 激活 |
| `onUpload` | `(files: File[]) => void` | — | dropzone 收集到文件 |
| `onAssetAction` | `(action: string, payload: { id?: string; ids?: string[] }) => void` | — | 卡片操作 / 批量操作回调 |
| `containerClassName` | `string` | — | 容器类名 |
| `containerStyle` | `React.CSSProperties` | — | 容器样式（覆盖令牌） |
| `onMount` / `onUnmount` | `() => void` | — | 生命周期回调（同时转发给插件） |
| `debug` | `boolean` | `false` | 打印插件装配日志 |

### Ref

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取根 DOM |
| `forceUpdate()` | 强制重渲染（只影响 Core 自身） |
| `getSize()` | 取容器宽高 |
| `getSelection()` | 当前选中 id（有序） |
| `getVisibleIds()` | 当前页可见 id |

## 数据类型

```ts
type AssetKind = "image" | "video";
type AssetStatus = "ready" | "processing" | "failed";

interface AssetItem {
  id: string;              // 稳定唯一键
  kind: AssetKind;
  src: string;             // 原图 / 视频地址
  thumbnail?: string;      // 视频强烈建议提供；缺省时卡片显示占位块
  title?: string;          // 缺省回落文件名，再缺省用 id
  width?: number;
  height?: number;
  duration?: number;       // 秒，仅 video
  size?: number;           // 字节
  mimeType?: string;
  tags?: string[];
  folderId?: string | null;
  folderName?: string;
  createdAt?: string | number | Date;  // 内部统一为毫秒时间戳
  status?: AssetStatus;    // 缺省视为 ready
  favorite?: boolean;
  owner?: string;
  meta?: Record<string, unknown>;      // 宿主自定义，插件透传
}

interface AssetFolder { id: string; name: string; count?: number }
```

## 插件上下文（`AssetLibraryContext`）

插件钩子拿到的是扩展后的上下文，在内核字段（`props` / `state` / `setState` / `bus` / `refs` / `shared` / `deviceInfo` / `forceUpdate` / `getSize` / `logger`）之上追加：

| 分组 | 字段 |
| --- | --- |
| 数据 | `items`（归一化全量）、`folders`、`filtered`（过滤+排序）、`visible`（当前页）、`total`、`emptyReason` |
| 筛选 | `query` `kinds` `tags` `folderId` `hasFilters` + `setQuery` `toggleKind` `setKinds` `toggleTag` `setTags` `setFolder` `clearFilters` |
| 排序 | `sortKey` `sortDir` + `setSort(key, dir?)` |
| 视图 / 分页 | `view` `setView` `page` `pageSize` `pageCount` `setPage` `setPageSize` |
| 选择 | `selectedIds` `selectedItems` `isSelected` `toggleSelect` `selectAllVisible` `clearSelection` `maxSelected` `isSelectable` `isBlocked` |
| 焦点 | `activeId` `setActiveId` |
| 宿主回流 | `requestUpload(files)` `requestAction(action, payload)` `previewId` `openPreview` `closePreview` |

> 读数据一律用 `ctx.items` / `ctx.filtered`，不要读 `ctx.props.items`：后者是原始入参，可能缺 `id`、`status` 非法或有重复。

## 领域钩子

| 钩子 | 签名 | 说明 |
| --- | --- | --- |
| `renderDropzone` | `(ctx) => ReactNode` | 顶部拖拽区 |
| `renderToolbar` | `(ctx) => ReactNode` | 工具栏（装饰累积） |
| `renderCardOverlay` | `(ctx, item, index) => ReactNode` | 卡片媒体区角标 |
| `renderCardActions` | `(ctx, item, index) => ReactNode` | 卡片操作钮 |
| `renderCardMeta` | `(ctx, item, index) => ReactNode` | 标题下方元信息行 |
| `renderFooter` | `(ctx) => ReactNode` | 页脚（装饰累积） |
| `renderEmpty` | `(ctx, reason) => ReactNode` | 空态（单值槽，priority 最高者胜出） |
| `renderOverlay` | `(ctx) => ReactNode` | 浮层（如大图预览） |
| `onSelectionChange` | `(ctx, ids, items) => void` | 选择变化事件 |
| `onAssetActivate` | `(ctx, item) => void` | 双击 / Enter 激活 |
| `onUploadRequest` | `(ctx, files) => void` | dropzone 收集到文件 |

排序规则与内核一致：`config.order` 升序 → `priority` 降序。

## 纯函数（宿主可复用同一口径）

| 函数 | 说明 |
| --- | --- |
| `normalizeAssets(input)` | 归一化：丢脏数据、去重、补 `kind` / `status`，返回 `{ items, issues }` |
| `normalizeSelection(ids, items, max)` | 白名单 + 去重 + 截断上限 |
| `filterAssets(items, filter)` | 搜索 / 类型 / 标签（OR）/ 分组 |
| `sortAssets(items, sort)` | 稳定排序，缺值恒沉底 |
| `paginateAssets(items, page, pageSize)` | 越界自动夹紧，返回 `{ visible, page, pageCount }` |
| `isAssetSelectable(item)` | `status === "ready"` |
| `formatDuration` / `formatSize` | 时长 / 体积格式化 |
| `buildTagFacets` / `buildFolderFacets` | 标签 / 分组面 |
| `resolveEmptyReason(total, filtered)` | `"empty" \| "filtered" \| null` |

## 体积

| 入口 | 消费方实测（esbuild bundle + gzip） |
| --- | --- |
| `vane-asset-library` | ≈9.1 KB |
| `vane-asset-library/entries/core` | ≈8.6 KB |
| 单个插件子路径 | 0.6–2 KB（doc 元数据占不小比例） |
