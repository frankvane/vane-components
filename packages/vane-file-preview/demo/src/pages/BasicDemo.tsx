/**
 * P3-A 验收页：6 个轻量插件 + 真实样本文件。
 *
 * 单测能证明「声明对了、能渲染」，证明不了「浏览器里真的能看」——
 * PDF 的 iframe 到底渲不渲染、视频能不能播、Office 那条「公网可达」判断
 * 在 localhost 下是不是真的走了说明面板，只有真浏览器能回答。
 *
 * 样本放在 `demo/public/samples/`（P5 会把 archive 里 37 个样本整体迁过来），
 * 每个都是**真文件**而不是 data URL —— data URL 能骗过图片，骗不过
 * PDF 查看器与 video 解码器。
 *
 * 「装兜底插件」这个开关是为了同时演示两条互斥的语义：
 *   开 → DownloadPlugin 认领一切，unsupported 面板永不出现；
 *   关 → 没有插件认领的格式落到 `[data-vfp-unsupported]` 提示。
 */
import { useState } from "react";
import {
  FilePreviewCore,
  resolvePreview,
  withPlugins,
  type FileInfo,
} from "vane-file-preview";
import { createImagePreviewPlugin } from "vane-file-preview/custom-plugins/ImagePreviewPlugin";
import { createPdfPreviewPlugin } from "vane-file-preview/custom-plugins/PdfPreviewPlugin";
import { createVideoPreviewPlugin } from "vane-file-preview/custom-plugins/VideoPreviewPlugin";
import { createAudioPreviewPlugin } from "vane-file-preview/custom-plugins/AudioPreviewPlugin";
import { createOfficePreviewPlugin } from "vane-file-preview/custom-plugins/OfficePreviewPlugin";
import { createDownloadPlugin } from "vane-file-preview/custom-plugins/DownloadPlugin";

interface Sample extends FileInfo {
  /** 这一项是用来演示什么的 */
  note: string;
}

const sample = (
  name: string,
  type: string,
  extension: string,
  size: number,
  note: string
): Sample => ({
  name,
  type,
  extension,
  size,
  url: `/samples/${name}`,
  note,
});

const FILES: Sample[] = [
  sample("sample.jpg", "image/jpeg", "jpg", 44155, "JPEG · 缩放 / 旋转 / 复位"),
  sample("sample.png", "image/png", "png", 134340, "PNG"),
  sample("sample.svg", "image/svg+xml", "svg", 1497, "SVG（同一套 transform）"),
  sample("star.pdf", "application/pdf", "pdf", 144370, "PDF · 浏览器原生查看器"),
  sample("sample.mp4", "video/mp4", "mp4", 2498125, "MP4 · 原生 video"),
  sample("sample.ogg", "audio/ogg", "ogg", 104793, "OGG 音频"),
  sample(
    "sample.avi",
    "video/x-msvideo",
    "avi",
    742478,
    "AVI · 浏览器普遍不支持 → 走 error 面板"
  ),
  sample(
    "sample.docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "docx",
    20817,
    "DOCX · localhost 不可达 → 走说明面板"
  ),
  sample(
    "sample.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xlsx",
    13060,
    "XLSX · 同上"
  ),
  sample("sample.zip", "application/zip", "zip", 97668, "ZIP · 落到兜底下载"),
  sample(
    "mystery.dat",
    "application/x-unknown",
    "dat",
    0,
    "未知格式 · 关掉兜底才看得到 unsupported"
  ),
];

/**
 * 装配写在模块顶层。
 *
 * 迁移前 13 个示例页里 11 个把 `withPlugins(...)` 写在函数体内 —— 每次渲染都造一个
 * 新组件类型，React 把整棵子树卸载重建（预览会闪、状态全丢）。
 */
const OFFICIAL = [
  createImagePreviewPlugin(),
  createPdfPreviewPlugin(),
  createVideoPreviewPlugin(),
  createAudioPreviewPlugin(),
  createOfficePreviewPlugin(),
  createDownloadPlugin(),
];

/** 去掉兜底：没有插件认领的格式就会真的落到 unsupported */
const WITHOUT_FALLBACK = OFFICIAL.filter((p) => p.name !== "DownloadPlugin");

const PreviewWithFallback = withPlugins(FilePreviewCore, { plugins: OFFICIAL });
const PreviewStrict = withPlugins(FilePreviewCore, {
  plugins: WITHOUT_FALLBACK,
});

export function BasicDemo() {
  const [index, setIndex] = useState(0);
  const [withFallback, setWithFallback] = useState(true);

  const file = FILES[index];
  const activePlugins = withFallback ? OFFICIAL : WITHOUT_FALLBACK;
  // 用导出的纯函数问一次「谁在渲染」，而不是猜装配器选了谁
  const winner = resolvePreview(activePlugins, file);
  const Preview = withFallback ? PreviewWithFallback : PreviewStrict;

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {FILES.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setIndex(i)}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: `1px solid ${i === index ? "#1f2329" : "#d8d8d8"}`,
              background: i === index ? "#1f2329" : "#fff",
              color: i === index ? "#fff" : "#1f2329",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {f.name}
          </button>
        ))}
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "#57606a",
        }}
      >
        <input
          type="checkbox"
          checked={withFallback}
          onChange={(e) => setWithFallback(e.target.checked)}
        />
        装 DownloadPlugin 兜底（关掉它才能看到 unsupported 面板）
      </label>

      <div
        data-card-stage
        style={{
          height: 480,
          border: "1px solid #e6e6e6",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <Preview file={file} />
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "#8a8a8a", lineHeight: 1.7 }}>
        当前：<code>{file.name}</code> · {file.type || "MIME 未知"} · {file.note}
        <br />
        渲染它的插件：
        <strong style={{ color: winner ? "#1f2329" : "#d1242f" }}>
          {winner ? ` ${winner.name}` : "（无 · unsupported 面板）"}
        </strong>
      </p>
    </section>
  );
}
