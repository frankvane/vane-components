/**
 * 场景 02 · 用户投稿审核
 *
 * 运营只看两件事：哪些还没转好、哪些可以批量通过。所以这里把「状态」放到第一位，
 * 选择上限开得很小（一次审 12 条），分页只给 12 / 24 两档。
 */
import React, { useCallback, useState } from "react";
import { AssetLibraryCore, withAssetLibraryPlugins } from "vane-asset-library";
import type { AssetItem } from "vane-asset-library";
import { createBulkBarPlugin } from "vane-asset-library/custom-plugins/BulkBarPlugin";
import { createCardActionsPlugin } from "vane-asset-library/custom-plugins/CardActionsPlugin";
import { createCountPlugin } from "vane-asset-library/custom-plugins/CountPlugin";
import { createEmptyStatePlugin } from "vane-asset-library/custom-plugins/EmptyStatePlugin";
import { createKindBadgePlugin } from "vane-asset-library/custom-plugins/KindBadgePlugin";
import { createLightBoxPlugin } from "vane-asset-library/custom-plugins/LightBoxPlugin";
import { createPaginationPlugin } from "vane-asset-library/custom-plugins/PaginationPlugin";
import { createSelectAllPlugin } from "vane-asset-library/custom-plugins/SelectAllPlugin";
import { createSortPlugin } from "vane-asset-library/custom-plugins/SortPlugin";
import { createStatusBadgePlugin } from "vane-asset-library/custom-plugins/StatusBadgePlugin";
import { createTagFilterPlugin } from "vane-asset-library/custom-plugins/TagFilterPlugin";
import { createViewSwitchPlugin } from "vane-asset-library/custom-plugins/ViewSwitchPlugin";
import { SAMPLE_FOLDERS, bulkAssets } from "../data/samples";
import type { ScenarioMeta } from "./types";

const UGC = bulkAssets(96).filter((it) => it.folderId === "f-ugc" || it.status !== "ready");

const Library = withAssetLibraryPlugins(AssetLibraryCore, [
  createSortPlugin({}),
  createTagFilterPlugin({ max: 4, sort: "name" }),
  createViewSwitchPlugin({}),
  createCountPlugin({ showTotal: false, showSelected: true }),
  createSelectAllPlugin({ selectLabel: "全选本页", clearLabel: "取消" }),
  createKindBadgePlugin({ labels: { video: "视频" }, showFor: ["video"] }),
  createStatusBadgePlugin({ labels: { processing: "转码中", failed: "转码失败" } }),
  createCardActionsPlugin({
    actions: [
      { action: "preview", label: "预览", icon: "⌕" },
      { action: "reject", label: "驳回", icon: "×", tone: "danger" },
    ],
  }),
  createBulkBarPlugin({
    label: "待审 {n} 项",
    actions: [
      { action: "bulk:approve", label: "批量通过" },
      { action: "bulk:reject", label: "批量驳回", tone: "danger" },
    ],
  }),
  createPaginationPlugin({ pageSizes: [12, 24] }),
  createEmptyStatePlugin({ emptyText: "今天没有待审投稿", filteredText: "这个条件下没有投稿" }),
  createLightBoxPlugin({}),
]);

export const meta: ScenarioMeta = {
  id: "ugc-review",
  title: "用户投稿审核",
  group: "内容运营",
  ref: { label: "小红书 / 抖音创作者后台", url: "https://creator.xiaohongshu.com/" },
  pain: "待审队列里混着「还没转码好」的素材，运营选了它批量通过，结果一半操作失败。",
  plugs: [
    { fn: "createSortPlugin", why: "按创建时间排，先来先审。" },
    { fn: "createTagFilterPlugin", cfg: 'max: 4, sort: "name"', why: "按投稿话题分批处理，一次只审一类。" },
    { fn: "createViewSwitchPlugin", why: "审核看细节用网格，核对名单用列表。" },
    { fn: "createCountPlugin", cfg: "showTotal: false, showSelected: true", why: "总量没意义，只看「这轮选了几条」。" },
    { fn: "createSelectAllPlugin", cfg: 'selectLabel: "全选本页", clearLabel: "取消"', why: "审核是批量动作，全选是主路径；跳过未就绪项是硬要求。" },
    { fn: "createKindBadgePlugin", cfg: 'labels: { video: "视频" }, showFor: ["video"]', why: "视频要单独过一遍人工，角标先标出来。" },
    { fn: "createStatusBadgePlugin", cfg: '{ labels: { processing: "转码中", failed: "转码失败" } }', why: "状态必须一眼可见，否则选到就是白操作。" },
    { fn: "createCardActionsPlugin", cfg: 'actions: [{ action: "reject", label: "驳回", tone: "danger" }]', why: "单条驳回比勾选再点批量快。" },
    { fn: "createBulkBarPlugin", cfg: 'label: "待审 {n} 项"', why: "批量通过是这一页的核心动作，固定页脚常驻。" },
    { fn: "createPaginationPlugin", cfg: "pageSizes: [12, 24]", why: "一屏审 12 条是人的注意力上限。" },
    { fn: "createEmptyStatePlugin", cfg: '{ emptyText: "今天没有待审投稿" }', why: "审完要看得出「真的清空了」。" },
    { fn: "createLightBoxPlugin", why: "审核要看原图，不看缩略图。" },
  ],
  props: ["pageSize={12}", "maxSelected={12}", "columnWidth={150}"],
  note: "未就绪素材点了也不进选择集 —— 这是 Core 的语义，不是插件的补丁。",
  tone: "dark",
};

export default function UgcReviewScene() {
  const [items, setItems] = useState<AssetItem[]>(UGC);
  const [lastAction, setLastAction] = useState("—");

  const onAssetAction = useCallback(
    (action: string, payload: { id?: string; ids?: string[] }) => {
      const count = payload.ids?.length ?? (payload.id ? 1 : 0);
      setLastAction(`${action} · ${count} 项`);
      if (action === "bulk:reject" && payload.ids) {
        setItems((prev) => prev.filter((it) => !payload.ids?.includes(it.id)));
      }
    },
    []
  );

  return (
    <div className="stage">
      <Library
        items={items}
        folders={SAMPLE_FOLDERS}
        pageSize={12}
        maxSelected={12}
        columnWidth={150}
        onAssetAction={onAssetAction}
      />
      <p className="stage-tip">
        最近一次动作 <b>{lastAction}</b>
      </p>
    </div>
  );
}
