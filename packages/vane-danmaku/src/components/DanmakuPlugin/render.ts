import type { DanmakuItem, DanmakuMode, Rect } from "./plugins/types";

/** 调度参数 */
export interface RenderOptions {
  trackHeight: number;
  fontFamily: string;
  baseFontSize: number;
  opacity: number;
  /** 默认飞行时长（秒），item.duration 缺省时使用 */
  defaultDuration: number;
  /** 同轨最小间隔（px），碰撞检测余量 */
  gap: number;
  /** 渐显/渐隐时长（秒），缓解「弹幕突然出现/突然消失」 */
  fadeMs: number;
  /** 高赞/置顶高亮色 */
  accent: string;
  /** 描边色（提升任意背景可读性） */
  stroke: string;
}

/** 飞行中的弹幕实例 */
export interface Active {
  item: DanmakuItem;
  track: number;
  mode: DanmakuMode;
  /** 移动方向：scroll=-1（向右->左）、reverse=+1（向左->右）、停留型=0 */
  dir: number;
  enterAt: number;
  duration: number;
  width: number;
  x: number;
  y: number;
  /** 当前透明度（渐显/渐隐），绘制时与 opts.opacity 相乘 */
  alpha: number;
}

const BADGE_PAD = 6;
const BADGE_GAP = 6;

/** 测量单条弹幕宽度（文字 + 粉丝牌底块；rich 分段时取各段之和） */
export function measure(
  item: DanmakuItem,
  ctx: CanvasRenderingContext2D,
  opts: RenderOptions
): { width: number; height: number } {
  const fontSize = item.meta.fontSize ?? opts.baseFontSize;
  ctx.font = fontString(fontSize, item, opts);
  let width: number;
  const rich = item.renderHint?.rich;
  if (rich && rich.length > 0) {
    width = rich.reduce((acc, seg) => acc + ctx.measureText(seg.text).width, 0);
  } else {
    width = ctx.measureText(item.text).width;
  }
  if (item.meta.fanBadge) {
    const badgeW = ctx.measureText(` ${item.meta.fanBadge.name} Lv${item.meta.fanBadge.level} `).width;
    width += badgeW + BADGE_PAD * 2 + BADGE_GAP;
  }
  if (item.meta.combo && item.meta.combo > 1) {
    width += ctx.measureText(` x${item.meta.combo}`).width;
  }
  return { width, height: fontSize };
}

/** 估算弹幕宽度（调度阶段无 ctx，用字符类近似；CJK≈1em、西文≈0.55em，含牌/角标） */
function estimateWidth(item: DanmakuItem, base: number): number {
  let w = 0;
  for (const ch of item.text) {
    w += /[㐀-鿿぀-ヿ가-킯＀-￯]/.test(ch) ? base : base * 0.55; // CJK / 假名 / 谚文 / 全角 ≈ 1em
  }
  if (item.meta.fanBadge) w += base * 4 + 18;
  if (item.meta.combo && item.meta.combo > 1) w += base * 2;
  if (item.meta.emoji?.length) w += item.meta.emoji.length * base;
  return Math.max(40, w);
}

/** 组装 ctx.font（尊重 meta.fontFamily / fontWeight） */
function fontString(fontSize: number, item: DanmakuItem, opts: RenderOptions): string {
  const family = item.meta.fontFamily ?? opts.fontFamily;
  const weight = item.meta.fontWeight ?? 400;
  return `${weight} ${fontSize}px ${family}`;
}

/** 轨道是否落在某条避让区（y 区间相交） */
function trackBlocked(track: number, trackHeight: number, zones: Rect[]): boolean {
  const top = track * trackHeight;
  const bottom = top + trackHeight;
  for (const z of zones) {
    if (top < z.y + z.h && bottom > z.y) return true;
  }
  return false;
}

/**
 * 轨道调度器：持有飞行中的弹幕状态，每帧（tick）激活新弹幕、推进位置、回收离场弹幕。
 * 碰撞规则（经典弹幕）：scroll 轨道空闲当且仅当该轨最后一条弹幕右缘已移出画布右缘，
 * 新弹幕从右缘进入不会追尾。top/bottom/pinned 轨道按停留时长占用。
 */
export class DanmakuScheduler {
  private active = new Map<string, Active>();
  /** 上一帧 currentTime，用于检测时钟回绕（如 LiveDanmaku 的 currentTime % loop） */
  private lastTime = 0;

