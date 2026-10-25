#!/usr/bin/env node
/**
 * 一次性迁移脚本（P1.2）：archive-plugins/vane-lazy-image 的 59 个插件
 *   → packages/vane-lazy-image/src/custom-plugins/<Name>/{create.ts,index.ts,doc.json}
 *
 * 迁移规则（对应 tasks/01 差距表）：
 *   1. import 路径改写：
 *      - "../../plugins/types"      → "../../components/LazyLoadImagePlugin/plugins/types"
 *      - "../../core/LazyLoadImageCore" → "../../components/LazyLoadImagePlugin/LazyLoadImageCore"
 *      - "../<X>Plugin/index"       → "../<X>Plugin/create"
 *   2. 类型名改写：PluginContext → LazyImageContext（含 import 与全部类型注解）
 *   3. 钩子名改写：render: → renderOverlay:（旧版 3 个渲染插件）
 *   4. 三件套落地：
 *      - create.ts(x)  = 原插件实现（改写后）
 *      - index.ts      = 工厂 + Object.assign(.meta)（文档即数据约定）
 *      - doc.json      = name/description/tags(8 大领域)/config/example
 *
 * 用法：node scripts/migrate-plugins.mjs [--force]
 * 默认跳过已存在目录；--force 覆盖（用于重跑）。
 */
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const SRC = path.join(
  root,
  "archive-plugins/vane-lazy-image/src/components/LazyLoadImagePlugin/custom-plugins"
);
const DST = path.join(root, "packages/vane-lazy-image/src/custom-plugins");
const FORCE = process.argv.includes("--force");

// ---------- 8 大领域分组（ADR-6：只分组，不淘汰；与 tasks/01 保持一致） ----------

const GROUPS = {
  visual: [
    "BlurUpPlugin", "FadeInPlugin", "TransitionPlugin", "SkeletonPlugin",
    "LQIPPlugin", "DominantColorPlugin", "ColorExtractionPlugin",
    "BorderGlowPlugin", "WatermarkPlugin", "BadgePlugin", "CaptionPlugin",
    "OverlayInfoPlugin", "ProgressOverlayPlugin", "SvgPlaceholderPlugin",
    "ComparisonPlugin", "CropPlugin", "FilterPlugin", "RedactionPlugin",
    "GalleryPlugin", "HoverZoomPlugin", "ParallaxPlugin",
    "AspectRatioSpacerPlugin",
  ],
  loading: [
    "PriorityLoadingPlugin", "PredictiveLoadingPlugin", "HoverPrefetchPlugin",
    "PreconnectPlugin", "ConcurrencyControlPlugin", "DecodeAfterIdlePlugin",
    "ScrollIdlePlugin", "ViewportDebouncePlugin", "BatteryAwarePlugin",
    "DataSaverPlugin", "MemoryPressureAbortPlugin", "OfflinePlugin",
    "ExifOrientationPlugin",
  ],
  cache: ["CacheMemoryPlugin", "CacheIDBPlugin", "CachePrewarmPlugin"],
  network: [
    "CDNFallbackPlugin", "RetryOnErrorPlugin", "FallbackImagePlugin",
    "AuthPlugin", "AntiHotlinkPlugin", "AdaptiveQualityPlugin",
    "ImageOptimizationPlugin", "WebPPlugin", "ResponsivePlugin",
    "NetworkAnalyticsPlugin",
  ],
  viewport: ["ViewportAwarePlugin", "ViewportDwellPlugin"],
  a11y: ["A11yPlugin", "AltTextPlugin", "SEOPlugin"],
  error: ["ErrorOverlayPlugin", "ErrorBadgePlugin", "ErrorTrackingPlugin"],
  monitor: ["PerformanceMonitorPlugin", "EventLoggerPlugin", "UserBehaviorPlugin"],
};

