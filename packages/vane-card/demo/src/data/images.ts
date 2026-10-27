/**
 * 演示用图片：本地生成的 SVG data URI。
 *
 * 为什么不用远程图：示例站常被挂在内网 / 离线环境，外链图会破，
 * 而体检脚本会断言 `naturalWidth > 0`（防破图）—— 外链一断就全页报红，
 * 分不清是组件坏了还是网络坏了。SVG 是同步解码的，天然满足断言。
 *
 * 同时刻意用不同色相 + 不同宽高比，方便肉眼看出「哪张图属于哪个规格」。
 */

/** 一组低饱和的「编辑部」色相，跟 demo 的深色版式搭得起来 */
const HUES = [12, 32, 48, 96, 152, 196, 232, 268, 300, 336];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export interface SvgOptions {
  label: string;
  width?: number;
  height?: number;
  /** 覆盖默认色相 */
  hue?: number;
  /** 右下角小字（如 规格 / 序号） */
  note?: string;
}

/** 生成一张「产品图」：对角渐变 + 几何装饰 + 居中标签
 *
 * 标签**居中**而不是左上角：卡片主图的容器比例不固定（复合组件 4:3、
 * ImagePlugin 1:1、视频 16:9），左上角的字一定会被 object-fit: cover 裁掉一半。
 * 居中就能被任何比例安全裁切。
 */
export function svgImage({ label, width = 800, height = 600, hue, note }: SvgOptions): string {
  const h = hue ?? HUES[hash(label) % HUES.length];
  const h2 = (h + 26) % 360;
  const cx = width / 2;
  const cy = height / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${h} 34% 26%)"/>
<stop offset="1" stop-color="hsl(${h2} 28% 14%)"/>
</linearGradient>
</defs>
<rect width="${width}" height="${height}" fill="url(#g)"/>
<g fill="none" stroke="hsl(${h} 40% 62%)" stroke-opacity=".35">
<circle cx="${Math.round(width * 0.76)}" cy="${Math.round(height * 0.24)}" r="${Math.round(width * 0.16)}"/>
<circle cx="${Math.round(width * 0.76)}" cy="${Math.round(height * 0.24)}" r="${Math.round(width * 0.1)}" stroke-dasharray="6 10"/>
<rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.66)}" width="${Math.round(width * 0.36)}" height="${Math.round(height * 0.26)}" rx="14"/>
</g>
<text x="${cx}" y="${cy}" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="${Math.round(width * 0.062)}" font-weight="600" fill="hsl(${h} 45% 88%)">${escapeXml(label)}</text>
<text x="${cx}" y="${cy + Math.round(width * 0.052)}" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="${Math.round(width * 0.026)}" fill="hsl(${h} 24% 70%)">${width}×${height} · generated</text>
${note ? `<text x="${cx}" y="${height - Math.round(height * 0.06)}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="${Math.round(width * 0.024)}" fill="hsl(${h} 24% 66%)">${escapeXml(note)}</text>` : ""}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === '"' ? "&quot;" : "&apos;"
  );
}

/** 竖版图（商详 / 场景墙用），比例 3:4 */
export function svgPortrait(label: string, note?: string): string {
  return svgImage({ label, width: 600, height: 800, note });
}