  tick(
    items: DanmakuItem[],
    size: { width: number; height: number },
    currentTime: number,
    playing: boolean,
    opts: RenderOptions,
    zones: Rect[]
  ): Active[] {
    // 时钟回绕（取模循环导致 currentTime 从 ~loop 跳回 ~0）：清空上一轮仍在飞行的弹幕，
    // 否则负 elapsed 会让它们错乱瞬移 / 卡在轨道里占坑。干净重置后由 time 重新激活。
    if (currentTime < this.lastTime - 0.5) this.active.clear();
    this.lastTime = currentTime;

    // 1. 激活到达时间的弹幕
    const trackCount = Math.max(1, Math.floor(size.height / opts.trackHeight));
    for (const item of items) {
      if (this.active.has(item.id) || item._cmd) continue;
      if (item.time <= currentTime) {
        const track = this.assignTrack(item, currentTime, size, trackCount, opts, zones);
        const dur = item.duration ?? opts.defaultDuration;
        const stay = item.mode === "top" || item.mode === "bottom" || item.renderHint?.pinned === true;
        const dir = stay ? 0 : item.mode === "reverse" ? 1 : -1;
        // 调度阶段不持 ctx，用字符类近似宽度（CJK/假名/谚文/全角≈1em、西文≈0.55em，含牌/角标）
        const est = estimateWidth(item, opts.baseFontSize);
        this.active.set(item.id, {
          item,
          track,
          mode: item.mode,
          dir,
          enterAt: currentTime,
          duration: dur,
          width: est,
          x: 0,
          y: 0,
          alpha: 1,
        });
      }
    }

    // 2. 推进位置，回收离场，算渐显/渐隐透明度
    const result: Active[] = [];
    for (const [id, a] of this.active) {
      const pos = compute(a, currentTime, size, opts, playing);
      if (pos.done) {
        this.active.delete(id);
        continue;
      }
      a.x = pos.x;
      a.y = pos.y;
      let alpha = 1;
      if (playing) {
        const elapsed = currentTime - a.enterAt;
        const fade = opts.fadeMs;
        if (elapsed < fade) alpha = Math.max(0, elapsed / fade);
        const remain = a.duration - elapsed;
        if (remain < fade) alpha = Math.min(alpha, Math.max(0, remain / fade));
      }
      a.alpha = alpha;
      result.push(a);
    }
    return result;
  }

  private assignTrack(
    item: DanmakuItem,
    currentTime: number,
    size: { width: number; height: number },
    trackCount: number,
    opts: RenderOptions,
    zones: Rect[]
  ): number {
    const isTop = item.mode === "top" || item.renderHint?.pinned === true;
    const isBottom = item.mode === "bottom";
    // 顶部固定带 / 底部固定带：滚动弹幕不入侵，避免与 fixed 弹幕叠字（截图里顶部叠字的根因）
    const topBand = Math.max(1, Math.floor(trackCount * 0.25));
    const bottomBandStart = Math.floor(trackCount * 0.75);

    // 按模式选首选轨道区间：top/pinned→顶部带，bottom→底部带，scroll/reverse→中间带
    let lo: number, hi: number;
    if (isTop) {
      lo = 0;
      hi = topBand;
    } else if (isBottom) {
      lo = bottomBandStart;
      hi = trackCount;
    } else {
      lo = topBand;
      hi = bottomBandStart;
    }

    // 显式轨道（TrackStrategyPlugin / 置顶带）：该轨空闲且不落避让区则直接采用
    const forced = item.renderHint?.track;
    if (forced != null && forced >= 0 && forced < trackCount) {
      if (
        !trackBlocked(forced, opts.trackHeight, zones) &&
        this.trackFree(forced, item, currentTime, size, opts)
      ) {
        return forced;
      }
    }

    // 第一遍：首选区间内找空轨
    let t = this.findFree(lo, hi, item, currentTime, size, opts, zones);
    if (t >= 0) return t;
    // 第二遍：整段兜底（仅当首选区饱和，允许与固定带短暂共用，避免丢弹幕）
    t = this.findFree(0, trackCount, item, currentTime, size, opts, zones);
    if (t >= 0) return t;
    return lo;
  }

  /**
   * 该轨道是否可容纳一条新弹幕。
   * 关键：滚动型按移动方向分轨 —— 正向(scroll, dir=-1)与反向(reverse, dir=+1)在
   * 同一条轨道必会迎面交叠，因此异向直接判冲突；同向才看入口/出口余量；
   * 停留型(top/bottom/pinned)在其停留期内独占整条轨道。
   */
  private trackFree(
    track: number,
    item: DanmakuItem,
    currentTime: number,
    size: { width: number; height: number },
    opts: RenderOptions
  ): boolean {
    const stay = item.mode === "top" || item.mode === "bottom" || item.renderHint?.pinned;
    const dir = stay ? 0 : item.mode === "reverse" ? 1 : -1;
    for (const a of this.active.values()) {
      if (a.track !== track) continue;
      if (a.dir === 0) {
        // 轨上已有停留型弹幕：其停留期内占轨
        if (currentTime - a.enterAt < a.duration) return false;
        continue;
      }
      if (dir === 0) {
        // 新来的是停留型：只要轨上移动弹幕尚未完全离场就先占着（移动弹幕很快走完）
        if (currentTime - a.enterAt < a.duration) return false;
        continue;
      }
      if (a.dir !== dir) return false; // 异向必交叠
      // 同向滚动：需等前一条让出「入口/出口」余量
      if (dir === -1) {
        if (a.x + a.width > size.width - opts.gap) return false;
      } else {
        if (a.x < opts.gap) return false;
      }
    }
    return true;
  }

