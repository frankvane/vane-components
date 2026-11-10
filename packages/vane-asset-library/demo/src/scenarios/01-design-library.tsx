/**
 * 场景 01 · 品牌素材库
 *
 * 设计团队每天的开场页：左边选分组、上面搜关键词、卡片上能直接收藏和下载。
 * 十一个插件装在一起，但用户看到的只是一个能用的素材库 —— 这是插件式设计的全部意义。
 */
import React, { useCallback, useState } from "react";
import { AssetLibraryCore, withAssetLibraryPlugins } from "vane-asset-library";
import type { AssetItem } from "vane-asset-library";
import { createBulkBarPlugin } from "vane-asset-library/custom-plugins/BulkBarPlugin";
import { createCardActionsPlugin } from "vane-asset-library/custom-plugins/CardActionsPlugin";
import { createCountPlugin } from "vane-asset-library/custom-plugins/CountPlugin";
import { createDropzonePlugin } from "vane-asset-library/custom-plugins/DropzonePlugin";
import { createEmptyStatePlugin } from "vane-asset-library/custom-plugins/EmptyStatePlugin";
import { createFavoritePlugin } from "vane-asset-library/custom-plugins/FavoritePlugin";
import { createFolderFilterPlugin } from "vane-asset-library/custom-plugins/FolderFilterPlugin";
import { createKindFilterPlugin } from "vane-asset-library/custom-plugins/KindFilterPlugin";
import { createLightBoxPlugin } from "vane-asset-library/custom-plugins/LightBoxPlugin";
import { createMetaLinePlugin } from "vane-asset-library/custom-plugins/MetaLinePlugin";
import { createPaginationPlugin } from "vane-asset-library/custom-plugins/PaginationPlugin";
import { createSearchPlugin } from "vane-asset-library/custom-plugins/SearchPlugin";
import { createSelectMarkPlugin } from "vane-asset-library/custom-plugins/SelectMarkPlugin";
import { createSortPlugin } from "vane-asset-library/custom-plugins/SortPlugin";
import { createStatusBadgePlugin } from "vane-asset-library/custom-plugins/StatusBadgePlugin";
import { createTagFilterPlugin } from "vane-asset-library/custom-plugins/TagFilterPlugin";
import { SAMPLE_ASSETS, SAMPLE_FOLDERS } from "../data/samples";
import type { ScenarioMeta } from "./types";

const Library = withAssetLibraryPlugins(AssetLibraryCore, [
  createDropzonePlugin({ label: "拖素材进来，或点击选择文件" }),
  createSearchPlugin({ placeholder: "搜素材名 / 标签" }),
  createKindFilterPlugin({ allLabel: "全部" }),
  createTagFilterPlugin({ max: 5 }),
  createFolderFilterPlugin({ allLabel: "全部素材" }),
  createSortPlugin({}),
  createCountPlugin({}),
  createSelectMarkPlugin({ showIndex: true }),
  createFavoritePlugin({ action: "favorite" }),
  createCardActionsPlugin({
    actions: [
      { action: "preview", label: "预览", icon: "⌕" },
      { action: "download", label: "下载", icon: "↓" },
    ],
  }),
  createMetaLinePlugin({ show: ["size", "dimension", "folder"], maxTags: 2 }),
  createStatusBadgePlugin({}),
  createBulkBarPlugin({ label: "已选 {n} 项" }),
  createPaginationPlugin({ pageSizes: [12, 24, 48] }),
  createEmptyStatePlugin({ clearLabel: "清空全部筛选" }),
  createLightBoxPlugin({ arrows: true, restoreFocus: true }),
]);

export const meta: ScenarioMeta = {
  id: "design-library",
  title: "品牌素材库",
  group: "内容运营",
  ref: { label: "Figma Assets / 蓝湖素材库", url: "https://www.figma.com/" },
  pain: "设计师找不到上周那张主视觉：命名靠人记、分组靠翻页、下载要挨个点。",
  plugs: [
    { fn: "createDropzonePlugin", cfg: 'label: "拖素材进来，或点击选择文件"', why: "新素材从拖拽进，不提供第二条上传路径。" },
    { fn: "createSearchPlugin", cfg: 'placeholder: "搜素材名 / 标签"', why: "标题 + 标签 + 文件名三路匹配，输错字也能命中。" },
    { fn: "createKindFilterPlugin", cfg: 'allLabel: "全部"', why: "图片和视频混在一库里，先按介质收窄。" },
    { fn: "createTagFilterPlugin", cfg: "max: 5", why: "运营维护的活动 / 场景标签，比文件夹更贴近找图的思路。" },
    { fn: "createFolderFilterPlugin", cfg: 'allLabel: "全部素材"', why: "分组按「谁负责」划，数量现算，不依赖后端同步。" },
    { fn: "createSortPlugin", why: "默认按创建时间倒序：刚做完的永远在最前。" },
    { fn: "createCountPlugin", why: "筛选后立刻告诉用户还剩多少，避免以为筛空了。" },
    { fn: "createSelectMarkPlugin", cfg: "showIndex: true", why: "批量插入设计稿时，选择顺序本身有语义。" },
    { fn: "createFavoritePlugin", cfg: 'action: "favorite"', why: "收藏是高频动作，但状态归宿主存。" },
    { fn: "createCardActionsPlugin", cfg: 'actions: [{ action: "download", label: "下载", icon: "↓" }]', why: "单张素材要能直接下载，不必先选中再批量。" },
    { fn: "createMetaLinePlugin", cfg: 'show: ["size", "dimension", "folder"], maxTags: 2', why: "体积与分辨率是设计师挑图的硬指标。" },
    { fn: "createStatusBadgePlugin", why: "转码中的视频不该被当成可用素材。" },
    { fn: "createBulkBarPlugin", cfg: 'label: "已选 {n} 项"', why: "批量交给下游时，需要一次性把 id 交出去。" },
    { fn: "createPaginationPlugin", cfg: "pageSizes: [12, 24, 48]", why: "几千项素材不可能一次铺完，分页给「全选」明确边界。" },
    { fn: "createEmptyStatePlugin", cfg: 'clearLabel: "清空全部筛选"', why: "筛空时给出口，而不是让用户面对一片空白。" },
    { fn: "createLightBoxPlugin", cfg: "arrows: true, restoreFocus: true", why: "缩略图看不清细节，双击看原图。" },
  ],
  props: ["pageSize={12}", "maxSelected={24}", "columnWidth={168}"],
  note: "16 个插件同时装着，用户看到的仍然只是一个素材库 —— 没有多出来的按钮，也没有互相打架的布局。",
  tone: "dark",
};

export default function DesignLibraryScene() {
  const [items, setItems] = useState<AssetItem[]>(SAMPLE_ASSETS);

  const onAssetAction = useCallback(
    (action: string, payload: { id?: string; ids?: string[] }) => {
      if (action !== "favorite" || !payload.id) return;
      const target = payload.id;
      setItems((prev) =>
        prev.map((it) => (it.id === target ? { ...it, favorite: !it.favorite } : it))
      );
    },
    []
  );

  return (
    <div className="stage">
      <Library
        items={items}
        folders={SAMPLE_FOLDERS}
        pageSize={12}
        maxSelected={24}
        columnWidth={168}
        onAssetAction={onAssetAction}
        onUpload={(files) => {
          // 真实项目在这里走上传；场景里只把文件名写进控制台，避免伪造进度
          console.info("[design-library] upload", files.map((f) => f.name));
        }}
      />
    </div>
  );
}
