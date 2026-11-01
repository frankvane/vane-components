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
  enterAt: number;
  duration: number;
  width: number;
  x: number;
  y: number;
}

const BADGE_PAD = 6;
const BADGE_GAP = 6;

/** 测量单条弹幕宽度（文字 + 粉丝牌底块） */
export function measure(
  item: DanmakuItem,
  ctx: CanvasRenderingContext2D,
  opts: RenderOptions
): { width: number; height: number } {
  const fontSize = item.meta.fontSize ?? opts.baseFontSize;
  ctx.font = `${fontSize}px ${opts.fontFamily}`;
  let width = ctx.measureText(item.text).width;
  if (item.meta.fanBadge) {
    const badgeW = ctx.measureText(` ${item.meta.fanBadge.name} Lv${item.meta.fanBadge.level} `).width;
    width += badgeW + BADGE_PAD * 2 + BADGE_GAP;
  }
  return { width, height: fontSize };
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

  tick(
    items: DanmakuItem[],
    size: { width: number; height: number },
    currentTime: number,
    playing: boolean,
    opts: RenderOptions,
    zones: Rect[]
  ): Active[] {
    // 1. 激活到达时间的弹幕
    const trackCount = Math.max(1, Math.floor(size.height / opts.trackHeight));
    for (const item of items) {
      if (this.active.has(item.id) || item._cmd) continue;
      if (item.time <= currentTime) {
        const track = this.assignTrack(item, currentTime, size, trackCount, opts, zones);
        const dur = item.duration ?? opts.defaultDuration;
        // 测量需要 ctx，这里只记宽度占位；真正宽度在调用方预测量后传入更准，
        // 但调度阶段不持 ctx，故用估算：字符数 * 字号 * 0.6 + 牌宽。
        const est = Math.max(40, item.text.length * opts.baseFontSize * 0.6);
        this.active.set(item.id, {
          item,
          track,
          mode: item.mode,
          enterAt: currentTime,
          duration: dur,
          width: est,
          x: 0,
          y: 0,
        });
      }
    }

    // 2. 推进位置，回收离场
    const result: Active[] = [];
    for (const [id, a] of this.active) {
      const pos = compute(a, currentTime, size, opts, playing);
      if (pos.done) {
        this.active.delete(id);
        continue;
      }
      a.x = pos.x;
      a.y = pos.y;
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
    const lo = isTop ? 0 : isBottom ? Math.floor(trackCount * 0.7) : 0;
    const hi = isTop ? Math.floor(trackCount * 0.3) : trackCount;

    for (let t = lo; t < hi; t++) {
      if (trackBlocked(t, opts.trackHeight, zones)) continue;
      let free = true;
      for (const a of this.active.values()) {
        if (a.track !== t) continue;
        if (isTop || isBottom || item.renderHint?.pinned) {
          // 停留型：该轨仍有未结束弹幕则占用
          if (currentTime - a.enterAt < a.duration) {
            free = false;
            break;
          }
        } else {
          // 滚动型：该轨最后一条右缘尚未移出右缘 → 无空间
          const right = a.x + a.width;
          if (right > size.width - opts.gap) {
            free = false;
            break;
          }
        }
      }
      if (free) return t;
    }
    // 无空轨则复用起始轨（允许短暂重叠，避免丢弹幕）
    return lo;
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
  ctx.font = `${fontSize}px ${opts.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  let cursorX = a.x;
  const cy = a.y;

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
      a.width + pad * 2,
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

  // 描边 + 填充文字（任意背景可读）
  const text = a.item.text;
  ctx.lineWidth = Math.max(2, fontSize / 12);
  ctx.strokeStyle = opts.stroke;
  ctx.fillStyle = a.item.meta.color ?? "#fff";
  ctx.strokeText(text, cursorX, cy);
  ctx.fillText(text, cursorX, cy);
}
