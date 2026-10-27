/**
 * 页面内几何自检（与 `scripts/audit-pages.mjs` 同一套判据）
 *
 * 为什么文件预览需要几何体检：预览器是「把外部内容塞进一个固定框」，
 * 而外部内容的尺寸由文件决定 —— PDF 页、docx 分页、表格、iframe 都可能
 * 把容器撑破或塌成 0 高。单测（happy-dom）里没有布局引擎，这些一条都测不出来。
 *
 * 三类判据：
 *   empty          块里找不到预览挂载点（路由错了 / 页面装配漏了）
 *   zero-size      挂载点宽或高 ≤ 1px（父级没给高度；PDF/iframe 的经典死法）
 *   overflow       挂载点横向滚动条（内容比框宽）
 *   no-plugin      挂载点里是 Core 的「没有插件能预览这个文件」
 *   squashed       `<audio controls>` 被压扁（< 24px）或被父级裁掉一部分
 *   page-overflow  整页比视口宽（网格被内容顶宽，通常是右栏的表格或长 token）
 *
 * 纵向溢出**不算问题**：预览正文本来就该能滚。
 *
 * `no-plugin` 是几何判据抓不到的一类：块在、尺寸正常、无溢出，**全绿**，
 * 但内容是「没有插件能预览这个文件」。实测踩过：docx 的两个渲染器由
 * `file.docxMode` 互斥决定，页面上少补一个字段就静默变成这个面板。
 * 判据只认 Core 那句（`没有插件能预览这个文件`），不认 DownloadPlugin 的
 * 「没有插件能预览这种格式」—— 后者是兜底插件的正常文案。
 *
 * 与脚本的一处刻意差异：脚本要跑首页和目录页（那两页本来就没有舞台），
 * 所以「0 个块」在那儿不算错；这里是人在预览页上手点的，0 个块一定是装配漏了。
 * 脚本独有 `lazy` 判据（要先滚一遍全页才成立），这里没有，因为人已经滚到位置了。
 */
export interface AuditIssue {
  /** 块锚点值：`[data-demo]` / `[data-plugin]` / `[data-scenario]` 的属性值 */
  block: string;
  kind: "empty" | "zero-size" | "overflow" | "no-plugin" | "squashed" | "page-overflow";
  detail: string;
}

const TOL = 1;

/** Core 在没有任何插件认领文件时渲染的面板文案（见 src/plugins/resolve.ts） */
const NO_PLUGIN_TEXT = "没有插件能预览这个文件";

/** 三种块锚点，审计单位是「块」而不是「页面」 */
const BLOCK_SELECTOR = "[data-demo], [data-plugin], [data-scenario]";

function blockName(el: HTMLElement): string {
  return (
    el.dataset.demo ??
    el.dataset.plugin ??
    el.dataset.scenario ??
    el.id ??
    "unknown"
  );
}

export function auditPreviews(root: ParentNode = document): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const blocks = Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR));

  if (blocks.length === 0) {
    return [{ block: "(page)", kind: "empty", detail: "页面上没有任何块锚点" }];
  }

  for (const block of blocks) {
    const name = blockName(block);
    const mounts = Array.from(block.querySelectorAll<HTMLElement>(".stage-mount"));

    if (mounts.length === 0) {
      issues.push({ block: name, kind: "empty", detail: "块里没有 .stage-mount" });
      continue;
    }

    for (const mount of mounts) {
      const box = mount.getBoundingClientRect();
      if (box.width <= TOL || box.height <= TOL) {
        issues.push({
          block: name,
          kind: "zero-size",
          detail: `挂载点 ${Math.round(box.width)}×${Math.round(box.height)}`,
        });
        continue;
      }

      // 只查横向：预览正文纵向滚动是正常行为
      if (mount.scrollWidth > mount.clientWidth + TOL) {
        issues.push({
          block: name,
          kind: "overflow",
          detail: `scrollWidth ${mount.scrollWidth} > clientWidth ${mount.clientWidth}`,
        });
      }

      // 内容级判据：尺寸全对，但里面根本没有预览器（装配漏了插件 / 少声明 docxMode）
      if ((mount.textContent ?? "").includes(NO_PLUGIN_TEXT)) {
        issues.push({
          block: name,
          kind: "no-plugin",
          detail: "挂载点里是 Core 的「没有插件能预览这个文件」",
        });
      }

      // 原生音频控件高度由浏览器画（Chrome 54px）。被 flex 压扁之后时间轴与按钮
      // 会被裁掉，而块和挂载点的尺寸全都正常 —— 上面每条判据都是绿的。
      for (const media of Array.from(mount.querySelectorAll<HTMLMediaElement>("audio[controls]"))) {
        const mb = media.getBoundingClientRect();
        if (mb.height < 24) {
          issues.push({
            block: name,
            kind: "squashed",
            detail: `原生音频控件只剩 ${Math.round(mb.height)}px 高`,
          });
          continue;
        }
        const visible = Math.min(mb.bottom, box.bottom) - Math.max(mb.top, box.top);
        if (visible < mb.height - TOL) {
          issues.push({
            block: name,
            kind: "squashed",
            detail: `音频控件被裁：可见 ${Math.round(visible)} / ${Math.round(mb.height)}px`,
          });
        }
      }
    }
  }

  // 整页横向溢出：块自己没超，但它把栅格顶宽了（右栏长 token / 宽表格的经典死法）
  const body = document.body;
  if (body.scrollWidth > window.innerWidth + 2) {
    issues.push({
      block: "(page)",
      kind: "page-overflow",
      detail: `body ${body.scrollWidth} > 视口 ${window.innerWidth}`,
    });
  }

  return issues;
}

/** 一行摘要，给页面上的体检面板用 */
export function summarizeIssues(issues: AuditIssue[], blocks: number): string {
  if (issues.length === 0) return `${blocks} 块 · 0 命中`;
  const kinds = new Map<string, number>();
  for (const i of issues) kinds.set(i.kind, (kinds.get(i.kind) ?? 0) + 1);
  return `${blocks} 块 · ${issues.length} 命中（${[...kinds]
    .map(([k, v]) => `${k}:${v}`)
    .join(" ")}）`;
}
