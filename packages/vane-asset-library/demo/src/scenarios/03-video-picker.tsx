/**
 * 场景 03 · 视频选题
 *
 * 视频库的挑片页：先按时长和更新时间筛，再逐条看时长与规格，收藏进选题单。
 * 这一页默认就是列表视图 —— 挑片时要读文件名与时长，网格反而不如列表。
 */
import React, { useState } from "react";
import { AssetLibraryCore, withAssetLibraryPlugins } from "vane-asset-library";
import type { AssetItem } from "vane-asset-library";
import { createCountPlugin } from "vane-asset-library/custom-plugins/CountPlugin";
import { createDurationPlugin } from "vane-asset-library/custom-plugins/DurationPlugin";
import { createEmptyStatePlugin } from "vane-asset-library/custom-plugins/EmptyStatePlugin";
import { createFavoritePlugin } from "vane-asset-library/custom-plugins/FavoritePlugin";
import { createFolderFilterPlugin } from "vane-asset-library/custom-plugins/FolderFilterPlugin";
import { createKindFilterPlugin } from "vane-asset-library/custom-plugins/KindFilterPlugin";
import { createLightBoxPlugin } from "vane-asset-library/custom-plugins/LightBoxPlugin";
import { createMetaLinePlugin } from "vane-asset-library/custom-plugins/MetaLinePlugin";
import { createSelectMarkPlugin } from "vane-asset-library/custom-plugins/SelectMarkPlugin";
import { createSortPlugin } from "vane-asset-library/custom-plugins/SortPlugin";
import { createStatusBadgePlugin } from "vane-asset-library/custom-plugins/StatusBadgePlugin";
import { createViewSwitchPlugin } from "vane-asset-library/custom-plugins/ViewSwitchPlugin";
import { SAMPLE_ASSETS, SAMPLE_FOLDERS } from "../data/samples";
import type { ScenarioMeta } from "./types";

const Library = withAssetLibraryPlugins(AssetLibraryCore, [
  createKindFilterPlugin({ allLabel: "全部素材" }),
  createFolderFilterPlugin({ allLabel: "全部文件夹" }),
  createSortPlugin({}),
  createViewSwitchPlugin({ labels: { grid: "封面", list: "清单" } }),
  createCountPlugin({ showTotal: true, showVisible: true, showSelected: false }),
  createDurationPlugin({ fallback: true }),
  createStatusBadgePlugin({}),
  createSelectMarkPlugin({ showIndex: false }),
  createFavoritePlugin({ action: "favorite" }),
  createMetaLinePlugin({ show: ["size", "dimension"], maxTags: 1 }),
  createEmptyStatePlugin({ emptyText: "视频库里还没有素材" }),
  createLightBoxPlugin({ arrows: true, restoreFocus: true }),
]);

export const meta: ScenarioMeta = {
  id: "video-picker",
  title: "视频选题清单",
  group: "内容运营",
  ref: { label: "Frame.io / 剪映素材中心", url: "https://frame.io/" },
  pain: "挑片要一眼看到时长和规格，网格缩略图什么都看不出来，只能一个个点开。",
  plugs: [
    { fn: "createKindFilterPlugin", cfg: 'allLabel: "全部素材"', why: "默认全部，但图片与视频必须能一键分开。" },
    { fn: "createFolderFilterPlugin", cfg: 'allLabel: "全部文件夹"', why: "按投放渠道分文件夹，选题时先选渠道。" },
    { fn: "createSortPlugin", why: "按时长排序找「15 秒以内」的素材。" },
    { fn: "createViewSwitchPlugin", cfg: 'labels: { grid: "封面", list: "清单" }', why: "同一份数据两种读法，标签也跟着改口语化文案。" },
    { fn: "createCountPlugin", cfg: "showTotal: true, showVisible: true, showSelected: false", why: "选题时关心「这个渠道有多少片」，不关心选了几条。" },
    { fn: "createDurationPlugin", cfg: "fallback: true", why: "时长是第一筛选维度，缺数据的显示占位而不是留白。" },
    { fn: "createStatusBadgePlugin", why: "转码中的片子现在还不能剪。" },
    { fn: "createSelectMarkPlugin", cfg: "showIndex: false", why: "选题单不需要顺序，只要看得出选没选。" },
    { fn: "createFavoritePlugin", cfg: 'action: "favorite"', why: "收藏 = 加入选题单，是这一页的产出。" },
    { fn: "createMetaLinePlugin", cfg: 'show: ["size", "dimension"], maxTags: 1', why: "规格与体积决定能不能直接进剪辑。" },
    { fn: "createEmptyStatePlugin", cfg: '{ emptyText: "视频库里还没有素材" }', why: "空库时引导上传，而不是提示「换个筛选条件」。" },
    { fn: "createLightBoxPlugin", cfg: "arrows: true, restoreFocus: true", why: "连续看片，左右键比来回点击快得多。" },
  ],
  props: ["pageSize={10}", 'initialView="list"', "columnWidth={160}"],
  note: "列表视图下时长与规格仍在同一行没拥挤 —— 视图切换换的是排布，不是数据。",
  tone: "dark",
};

export default function VideoPickerScene() {
  const [items, setItems] = useState<AssetItem[]>(
    // 只留视频 + 少量图片当作封面参考
    SAMPLE_ASSETS.filter((it) => it.kind === "video" || it.folderId === "f-product")
  );

  return (
    <div className="stage">
      <Library
        items={items}
        folders={SAMPLE_FOLDERS}
        pageSize={10}
        initialView="list"
        columnWidth={160}
        onAssetAction={(action, payload) => {
          if (action !== "favorite" || !payload.id) return;
          const target = payload.id;
          setItems((prev) =>
            prev.map((it) => (it.id === target ? { ...it, favorite: !it.favorite } : it))
          );
        }}
      />
    </div>
  );
}
