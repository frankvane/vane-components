/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React, { useRef, useState } from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import doc from "./doc.json";

/**
 * DropzonePlugin — 拖拽上传占位。
 *
 * 边界（分析 §0）：组件只负责「收集 File[] 并交回宿主」，
 * 不发起请求、不管进度/重试/断点 —— 那套语义属于宿主的上传器。
 *
 * accept 支持 `image/*` 这类前缀规则，也支持 `.png` 扩展名；命中的文件才会上抛。
 */
export interface DropzoneConfig {
  /** 允许的类型，默认 ["image/*", "video/*"] */
  accept?: string[];
  /** 主文案 */
  label?: string;
  /** 是否允许一次多选，默认 true */
  multiple?: boolean;
}

const DEFAULT_ACCEPT = ["image/*", "video/*"];

/** accept 规则匹配：`image/*` 走 MIME 前缀，其余按 MIME 等值或扩展名后缀 */
export function matchesAccept(file: File, accept: string[]): boolean {
  if (!accept.length) return true;
  const type = file.type || "";
  const name = file.name.toLowerCase();
  return accept.some((rule) => {
    const normalized = rule.trim().toLowerCase();
    if (!normalized) return false;
    if (normalized.endsWith("/*")) return type.startsWith(normalized.slice(0, -1));
    if (normalized.startsWith(".")) return name.endsWith(normalized);
    return type === normalized;
  });
}

interface DropzoneViewProps {
  ctx: AssetLibraryContext;
  accept: string[];
  label: string;
  multiple: boolean;
}

function DropzoneView({ ctx, accept, label, multiple }: DropzoneViewProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const deliver = (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((file) => matchesAccept(file, accept));
    if (files.length) ctx.requestUpload(files);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      className="vc-asset-dropzone"
      data-dragging={dragging ? "true" : undefined}
      role="button"
      tabIndex={0}
      aria-label={`${label}，也可点击选择文件`}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(event) => {
        // 不 preventDefault 的话浏览器会直接打开文件，drop 事件永远不来
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        deliver(event.dataTransfer?.files ?? null);
      }}
    >
      <span>
        <strong>{label}</strong> 或点击选择文件
      </span>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept.join(",")}
        multiple={multiple}
        onChange={(event) => {
          deliver(event.target.files);
          // 清空 value：否则连续选同一个文件不会再触发 change
          event.target.value = "";
        }}
      />
    </div>
  );
}

export const createDropzonePlugin: AssetPluginCreator<DropzoneConfig> = (
  config = {}
) => {
  const accept = config.accept ?? DEFAULT_ACCEPT;
  const label = config.label ?? "拖拽素材到此处";
  const multiple = config.multiple !== false;

  return {
    name: "dropzone",
    version: "0.1.0",
    description: doc.description,
    priority: 5,
    config,
    hooks: {
      renderDropzone: (context) => (
        <DropzoneView ctx={context} accept={accept} label={label} multiple={multiple} />
      ),
    },
  } satisfies AssetPlugin;
};

createDropzonePlugin.meta = doc as PluginDoc;
