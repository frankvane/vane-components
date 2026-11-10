/**
 * 示例 13 · 收藏
 *
 * 组件不存收藏状态：点星标 → `onAssetAction("favorite", { id })` → 宿主翻转
 * `item.favorite` → 组件按新数据重渲染。这一页用页面状态扮演宿主。
 */
import React, { useCallback, useState } from "react";
import type { AssetItem } from "vane-asset-library";
import { SAMPLE_ASSETS, SAMPLE_FOLDERS } from "../data/samples";
import { baseProps, useLibrary } from "./_factory";
import type { DemoMeta, DemoStageProps } from "./types";

export const meta: DemoMeta = {
  slug: "favorite",
  title: "收藏标记",
  group: "plugin",
  plugin: "FavoritePlugin",
  intro:
    "卡片右上角的星标，点一下发出 favorite 动作；是否真的收藏由宿主决定，组件只按 item.favorite 渲染。",
  why: "收藏几乎是所有素材库的第一需求，但它属于业务状态（存哪、怎么同步、要不要同步到服务端），组件不该假装知道。",
  plugs: [
    {
      fn: "createFavoritePlugin",
      cfg: 'action: "favorite"',
      why: "纯受控：读 item.favorite，点击只 requestAction，不改任何本地状态。",
    },
  ],
  props: [],
  controls: [],
  stageHeight: 480,
  note: "这一页的 onAssetAction 把动作写进日志并翻转 item.favorite —— 真实项目里换成你的接口调用即可。",
};

function Stage({ cfg, log }: DemoStageProps) {
  const Library = useLibrary("FavoritePlugin", cfg);
  const [items, setItems] = useState<AssetItem[]>(SAMPLE_ASSETS);

  const onAssetAction = useCallback(
    (action: string, payload: { id?: string; ids?: string[] }) => {
      if (action !== "favorite" || !payload.id) return;
      const target = payload.id;
      setItems((prev) =>
        prev.map((it) => (it.id === target ? { ...it, favorite: !it.favorite } : it))
      );
      const next = !items.find((it) => it.id === target)?.favorite;
      log(`${next ? "收藏" : "取消收藏"} ${target}`);
    },
    [items, log]
  );

  return (
    <div className="stage">
      <Library
        items={items}
        folders={SAMPLE_FOLDERS}
        {...baseProps(cfg, log)}
        onAssetAction={onAssetAction}
      />
    </div>
  );
}

export default Stage;
