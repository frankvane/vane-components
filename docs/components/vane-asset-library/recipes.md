# 素材库 · 组合配方

配方 = 一组插件的预设组合。面对 20 个插件先挑场景，再按需加。

```tsx
import { AssetLibraryCore, withPlugins } from "vane-asset-library";
```

## 1. 后台素材库（浏览为主）

```tsx
import { createSearchPlugin } from "vane-asset-library/custom-plugins/SearchPlugin";
import { createKindFilterPlugin } from "vane-asset-library/custom-plugins/KindFilterPlugin";
import { createSortPlugin } from "vane-asset-library/custom-plugins/SortPlugin";
import { createCountPlugin } from "vane-asset-library/custom-plugins/CountPlugin";
import { createMetaLinePlugin } from "vane-asset-library/custom-plugins/MetaLinePlugin";
import { createPaginationPlugin } from "vane-asset-library/custom-plugins/PaginationPlugin";
import { createEmptyStatePlugin } from "vane-asset-library/custom-plugins/EmptyStatePlugin";

export const AdminLibrary = withPlugins(AssetLibraryCore, [
  createSearchPlugin(),
  createKindFilterPlugin(),
  createSortPlugin(),
  createCountPlugin(),
  createMetaLinePlugin({ show: ["size", "dimension", "date"] }),
  createPaginationPlugin({ pageSizes: [24, 48, 96] }),
  createEmptyStatePlugin(),
]);
```

## 2. 选图器（限额多选）

```tsx
import { createSelectMarkPlugin } from "vane-asset-library/custom-plugins/SelectMarkPlugin";
import { createKindFilterPlugin } from "vane-asset-library/custom-plugins/KindFilterPlugin";
import { createBulkBarPlugin } from "vane-asset-library/custom-plugins/BulkBarPlugin";

export const Picker = withPlugins(AssetLibraryCore, [
  createSelectMarkPlugin({ showIndex: true }),
  createKindFilterPlugin(),
  createBulkBarPlugin({ actions: [], label: "已选 {n} 张" }),
]);

// 用法：限额 3 张，选择态受控
<Picker
  items={items}
  maxSelected={3}
  selectedIds={picked}
  onSelectionChange={(ids) => setPicked(ids)}
/>;
```

`maxSelected` 只约束「未选中」的卡片：选满 3 张后其余卡片进入 blocked 态，已选的仍可取消 —— 别自己再在外面卡一层 `if (ids.length >= 3) return`，那会让用户无法替换。

## 3. 上传工作流

```tsx
import { createDropzonePlugin } from "vane-asset-library/custom-plugins/DropzonePlugin";
import { createStatusBadgePlugin } from "vane-asset-library/custom-plugins/StatusBadgePlugin";
import { createDurationPlugin } from "vane-asset-library/custom-plugins/DurationPlugin";

export const Uploader = withPlugins(AssetLibraryCore, [
  createDropzonePlugin({ accept: ["image/*", "video/*"] }),
  createStatusBadgePlugin(),
  createDurationPlugin(),
]);

// 宿主：先把文件塞进 items（status: "processing"），上传完再改 ready
<Uploader
  items={items}
  onUpload={(files) => files.forEach((file) => enqueue(file))}
/>;
```

上传中的素材用 `status: "processing"`，失败用 `"failed"`：两者都可见但不可选（点击不会进选择集），`StatusBadge` 会在卡片上说明原因。

## 4. 视频墙

```tsx
import { createDurationPlugin } from "vane-asset-library/custom-plugins/DurationPlugin";
import { createKindBadgePlugin } from "vane-asset-library/custom-plugins/KindBadgePlugin";
import { createLightBoxPlugin } from "vane-asset-library/custom-plugins/LightBoxPlugin";
import { createCardActionsPlugin } from "vane-asset-library/custom-plugins/CardActionsPlugin";

export const VideoWall = withPlugins(AssetLibraryCore, [
  createKindBadgePlugin({ showFor: ["video"] }),
  createDurationPlugin({ fallback: true }),
  createCardActionsPlugin({ actions: [{ action: "preview", label: "播放", icon: "▶" }] }),
  createLightBoxPlugin(),
]);
```

视频卡片必须有 `thumbnail`：没有缩略图时卡片显示占位块（组件不会去加载视频元数据 —— 那会让每张卡多一次网络请求）。

## 5. 宿主自定义插件

```tsx
import type { AssetPlugin } from "vane-asset-library";

export const createWatermarkPlugin = (): AssetPlugin => ({
  name: "watermark",
  version: "0.1.0",
  priority: 22,
  hooks: {
    renderCardOverlay: (ctx, item) =>
      item.meta?.watermarked ? <span className="vc-asset-badge">水印</span> : null,
    renderFooter: (ctx) =>
      ctx.selectedIds.length ? (
        <span className="vc-asset-count">已选 {ctx.selectedIds.length} 项</span>
      ) : null,
  },
});
```

插件内部要改筛选/选择状态时，一律调 `ctx.setQuery` / `ctx.toggleSelect` 这类方法，不要在渲染期调 `ctx.setState`（渲染期改状态会触发 React 警告与重复渲染）。

## 6. 与 URL / 外部状态同步

```tsx
import type { AssetPlugin } from "vane-asset-library";

export const createUrlSyncPlugin = (): AssetPlugin => ({
  name: "url-sync",
  priority: 1,
  hooks: {
    onMount: (ctx) => {
      const params = new URLSearchParams(location.search);
      if (params.get("q")) ctx.setQuery(params.get("q")!);
      if (params.get("kind")) ctx.setKinds([params.get("kind") as "image" | "video"]);
    },
    onSelectionChange: (ctx, ids) => {
      const params = new URLSearchParams(location.search);
      if (ids.length) params.set("picked", ids.join(","));
      else params.delete("picked");
      history.replaceState(null, "", `?${params}`);
    },
  },
});
```

`onMount` 里写状态是安全的（已经在提交阶段之后）。若要监听筛选变化，用 `ctx.bus` 或直接读 `ctx.query` 做对比，别在渲染钩子里 `setState`。