  /** 在 [lo,hi) 内跳过避让区找空轨；无空轨返回 -1 */
  private findFree(
    lo: number,
    hi: number,
    item: DanmakuItem,
    currentTime: number,
    size: { width: number; height: number },
    opts: RenderOptions,
    zones: Rect[]
  ): number {
    for (let t = lo; t < hi; t++) {
      if (trackBlocked(t, opts.trackHeight, zones)) continue;
      if (this.trackFree(t, item, currentTime, size, opts)) return t;
    }
    return -1;
  }

  /** 清空（切换视频 / 清屏指令时调用） */
  clear(): void {
    this.active.clear();
  }
}

/** 计算单条弹幕当前位置；done 表示已离场 */
function compute(
  a: Active,
  currentTime: number,
  size: { width: number; height: number },
  opts: RenderOptions,
  playing: boolean
): { x: number; y: number; done: boolean } {
  const trackHeight = opts.trackHeight;
  const y = a.track * trackHeight + trackHeight * 0.5;
  const elapsed = playing ? currentTime - a.enterAt : 0;

  if (a.mode === "scroll") {
    const total = size.width + a.width;
    const speed = total / a.duration;
    const x = size.width - speed * elapsed;
    return { x, y, done: x + a.width < 0 };
  }
  if (a.mode === "reverse") {
    const total = size.width + a.width;
    const speed = total / a.duration;
    const x = -a.width + speed * elapsed;
    return { x, y, done: x > size.width };
  }
  // top / bottom / pinned：居中停留
  const x = (size.width - a.width) / 2;
  return { x, y, done: elapsed > a.duration };
}

/** 绘制单条弹幕（粉丝牌 + 描边文字 + 可选高赞环） */
export function draw(
  a: Active,
  ctx: CanvasRenderingContext2D,
  opts: RenderOptions
): void {
  const fontSize = a.item.meta.fontSize ?? opts.baseFontSize;
  ctx.font = fontString(fontSize, a.item, opts);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  // 渐显/渐隐：整体透明度 = 生命周期 alpha × 全局 opacity
  ctx.save();
  ctx.globalAlpha = a.alpha * opts.opacity;

  let cursorX = a.x;
  const cy = a.y;
  const totalW = measure(a.item, ctx, opts).width;

  // 高亮底块（半透明圆角，不压字）
  if (a.item.renderHint?.highlight) {
    ctx.save();
    ctx.globalAlpha *= 0.22;
    ctx.fillStyle = a.item.renderHint.highlight;
    ctx.beginPath();
    ctx.roundRect(a.x - 6, cy - fontSize / 2 - 5, totalW + 12, fontSize + 10, 8);
    ctx.fill();
    ctx.restore();
  }

  // 高赞环
  if (a.item.renderHint?.ring) {
    const pad = 6;
    ctx.save();
    ctx.strokeStyle = opts.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(
      a.x - pad,
      cy - fontSize / 2 - pad,
      totalW + pad * 2,
      fontSize + pad * 2,
      8
    );
    ctx.stroke();
    ctx.restore();
  }

  // 粉丝牌底块
  if (a.item.meta.fanBadge) {
    const badge = a.item.meta.fanBadge;
    const label = `${badge.name} Lv${badge.level}`;
    const bw = ctx.measureText(label).width + BADGE_PAD * 2;
    ctx.save();
    ctx.fillStyle = badge.color;
    ctx.beginPath();
    ctx.roundRect(cursorX, cy - fontSize / 2, bw, fontSize, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(label, cursorX + BADGE_PAD, cy);
    ctx.restore();
    cursorX += bw + BADGE_GAP;
  }

  // 描边 + 填充文字（任意背景可读）；rich 分段着色，否则整条单色
  ctx.lineWidth = Math.max(2, fontSize / 12);
  ctx.strokeStyle = opts.stroke;
  const rich = a.item.renderHint?.rich;
  if (rich && rich.length > 0) {
    for (const seg of rich) {
      ctx.fillStyle = seg.color ?? a.item.meta.color ?? "#fff";
      ctx.strokeText(seg.text, cursorX, cy);
      ctx.fillText(seg.text, cursorX, cy);
      cursorX += ctx.measureText(seg.text).width;
    }
  } else {
    ctx.fillStyle = a.item.meta.color ?? "#fff";
    ctx.strokeText(a.item.text, cursorX, cy);
    ctx.fillText(a.item.text, cursorX, cy);
    cursorX += ctx.measureText(a.item.text).width;
  }

  // 礼物连击角标
  if (a.item.meta.combo && a.item.meta.combo > 1) {
    const tag = ` x${a.item.meta.combo}`;
    ctx.save();
    ctx.font = `${fontString(fontSize, a.item, opts)}`;
    ctx.fillStyle = opts.accent;
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = Math.max(2, fontSize / 12);
    ctx.strokeText(tag, cursorX, cy);
    ctx.fillText(tag, cursorX, cy);
    ctx.restore();
  }

  ctx.restore();
}
