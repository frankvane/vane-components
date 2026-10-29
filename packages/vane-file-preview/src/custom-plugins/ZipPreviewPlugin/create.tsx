/**
 * `vane-file-preview/custom-plugins/ZipPreviewPlugin`
 *
 * 压缩包预览：解出条目列表（目录在前、文件在后），显示未压缩大小。
 *
 * ## 迁移时改掉的三件事
 *
 * 1. **`jszip` 从静态 import 改成动态 import** —— 没装依赖时渲染
 *    `MissingDependency` 面板，而不是让整个页面在模块加载阶段崩掉（见 panels.tsx）。
 * 2. **`maxFiles` / `showFileSize` 从「声明了但没用」变成真的生效**。
 *    迁移前两个配置项都写在 `config` 里、也进了 doc，但渲染时既没截断也没隐藏：
 *    一个 5000 文件的压缩包会一次性铺 5000 个 div，而且大小列永远显示。
 * 3. **`name` 保持 `ZipPreviewPlugin`，`priority` 从 `hooks.getPriority()` 改成声明式 8。**
 *
 * ## 只读列表，不解压内容
 *
 * 解压内层文件意味着要把内容渲成新文件再走一遍预览管线（递归装配），
 * 复杂度远大于「看一眼里面有什么」的需求。压缩包里最常见的需求就是「有没有这个文件」，
 * 所以这里停在列表层，并在底部写明这个边界。
 */

import React, { useEffect, useState } from "react";

import {
  formatBytes,
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import {
  defaultOf,
  useDynamicModule,
} from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import type {
  FilePreviewPlugin,
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";

export interface ZipPreviewPluginConfig {
  /** 显示每一项的未压缩大小。默认 true */
  showFileSize?: boolean;
  /** 最多列出多少项，超出只提示总数。默认 200 */
  maxFiles?: number;
}

interface ZipEntry {
  name: string;
  isDirectory: boolean;
  size: number;
}

interface JSZipFileEntry {
  name: string;
  dir: boolean;
  /** jszip 没有公开 API 读这两项，只能摸 `_data`（见下方注释） */
  _data?: { uncompressedSize?: number; compressedSize?: number };
}

interface JSZipLike {
  files: Record<string, JSZipFileEntry>;
}

interface JSZipModule {
  loadAsync: (data: ArrayBuffer) => Promise<JSZipLike>;
}

/** 模块级常量：引用稳定，`useDynamicModule` 的 effect 只跑一次 */
const loadJSZip = () => import("jszip");

type ZipState =
  | { status: "loading" }
  | { status: "ready"; entries: ZipEntry[]; total: number }
  | { status: "error"; error: string };

function ZipBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: Required<ZipPreviewPluginConfig>;
}) {
  const { file } = context;
  const [zip, setZip] = useState<ZipState>({ status: "loading" });
  const jszipModule = useDynamicModule(loadJSZip);

  useEffect(() => {
    if (jszipModule.status !== "ready") return;

    let alive = true;
    setZip({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const buf = await res.arrayBuffer();

        const JSZip = defaultOf<JSZipModule>(jszipModule.mod);
        const archive = await JSZip.loadAsync(buf);

        const list: ZipEntry[] = Object.values(archive.files).map((f) => {
          // jszip 的 `files` 条目上没有公开的 size 字段，只能读内部的 `_data`。
          // 拿不到就退到 0 —— 界面显示「—」而不是编造一个数字。
          const size = f._data?.uncompressedSize ?? f._data?.compressedSize ?? 0;
          return { name: f.name, isDirectory: !!f.dir, size };
        });

        // 目录在前、再按名称 —— 与资源管理器的习惯一致
        list.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        if (!alive) return;
        setZip({ status: "ready", entries: list, total: list.length });
      } catch (err) {
        if (!alive) return;
        setZip({
          status: "error",
          error: err instanceof Error ? err.message : "压缩包解析失败",
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [file.url, jszipModule]);

  if (jszipModule.status === "unavailable") {
    return (
      <MissingDependency
        pkg="jszip"
        feature="解析 zip 内的条目列表需要 jszip"
        error={jszipModule.error.message}
      />
    );
  }

  if (jszipModule.status === "loading" || zip.status === "loading") {
    return <LoadingPanel icon="📦" label="正在解析压缩包…" />;
  }

  if (zip.status === "error") {
    return <ErrorPanel label="压缩包解析失败" error={zip.error} />;
  }

  const visible = zip.entries.slice(0, config.maxFiles);
  const hidden = zip.total - visible.length;

  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        padding: 16,
        boxSizing: "border-box",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 12,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>
            📦 {file.name}
          </span>
          <span>· {zip.total} 项</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {visible.map((entry) => (
            <div
              key={entry.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 4,
                background: entry.isDirectory ? "#f3f4f6" : "transparent",
                fontSize: 13,
              }}
            >
              <span style={{ width: 16, textAlign: "center" }}>
                {entry.isDirectory ? "📁" : "📄"}
              </span>
              <span
                style={{
                  flex: 1,
                  wordBreak: "break-all",
                  color: entry.isDirectory ? "#111827" : "#374151",
                  fontWeight: entry.isDirectory ? 500 : 400,
                }}
              >
                {entry.name}
              </span>
              {config.showFileSize && !entry.isDirectory && (
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {entry.size > 0 ? formatBytes(entry.size) : "—"}
                </span>
              )}
            </div>
          ))}
        </div>

        {hidden > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 10px",
              background: "#f9fafb",
              borderRadius: 4,
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            还有 {hidden} 项未列出（maxFiles = {config.maxFiles}）。
          </div>
        )}

        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "#9ca3af",
            lineHeight: 1.7,
          }}
        >
          这里只列出条目，不解压内容 —— 想预览压缩包里的某个文件，先下载解开。
        </div>
      </div>
    </div>
  );
}

export function createZipPreviewPlugin(
  config: ZipPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<ZipPreviewPluginConfig> = {
    showFileSize: config.showFileSize ?? true,
    maxFiles: config.maxFiles ?? 200,
  };

  return {
    name: "ZipPreviewPlugin",
    version: "1.0.0",
    description: "压缩包条目列表（jszip）",
    supportedTypes: ["application/zip", "application/x-zip-compressed"],
    // 只声明 .zip：.rar / .7z 的**容器格式不同**，jszip 一律解不开，
    // 迁移前把它们写在这里等于「认领了再报错」。它们应当落到兜底下载。
    supportedExtensions: [".zip"],
    priority: 9,
    config: resolved,

    hooks: {
      render: (context) => <ZipBody context={context} config={resolved} />,

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="ZIP"
            icon="📦"
          />
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() =>
              triggerDownload(context.file.url, context.file.name)
            }
            icon="📥"
            title="下载压缩包"
          >
            下载
          </ToolbarButton>
        </ToolbarContainer>
      ),
    },
  };
}

export default createZipPreviewPlugin;