/** 目录名 → tags（含中文分组名，便于文档站按组筛选） */
const TAG_LABELS = {
  visual: "视觉",
  loading: "加载策略",
  cache: "缓存",
  network: "网络",
  viewport: "视口",
  a11y: "可访问性",
  error: "错误处理",
  monitor: "监控",
};
const TAGS = {};
for (const [group, names] of Object.entries(GROUPS)) {
  for (const n of names) TAGS[n] = [group, TAG_LABELS[group]];
}

// ---------- 一句话描述（按源码配置/钩子核对撰写） ----------

const DESCRIPTIONS = {
  // visual
  BlurUpPlugin: "模糊放大占位：加载期为图片注入 blur 滤镜，加载成功后过渡到清晰，避免「白屏 → 清晰图」的突兀切换。",
  FadeInPlugin: "加载完成后淡入显示，可自定义时长与缓动函数。",
  TransitionPlugin: "加载成功过渡动画：从指定透明度/缩放到目标值的平滑过渡。",
  SkeletonPlugin: "骨架屏占位：加载期显示 shimmer/pulse 骨架动画。",
  LQIPPlugin: "低清晰度占位图（LQIP）：加载期叠加模糊小图，支持自定义透明度与层级。",
  DominantColorPlugin: "主色占位：从 LQIP 采样平均色填充容器背景，减少白屏。",
  ColorExtractionPlugin: "主色提取：canvas 采样图片主色，可设置容器背景或显示色卡。",
  BorderGlowPlugin: "边框光晕：加载成功后为卡片应用发光阴影，悬停时增强。",
  WatermarkPlugin: "文字水印覆盖层：支持四角/中心定位、动态文本与样式定制。",
  BadgePlugin: "角标徽章：按加载状态（loading/loaded/error）在四角或中心显示文字徽章。",
  CaptionPlugin: "图片说明文字覆盖层，支持样式定制。",
  OverlayInfoPlugin: "信息覆盖层：显示自定义文本，支持常显或悬停触发。",
  ProgressOverlayPlugin: "加载进度条覆盖层：百分比文本与 indeterminate 模式。",
  SvgPlaceholderPlugin: "SVG 占位符覆盖层：支持静态或动态生成，加载成功后淡出。",
  ComparisonPlugin: "对比标识覆盖层：标注图片处于对比模式（轻量占位实现）。",
  CropPlugin: "焦点裁剪：通过 objectPosition 将裁剪焦点设在指定相对坐标。",
  FilterPlugin: "CSS 滤镜：灰度/复古/亮度/对比度/饱和度，悬停可恢复原图。",
  RedactionPlugin: "隐私打码：在指定百分比区域叠加模糊或色块遮挡。",
  GalleryPlugin: "画廊灯箱：图片上叠加打开按钮，进入灯箱或新窗口查看原图。",
  HoverZoomPlugin: "悬停放大：鼠标悬停时放大显示图片局部。",
  ParallaxPlugin: "视差滚动：随页面滚动按强度偏移图片位置。",
  AspectRatioSpacerPlugin: "宽高比占位：按 ratio 预留空间，避免加载造成的布局抖动（CLS）。",
  // loading
  PriorityLoadingPlugin: "优先级加载：按 high/medium/low 切换 eager/lazy 与 rootMargin。",
  PredictiveLoadingPlugin: "预测性预加载：按启发式或自定义模型预加载后续图片。",
  HoverPrefetchPlugin: "悬停预取：鼠标悬停/触摸时预取下一张图片，支持去重。",
  PreconnectPlugin: "DNS 预连接：提前与图片域名建立连接，可配置跨域。",
  ConcurrencyControlPlugin: "并发控制：限制同时加载数量，支持按域名分片与网络自适应。",
  DecodeAfterIdlePlugin: "空闲解码：加载成功后延迟到浏览器空闲再执行 img.decode()。",
  ScrollIdlePlugin: "滚动空闲加载：滚动停止后再发起加载，避免与滚动争抢带宽。",
  ViewportDebouncePlugin: "视口防抖：对进出视口事件去抖，防止快速滚动反复触发。",
  BatteryAwarePlugin: "低电量降级：电量低于阈值时缩小请求宽度并禁用预连接。",
  DataSaverPlugin: "省流模式：saveData 开启时降低质量参数并禁用预加载。",
  MemoryPressureAbortPlugin: "内存压力降级：设备内存不足或移动端时改请求低清图。",
  OfflinePlugin: "离线支持：网络断开时显示离线提示覆盖层。",
  ExifOrientationPlugin: "EXIF 方向校正：按拍摄方向旋转图片，避免竖拍横显。",
  // cache
  CacheMemoryPlugin: "内存 LRU 缓存：会话内缓存图片数据，可配置容量与过期时间。",
  CacheIDBPlugin: "IndexedDB 持久缓存：跨会话缓存图片 Blob/dataURL，支持 TTL。",
  CachePrewarmPlugin: "缓存预热：进入视口或挂载时把图片预热到内存/IDB 缓存。",
  // network
  CDNFallbackPlugin: "CDN 回退：主域名加载失败时按序切换备用 CDN 域名。",
  RetryOnErrorPlugin: "失败重试：指数退避 + 可选抖动的自动重试。",
  FallbackImagePlugin: "回退图片：加载失败时切换到备用图片地址。",
  AuthPlugin: "鉴权支持：为图片 URL 追加 token 参数并配置跨域/Referrer 策略。",
  AntiHotlinkPlugin: "防盗链：为 URL 追加签名 token，并限制允许的域名。",
  AdaptiveQualityPlugin: "网络自适应画质：按 effectiveType/saveData 调整质量参数，支持实时监听。",
  ImageOptimizationPlugin: "图片优化：自动追加宽度/质量/格式查询参数。",
  WebPPlugin: "WebP 优先：支持 WebP 的环境优先加载 .webp，失败自动回退原图。",
  ResponsivePlugin: "响应式图片：注入 srcset/sizes 多宽度资源，可按宽度生成链接。",
  NetworkAnalyticsPlugin: "网络分析：上报加载耗时、成功率与 CDN 分布。",
  // viewport
  ViewportAwarePlugin: "视口状态可视化：显示进入/离开指示点并给 DOM 打标记。",
  ViewportDwellPlugin: "停留门槛：在视口内停留不足 dwellMs 则跳过加载，避免快速滚动浪费。",
  // a11y
  A11yPlugin: "无障碍支持：装饰性图片、自定义 aria-label、加载状态文本覆盖层。",
  AltTextPlugin: "alt 自动生成：从 src 推导或按前缀生成 alt 文本。",
  SEOPlugin: "SEO 增强：alt/title 回退、固定 aspectRatio 减少 CLS、preload 与 LCP 优先。",
  // error
  ErrorOverlayPlugin: "错误覆盖层：加载失败时显示遮层与重试按钮。",
  ErrorBadgePlugin: "错误徽标：加载失败时在角落显示错误徽标。",
  ErrorTrackingPlugin: "错误追踪：上报加载失败详情（端点或自定义函数），可显示徽标。",
  // monitor
  PerformanceMonitorPlugin: "性能监控：统计加载耗时并可选覆盖层实时展示。",
  EventLoggerPlugin: "事件日志：记录加载全生命周期事件（可加前缀过滤）。",
  UserBehaviorPlugin: "用户行为采集：统计停留时长、点击与进出视口次数。",
};

