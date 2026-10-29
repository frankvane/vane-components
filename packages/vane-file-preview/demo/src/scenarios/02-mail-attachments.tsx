/**
 * D02 · 邮件附件列表
 *
 * 真实痛点是「一列附件里混着 pdf / docx / 图片 / zip」：每行要能显示类型与大小，
 * 点开就地在右侧看，而不是让用户逐个下载。这里刻意只装 7 个插件（不是 17 个）——
 * 附件场景里不会出现 .epub 或 .md，少装几个就少几份解析器要下载。
 *
 * 注意 sample.zip 这一行：zip 插件只读中央目录，不会解压内容，所以点开是即时的。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import {
  createCsvPreviewPlugin,
  createDocxPreviewPlugin,
  createImagePreviewPlugin,
  createPdfPreviewPlugin,
  createXlsxPreviewPlugin,
  createZipPreviewPlugin,
} from "vane-file-preview/custom-plugins";
import { formatBytes, shortMime } from "../lib/format";
import { pick } from "../data/samples";
import type { ScenarioMeta } from "./types";

const Preview = withPlugins(FilePreviewCore, {
  plugins: [
    createImagePreviewPlugin(),
    createPdfPreviewPlugin(),
    createDocxPreviewPlugin(),
    createXlsxPreviewPlugin(),
    createZipPreviewPlugin(),
    createCsvPreviewPlugin(),
  ],
});

const ATTACHMENTS = pick(
  "sample.docx",
  "sample.xlsx",
  "star.pdf",
  "sample.jpg",
  "sample.zip",
  "sample-data.csv"
);

export const meta: ScenarioMeta = {
  code: "D02",
  title: "邮件附件列表",
  pain: "一列附件混着 pdf / docx / xlsx / 图片 / zip。每行要给出类型与大小，点开就得在右侧看，而不是让用户逐个下载到本地再打开。",
  plugs: [
    { fn: "createDocxPreviewPlugin", why: "docx 直接还原版式，合同类附件不用下载" },
    { fn: "createXlsxPreviewPlugin", why: "多 Sheet 离线解析，报价单能直接核对" },
    { fn: "createPdfPreviewPlugin", why: "内嵌浏览器查看器，翻页与打印都现成" },
    { fn: "createImagePreviewPlugin", why: "截图类附件按原图看，可缩放" },
    { fn: "createZipPreviewPlugin", why: "只读目录不解压，几 GB 的包也能秒开" },
    { fn: "createCsvPreviewPlugin", why: "导出的账单表格，编码与分隔符自动识别" },
  ],
  note: "只装 6 个插件：附件场景不会有 .epub / .md，少装就少几份解析器要下载。路由仍由 resolvePreview 决出，不是按行写死的。",
};

const MailScenario: React.FC = () => {
  const [active, setActive] = React.useState(ATTACHMENTS[0].name);
  const picked = ATTACHMENTS.find((a) => a.name === active) ?? ATTACHMENTS[0];
  // 这里只装了 DocxPreviewPlugin（版式还原），而它的 canHandle 要求
  // `file.docxMode === "docx-preview"` —— 不补这一句，docx 那一行点开就是
  // Core 的「没有插件能预览这个文件」。这正是「两个 docx 渲染器互斥」的代价：
  // 声明是消费方的责任，插件不会替你猜。
  const file = picked.extension === "docx" ? { ...picked, docxMode: "docx-preview" as const } : picked;

  return (
    <div className="attach-grid" style={{ alignItems: "stretch" }}>
      <div style={{ display: "grid", gap: 6, alignContent: "start" }}>
        {ATTACHMENTS.map((a) => (
          <button
            key={a.name}
            type="button"
            className="attach-row"
            aria-pressed={a.name === active}
            onClick={() => setActive(a.name)}
          >
            <span className="attach-icon">{a.extension.slice(0, 4)}</span>
            <span style={{ minWidth: 0 }}>
              <span className="attach-name">{a.name}</span>
              <span className="attach-meta">
                {formatBytes(a.size)} · {shortMime(a.type)}
              </span>
            </span>
            <span className="attach-plug">{a.extension.toUpperCase()}</span>
          </button>
        ))}
        <p className="muted" style={{ margin: "4px 2px 0", fontSize: 11 }}>
          共 {ATTACHMENTS.length} 个附件 · 点击任意一行在右侧查看
        </p>
      </div>

      <div className="stage-shell" style={{ height: 400 }}>
        <div className="filebar">
          <span className="filebar-label">attach</span>
          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "#5f5d58" }}>
            {file.name}
          </span>
        </div>
        <div className="stage-mount">
          <Preview file={file} containerStyle={{ width: "100%", height: "100%" }} />
        </div>
        <div className="stage-foot">
          <span className="dot is-loaded" aria-hidden="true" />
          <span>{shortMime(file.type)}</span>
          <span style={{ marginLeft: "auto" }}>{formatBytes(file.size)}</span>
        </div>
      </div>
    </div>
  );
};

export default MailScenario;
