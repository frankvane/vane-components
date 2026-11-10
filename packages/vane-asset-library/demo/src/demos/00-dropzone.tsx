/**
 * 示例 00 · 拖拽上传占位
 *
 * 这一页要演示的是「组件只负责收集文件，上传归宿主」：拖进来的文件立刻以
 * `status: "processing"` 追加到列表，1.2s 后由页面（假装是宿主的上传接口）
 * 把它们改成 `ready`。组件全程不知道有网络请求这回事。
 */
import React, { useCallback, useState } from "react";
import type { AssetItem } from "vane-asset-library";
import { makeUploadingAsset, SAMPLE_ASSETS, SAMPLE_FOLDERS } from "../data/samples";
import { baseProps, useLibrary } from "./_factory";
import type { DemoMeta, DemoStageProps } from "./types";

export const meta: DemoMeta = {
  slug: "dropzone",
  title: "拖拽上传占位",
  group: "plugin",
  plugin: "DropzonePlugin",
  intro:
    "把图片或视频拖到网格上方的虚线区，组件把 File[] 交给 onUpload，剩下的（上传、进度、失败重试）全部归宿主。",
  why: "素材库最常见的入口就是拖拽。内置 XHR 只会逼你在「进度条长什么样」上跟组件打架，所以这里只做占位与回调。",
  plugs: [
    {
      fn: "createDropzonePlugin",
      cfg: 'label: "拖素材到这里，或点击选择", accept: ["image/*", "video/*"]',
      why: "虚线占位 + 点击唤起系统文件选择；accept 决定选文件对话框的过滤条件。",
    },
  ],
  props: [],
  controls: [
    { key: "multiple", label: "允许多选", kind: "switch", init: true },
  ],
  stageHeight: 520,
  note: "演示里「上传」是本地 setTimeout 假装的：真实项目请在 onUpload 里走自己的上传，完成后把新素材合并进 items。",
};

function Stage({ cfg, log }: DemoStageProps) {
  const Library = useLibrary("DropzonePlugin", cfg);
  const [items, setItems] = useState<AssetItem[]>(SAMPLE_ASSETS);

  const onUpload = useCallback(
    (files: File[]) => {
      const added = files.map((_, i) => makeUploadingAsset(i));
      setItems((prev) => [...added, ...prev]);
      log(`收到 ${files.length} 个文件：${files.map((f) => f.name).join("、")}`);

      // 假装上传完成：宿主改了 status，组件只是照着渲染
      window.setTimeout(() => {
        setItems((prev) =>
          prev.map((it) => (it.id.startsWith("up-") ? { ...it, status: "ready" } : it))
        );
        log(`上传完成，${added.length} 项转为 ready`, "info");
      }, 1200);
    },
    [log]
  );

  return (
    <div className="stage">
      <Library
        items={items}
        folders={SAMPLE_FOLDERS}
        {...baseProps(cfg, log)}
        onUpload={onUpload}
      />
    </div>
  );
}

export default Stage;