// ---------- 源码改写 ----------

/**
 * 存量代码的 lint 修复（迁移时一并处理，避免把 error 带进新仓库）。
 * 均为目标明确的小替换，重跑迁移不会丢修复。
 */
const LEGACY_FIXES = [
  // AuthPlugin：let 但从未重新赋值 → const
  [/let p = \{ \.\.\.props \};/g, "const p = { ...props };"],
  // DecodeAfterIdlePlugin：ban-types 不接受 Function
  [/\(cb: Function, opts\?: any\)/g, "(cb: () => void, opts?: { timeout?: number })"],
  // GalleryPlugin：移除对未安装规则的 eslint-disable，img 补 alt（取 context.props.alt）
  [
    /\{\/\* eslint-disable-next-line jsx-a11y\/alt-text \*\/\}\n(\s*)<img src=\{context\.src \?\? ""\} style=\{\{ maxWidth: "90%", maxHeight: "90%" \}\} \/>/g,
    '<img\n$1  src={context.src ?? ""}\n$1  alt={context.props.alt ?? ""}\n$1  style={{ maxWidth: "90%", maxHeight: "90%" }}\n$1/>',
  ],
  // PerformanceMonitorPlugin：no-unused-expressions
  [
    /(\s*)config\.onReport && config\.onReport\(payload\);/g,
    "$1if (config.onReport) config.onReport(payload);",
  ],
  // ProgressOverlayPlugin：no-unused-expressions
  [/offProgress && offProgress\(\);/g, "offProgress?.();"],
];

