/**
 * 场景 04 · 商品选图（单选 · 浅色后台）
 *
 * 同一个组件在「选一张」时怎么用：multiple={false} + maxSelected={1}，
 * 点第二张自动替换第一张，不弹「只能选一个」的提示。
 * 底色换成浅色（tone-light 只覆盖语义令牌，组件代码一行不改）。
 */
import React, { useCallback, useState } from "react";
import { AssetLibraryCore, withAssetLibraryPlugins } from "vane-asset-library";
import { createCountPlugin } from "vane-asset-library/custom-plugins/CountPlugin";
import { createEmptyStatePlugin } from "vane-asset-library/custom-plugins/EmptyStatePlugin";
import { createFolderFilterPlugin } from "vane-asset-library/custom-plugins/FolderFilterPlugin";
import { createKindFilterPlugin } from "vane-asset-library/custom-plugins/KindFilterPlugin";
import { createLightBoxPlugin } from "vane-asset-library/custom-plugins/LightBoxPlugin";
import { createMetaLinePlugin } from "vane-asset-library/custom-plugins/MetaLinePlugin";
import { createPaginationPlugin } from "vane-asset-library/custom-plugins/PaginationPlugin";
import { createSearchPlugin } from "vane-asset-library/custom-plugins/SearchPlugin";
import { createSelectMarkPlugin } from "vane-asset-library/custom-plugins/SelectMarkPlugin";
import { createTagFilterPlugin } from "vane-asset-library/custom-plugins/TagFilterPlugin";
import { SAMPLE_ASSETS, SAMPLE_FOLDERS } from "../data/samples";
import type { ScenarioMeta } from "./types";

const Library = withAssetLibraryPlugins(AssetLibraryCore, [
  createSearchPlugin({ placeholder: "搜商品图", hotkey: false }),
  createKindFilterPlugin({ allLabel: "全部" }),
  createTagFilterPlugin({ max: 4 }),
  createFolderFilterPlugin({ allLabel: "全部图库" }),
  createCountPlugin({ showTotal: false, showVisible: false }),
  createSelectMarkPlugin({ showIndex: false }),
  createMetaLinePlugin({ show: ["dimension", "size"], maxTags: 0 }),
  createPaginationPlugin({ pageSizes: [8, 16] }),
  createEmptyStatePlugin({ filteredText: "没有匹配的图片" }),
  createLightBoxPlugin({}),
]);

export const meta: ScenarioMeta = {
  id: "product-picker",
  title: "商品选图（单选）",
  group: "电商后台",
  ref: { label: "淘宝千牛 / 抖店后台", url: "https://myseller.taobao.com/" },
  pain: "商品主图只能选一张，但素材库通常长得像多选页：点了两张，用户不知道到底存了哪张。",
  plugs: [
    { fn: "createSearchPlugin", cfg: 'placeholder: "搜商品图", hotkey: false', why: "这个页面嵌在表单里，全局热键会和表单冲突，关掉。" },
    { fn: "createKindFilterPlugin", cfg: 'allLabel: "全部"', why: "主图只用图片，但图库里也有视频，先收窄。" },
    { fn: "createTagFilterPlugin", cfg: "max: 4", why: "按品类标签找图，比翻页快。" },
    { fn: "createFolderFilterPlugin", cfg: 'allLabel: "全部图库"', why: "按店铺 / 品牌分图库。" },
    { fn: "createCountPlugin", cfg: "showTotal: false, showVisible: false", why: "选图场景只关心选中了谁，数字越多越乱。" },
    { fn: "createSelectMarkPlugin", cfg: "showIndex: false", why: "单选不需要序号，一个对勾就够。" },
    { fn: "createMetaLinePlugin", cfg: 'show: ["dimension", "size"], maxTags: 0', why: "主图有最低分辨率要求，尺寸必须一眼可见。" },
    { fn: "createPaginationPlugin", cfg: "pageSizes: [8, 16]", why: "嵌在表单里，一屏 8 张不会把页面撑太长。" },
    { fn: "createEmptyStatePlugin", cfg: '{ filteredText: "没有匹配的图片" }', why: "筛空时提示换个词，而不是让用户以为图库是空的。" },
    { fn: "createLightBoxPlugin", why: "主图要看清细节，尤其是有没有水印。" },
  ],
  props: ["multiple={false}", "maxSelected={1}", "pageSize={8}", "columnWidth={140}"],
  note: "单选语义由 Core 负责：multiple={false} 时点第二张直接替换，不会堆积选中项。",
  tone: "light",
};

export default function ProductPickerScene() {
  const [selected, setSelected] = useState<string[]>(["a-06"]);

  // 受控用法：真相在页面（表单）这一侧，组件只回传
  const onSelectionChange = useCallback((ids: string[]) => {
    setSelected(ids.slice(0, 1));
  }, []);

  return (
    <div className="stage">
      <Library
        items={SAMPLE_ASSETS.filter((it) => it.folderId === "f-product" || it.kind === "image")}
        folders={SAMPLE_FOLDERS}
        multiple={false}
        maxSelected={1}
        pageSize={8}
        columnWidth={140}
        selectedIds={selected}
        onSelectionChange={onSelectionChange}
      />
      <p className="stage-tip">
        当前主图 <b>{selected[0] ?? "未选择"}</b>
      </p>
    </div>
  );
}
