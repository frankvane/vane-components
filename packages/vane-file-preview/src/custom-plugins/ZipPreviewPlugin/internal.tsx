/**
 * `ZipPreviewPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import { useEffect, useState } from "react";

import { formatBytes } from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import {
  defaultOf,
  useDynamicModule,
} from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import type {
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";
import type { ZipPreviewPluginConfig } from "./create";

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

type ZipState =
  | { status: "loading" }
  | { status: "ready"; entries: ZipEntry[]; total: number }
  | { status: "error"; error: string };

export function ZipBody({
  context,
  config,
  loadJSZip,
}: {
  context: FilePreviewPluginContext;
  config: Required<ZipPreviewPluginConfig>;
  loadJSZip: () => Promise<unknown>;
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
        if (config.maxFileSize > 0 && file.size > config.maxFileSize) {
          throw new Error(
            `文件 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过压缩包解析上限 ${(
              config.maxFileSize /
              1024 /
              1024
            ).toFixed(1)}MB`
          );
        }

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
  }, [file.url, file.size, jszipModule, config.maxFileSize]);

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