function transformSource(code) {
  let out = code
    // 行尾规范：archive 旧仓库为 CRLF，统一为 LF（本仓库标准）
    .replace(/\r\n/g, "\n")
    // import 路径
    .replace(
      /from "\.\.\/\.\.\/plugins\/types"/g,
      'from "../../components/LazyLoadImagePlugin/plugins/types"'
    )
    .replace(
      /from "\.\.\/\.\.\/core\/LazyLoadImageCore"/g,
      'from "../../components/LazyLoadImagePlugin/LazyLoadImageCore"'
    )
    .replace(
      /from "\.\.\/([A-Za-z0-9_]+Plugin)\/index"/g,
      'from "../$1/create"'
    )
    // 类型名：PluginContext → LazyImageContext（词边界，避免误伤）
    .replace(/\bPluginContext\b/g, "LazyImageContext")
    // 钩子名：render: → renderOverlay:（仅钩子键位，词边界不会误伤 prerender）
    .replace(/\brender: \(/g, "renderOverlay: (");
  for (const [pattern, replacement] of LEGACY_FIXES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// ---------- doc.json 的 config 抽取 ----------

/** 抽取 config 接口/类型体（花括号配对） */
function extractConfigBlock(code) {
  const m = code.match(
    /export\s+(?:interface|type)\s+(\w*Config)\b[^{]*\{/
  );
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0;
  for (let i = start; i < code.length; i++) {
    if (code[i] === "{") depth++;
    else if (code[i] === "}") {
      depth--;
      if (depth === 0) return code.slice(start + 1, i);
    }
  }
  return null;
}

/** 规范化默认值/类型字符串：压平空白、去尾部多余逗号/括号、截断（避免撑破 markdown 表格） */
function normalizeSnippet(text, max = 48) {
  let flat = text.replace(/\s+/g, " ").trim();
  // 去掉因表达式截取产生的尾部孤立逗号
  flat = flat.replace(/,$/, "").trim();
  // 右括号多于左括号时，去掉尾部多出的右括号（如 Math.max(0, x ?? 12) → 12)）
  while (/\)$/.test(flat) && (flat.match(/\)/g) || []).length > (flat.match(/\(/g) || []).length) {
    flat = flat.slice(0, -1).trim();
  }
  return flat.length > max ? `${flat.slice(0, max - 3)}...` : flat;
}

/** 从 factory 的 `const { ... } = config` 中抽取默认值（花括号配对 + 顶层逗号分割） */
function extractDefaults(code) {
  const defaults = {};
  const start = code.search(/const\s*\{/);
  if (start >= 0) {
    const open = code.indexOf("{", start);
    let depth = 0;
    let end = -1;
    for (let i = open; i < code.length; i++) {
      if (code[i] === "{") depth++;
      else if (code[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    // 确认是 `= config` 的解构（而非其他 const { ... }）
    if (end > 0 && /^\s*=\s*config\b/.test(code.slice(end + 1, end + 12))) {
      for (const part of splitTopLevel(code.slice(open + 1, end))) {
        const km = part.match(/^\s*(\w+)\s*=\s*([\s\S]+?)\s*$/);
        if (km) defaults[km[1]] = normalizeSnippet(km[2]);
      }
    }
  }
  // 风格 2：config?.key ?? default（捕获到分号，兼容含逗号的字符串/数组/三元）
  for (const m of code.matchAll(/config\?\.(\w+)\s*\?\?\s*([\s\S]*?);/g)) {
    if (!(m[1] in defaults)) defaults[m[1]] = normalizeSnippet(m[2]);
  }
  return defaults;
}

/** 按顶层逗号分割（忽略 {}, [], () 内的逗号，以及字符串字面量内的逗号） */
function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let buf = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      buf += ch;
      if (ch === "\\") {
        buf += text[i + 1] ?? "";
        i++;
      } else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      buf += ch;
      continue;
    }
    if ("{[(".includes(ch)) depth++;
    else if ("}])".includes(ch)) depth--;
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else buf += ch;
  }
  if (buf.trim()) parts.push(buf);
  return parts;
}

/** 解析 config 字段（支持行尾注释、单行 JSDoc、多行类型、嵌套对象类型） */
function parseConfigFields(body, code) {
  const defaults = extractDefaults(code);
  const fields = [];
  let pendingDoc = "";
  let buf = "";
  let depth = 0;
  const flush = () => {
    const stmt = buf.trim();
    buf = "";
    if (!stmt) return;
    const fm = stmt.match(/^(\w+)(\?)?:\s*([\s\S]*?);\s*(?:\/\/\s*(.*))?$/);
    if (!fm) {
      pendingDoc = "";
      return;
    }
    let type = normalizeSnippet(fm[3], 72);
    fields.push({
      name: fm[1],
      type,
      ...(defaults[fm[1]] !== undefined ? { default: defaults[fm[1]] } : {}),
      description: fm[4]?.trim() || pendingDoc || "",
    });
    pendingDoc = "";
  };
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (depth === 0 && !buf) {
      if (/^\/\*\*/.test(line)) {
        pendingDoc = line
          .replace(/^\/\*\*\s*/, "")
          .replace(/\s*\*\/$/, "")
          .trim();
        continue;
      }
      if (/^(\/\/|\*)/.test(line)) continue; // 注释行 / JSDoc 续行
    }
    buf = buf ? `${buf} ${line}` : line;
    for (const ch of line) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
    if (depth <= 0 && buf.includes(";")) {
      depth = 0;
      flush();
    }
  }
  return fields;
}

// ---------- index.ts 生成 ----------

function parseExports(code) {
  const factory =
    code.match(/export\s+function\s+(create\w+Plugin)\s*\(/) ||
    code.match(/export\s+const\s+(create\w+Plugin)\s*=/);
  // config 类型：优先取文件内 export 的 XxxConfig；其次从工厂签名解析
  let configType = (code.match(/export\s+(?:interface|type)\s+(\w*Config)\b/) || [])[1];
  if (!configType && factory) {
    const sig = code.match(
      new RegExp(`${factory[1]}\\s*\\(\\s*config\\??\\s*:\\s*(\\w+)`)
    );
    configType = sig?.[1];
  }
  // 校验类型确实被 export（否则视为无配置类型）
  if (configType && !new RegExp(`export\\s+(?:interface|type)\\s+${configType}\\b`).test(code)) {
    configType = undefined;
  }
  const extras = [];
  for (const m of code.matchAll(/export\s+(?:const|function|class|let)\s+(\w+)/g)) {
    if (m[1] !== factory?.[1]) extras.push(m[1]);
  }
  // config 是否必填：工厂签名里 config 参数无 ? 且无默认值
  const requiredConfig = factory
    ? new RegExp(`${factory[1]}\\s*\\(\\s*config\\s*:`).test(code)
    : false;
  return {
    factory: factory?.[1],
    configType,
    extras: [...new Set(extras)],
    requiredConfig,
  };
}

function renderIndex(dirName, description, { factory, configType, extras, requiredConfig }) {
  const extraLines = extras
    .map((n) => `export { ${n} } from "./create";`)
    .join("\n");
  const cfgImport = configType
    ? `import type { ${configType} } from "./create";\n`
    : "";
  const creator = configType
    ? `LazyImagePluginCreator<${configType}>`
    : "LazyImagePluginCreator";
  const typeExport = configType ? `\nexport type { ${configType} };\n` : "\n";
  // 工厂的 config 为必填参数时，Object.assign 结果与 PluginCreator 的
  // (config?: Config) 签名不兼容（参数逆变），用断言收敛——必填 config 是
  // 插件的刻意 API（如 fallbackSrc 必须由调用方提供）。
  const assertion = requiredConfig && configType ? " as " + creator : "";
  return `/**
 * ${dirName} — ${description}
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { ${factory} as create } from "./create";
${cfgImport}import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const ${factory}: ${creator} = Object.assign(create, {
  meta: doc,
})${assertion};
${typeExport}${extraLines ? `${extraLines}\n` : ""}`;
}

// ---------- 主流程 ----------

async function main() {
  const entries = (await readdir(SRC, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const report = { migrated: [], skipped: [], missing: [] };
  for (const name of entries) {
    const srcDir = path.join(SRC, name);
    const files = (await readdir(srcDir)).filter((f) => /^index\.tsx?$/.test(f));
    if (files.length === 0) {
      report.missing.push(name);
      continue;
    }
    const dstDir = path.join(DST, name);
    if (existsSync(path.join(dstDir, "doc.json")) && !FORCE) {
      report.skipped.push(name);
      continue;
    }
    await mkdir(dstDir, { recursive: true });

    // 1. create.ts(x)
    const raw = await readFile(path.join(srcDir, files[0]), "utf-8");
    const code = transformSource(raw);
    const ext = files[0].endsWith(".tsx") ? "tsx" : "ts";
    await writeFile(path.join(dstDir, `create.${ext}`), code, "utf-8");

    // 2. doc.json（从改写后的 code 提取，保证类型名与迁移后源码一致）
    const description = DESCRIPTIONS[name];
    if (!description) throw new Error(`缺少 ${name} 的描述映射`);
    const exports = parseExports(raw);
    if (!exports.factory) throw new Error(`${name}: 未找到 createXxxPlugin 工厂`);
    const block = extractConfigBlock(code);
    const config = block ? parseConfigFields(block, code) : [];
    const doc = {
      name,
      description,
      since: "2.0.0",
      tags: TAGS[name] ?? ["uncategorized"],
      config,
      example: `withPlugins(LazyLoadImageCore, [${exports.factory}()]);`,
    };
    await writeFile(
      path.join(dstDir, "doc.json"),
      `${JSON.stringify(doc, null, 2)}\n`,
      "utf-8"
    );

    // 3. index.ts（挂 .meta）
    await writeFile(
      path.join(dstDir, "index.ts"),
      renderIndex(name, description, exports),
      "utf-8"
    );
    report.migrated.push(name);
  }

  console.log(`\n迁移完成：${report.migrated.length} 个插件`);
  if (report.skipped.length)
    console.log(`跳过（已存在，--force 可覆盖）：${report.skipped.join(", ")}`);
  if (report.missing.length)
    console.log(`未找到 index.ts/tsx：${report.missing.join(", ")}`);

  // 分组自检：目录数 == 分组表数量
  const grouped = Object.values(GROUPS).flat();
  const ungrouped = entries.filter((e) => !grouped.includes(e));
  if (ungrouped.length)
    console.warn(`\n⚠️ 未分组插件：${ungrouped.join(", ")}`);
  console.log(`分组覆盖：${grouped.length}/${entries.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
