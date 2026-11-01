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
  /** 顶部安全区（px）：控件浮层（统计条/过滤开关）占用，弹幕不渲染到这里 */
  topInset: number;
  /** 底部安全区（px）：指令输入框等控件占用，弹幕不渲染到这里 */
  bottomInset: number;
  /** 高赞/置顶高亮色 */
  accent: string;
  /** 描边色（提升任意背景可读性） */
  stroke: string;
  /**
   * 精确测宽（由内核注入，内部用真实 ctx 量）。
   *
   * 调度必须用**实测宽度**，不能用字符类近似：屏幕速度 = (画布宽 + 弹幕宽) / 时长，
   * 宽度估小了就等于「以为它慢、实际它很快」，同轨后车就会追尾前车压出叠字。
   * 近似值只作为脱离内核单独使用调度器时的兜底。
   */
  measureWidth?: (item: DanmakuItem) => number;
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
  /** 宽度是否已用真实 ctx 量过（估宽只用于调度阶段，绘制首帧后升级为实测值） */
  measured?: boolean;
  x: number;
  y: number;
  /** 当前透明度（渐显/渐隐），绘制时与 opts.opacity 相乘 */
  alpha: number;
}

/** 一条待入场的候选（把宽/时长/方向算一次，供选轨复用） */
interface Candidate {
  item: DanmakuItem;
  /** 入场宽度（调度阶段是近似值，首帧绘制后由 Active.width 升级为实测） */
  width: number;
  /** 飞行时长（秒） */
  duration: number;
  /** -1 向左 / +1 向右 / 0 停留 */
  dir: number;
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
 * 轨道被避让区的「遮挡权重」= 与其 y 区间相交的避让区宽度之和。
 *
 * 为什么要权重而不是布尔：避让区（人物）常常纵向占满整个画布，若把它当硬约束，
 * 所有轨道都不可用 → 调度器只能把弹幕硬塞进 lo 轨（这就是「弹幕叠成一墙、还压在
 * 人身上」的根因）。改成「优先干净轨 → 其次遮挡最少的轨」，配合绘制期的 evenodd
 * 裁剪，人物区域永远没有弹幕，弹幕看起来是从人身后穿过去。
 */
function trackBlockWeight(track: number, trackHeight: number, zones: Rect[]): number {
  const top = track * trackHeight;
  const bottom = top + trackHeight;
  let w = 0;
  for (const z of zones) {
    if (top < z.y + z.h && bottom > z.y) w += z.w;
  }
  return w;
}

/**
 * 轨道调度器：持有飞行中的弹幕状态，每帧（tick）激活新弹幕、推进位置、回收离场弹幕。
 * 碰撞规则（经典弹幕）：scroll 轨道空闲当且仅当该轨最后一条弹幕右缘已移出画布右缘，
 * 新弹幕从右缘进入不会追尾。top/bottom/pinned 轨道按停留时长占用。
 */
export class DanmakuScheduler {
  private active = new Map<string, Active>();
  /**
   * 本轮（一个时钟周期内）已经激活过的条目 id。
   *
   * 没有它就会「复活」：激活条件是 `item.time <= currentTime`，某条弹幕飞完被
   * active 回收后，下一帧仍然满足该条件 → 再飞一次，如此循环。结果是在飞条数
   * 随 currentTime 一路膨胀（1000 条压 40s，到 20s 时屏幕上叠着 500+ 条），
   * 既糊成一片、也把帧率拖垮。时钟回绕时随 active 一起清空。
   */
  private fired = new Set<string>();
  /**
   * 画布已饱和（找不到任何可容纳的空轨）时，等待入场的条目：id → 开始等待的 currentTime。
   * 短时突发靠它吸收（下一帧有空轨就补进去）；等待超过 WAIT_MAX 直接丢弃 ——
   * 宁可少显示几条，也绝不把弹幕叠成一堵墙（叠字既看不清，也是最贵的光栅化开销）。
   */
  private waiting = new Map<string, number>();
  /** 本周期因饱和被丢弃的条数（性能读数 / 诊断用） */
  private dropped = 0;
  /** 上一帧 currentTime，用于检测时钟回绕（如 LiveDanmaku 的 currentTime % loop） */
  private lastTime = 0;

  /** 等待入场的最长秒数：吸收 1 秒级突发，长期饱和即丢弃 */
  static readonly WAIT_MAX = 1.2;

  /** 当前在飞条数（真正参与绘制的量） */
  get activeCount(): number {
    return this.active.size;
  }

  /** 本周期累计丢弃条数（饱和溢出） */
  get droppedCount(): number {
    return this.dropped;
  }

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
    if (currentTime < this.lastTime - 0.5) {
      this.active.clear();
      this.fired.clear();
      this.waiting.clear();
      this.dropped = 0;
    }
    this.lastTime = currentTime;

    // 1. 激活到达时间的弹幕（每条每周期只激活一次，见 fired 注释）
    // 有效高度 = 总高 − 顶部/底部安全区（控件浮层占用），弹幕只在安全区之间的带状区流动
    const effH = Math.max(opts.trackHeight, size.height - opts.topInset - opts.bottomInset);
    const trackCount = Math.max(1, Math.floor(effH / opts.trackHeight));
    /**
     * 每帧最多尝试补位多少条。
     *
     * 饱和时（比如 3000 条压进 40 秒），排队等空轨的条目可能有几百个，而每个新条目
     * 都要跑一遍「逐轨 × 逐在飞」的碰撞判定 —— 不设上限就是每帧几万次判定，直接把帧率打死。
     * 补位本来就是「有空轨才发生」，一帧试几十条足够，剩下的下一帧继续。
     */
    let attempts = 0;
    const MAX_ATTEMPTS_PER_FRAME = 48;
    for (const item of items) {
      if (this.fired.has(item.id) || item._cmd) continue;
      if (item.time > currentTime) continue;
      // 等太久 = 画面已饱和：直接丢弃并计数（迟到太久再入场会串到下一轮，也必然叠字）
      const since = this.waiting.get(item.id);
      if (since != null && currentTime - since > DanmakuScheduler.WAIT_MAX) {
        this.fired.add(item.id);
        this.waiting.delete(item.id);
        this.dropped++;
        continue;
      }
      if (attempts >= MAX_ATTEMPTS_PER_FRAME) continue;
      attempts++;
      const stay =
        item.mode === "top" || item.mode === "bottom" || item.renderHint?.pinned === true;
      // 有实测接口就用实测宽度（调度与绘制的宽必须一致，否则速度/碰撞全都会漂）
      const exact = opts.measureWidth ? Math.max(1, opts.measureWidth(item)) : 0;
      const cand: Candidate = {
        item,
        width: exact || estimateWidth(item, opts.baseFontSize),
        duration: item.duration ?? opts.defaultDuration,
        dir: stay ? 0 : item.mode === "reverse" ? 1 : -1,
      };
      const track = this.assignTrack(cand, currentTime, size, trackCount, opts, zones);
      if (track == null) {
        // 无空轨：排队等下一帧（下一帧依然会走到这里，因为没进 fired）
        if (since == null) this.waiting.set(item.id, currentTime);
        continue;
      }
      this.waiting.delete(item.id);
      this.fired.add(item.id);
      // 初始 x 必须是「入场位」，不能留 0：trackFree 用 a.x + a.width 判断前一条是否已让出入口，
      // 若新入场者 x=0，同一帧内后来的弹幕会误判该轨空闲 → 两条叠在一起（多条目同时到达时的叠字根因）。
      const initX =
        cand.dir === -1 ? size.width : cand.dir === 1 ? -cand.width : (size.width - cand.width) / 2;
      this.active.set(item.id, {
        item,
        track,
        mode: item.mode,
        dir: cand.dir,
        enterAt: currentTime,
        duration: cand.duration,
        width: cand.width,
        measured: exact > 0,
        x: initX,
        y: 0,
        alpha: 1,
      });
    }

    // 注：这里不再做「把被人物压住的弹幕挪到空轨」的挤压。
    // 挪轨会把飞行中的弹幕瞬移到别的 y（观感像跳帧），而且它插入新轨时并不是从边缘入场，
    // 用「入场位」假设做的碰撞判定会失效，反而制造同轨叠字。
    // 人物走到弹幕下面时，交给绘制期的 evenodd 裁剪 —— 被压住的那段直接不画，
    // 视觉上就是「从人身后穿过去」，既没有跳动，也不会压字。

    // 3. 推进位置，回收离场，算渐显/渐隐透明度
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
        // fadeMs 是毫秒、elapsed/remain 是秒 —— 必须换算，否则 alpha≈elapsed/450≈0.02 让弹幕近乎全透明
        const fade = Math.max(0.001, opts.fadeMs / 1000);
        if (elapsed < fade) alpha = Math.max(0, elapsed / fade);
        const remain = a.duration - elapsed;
        if (remain < fade) alpha = Math.min(alpha, Math.max(0, remain / fade));
        alpha = Math.min(1, Math.max(0, alpha));
      }
      a.alpha = alpha;
      result.push(a);
    }
    return result;
  }

  /**
   * 选轨（返回 null = 画布真的饱和，调用方应排队而不是硬塞）。
   *
   * 三级策略，每级都要求轨道本身空闲（trackFree），所以屏幕上不会出现两条同轨叠字：
   *  1. 完全避开避让区的干净空轨（首选带 → 整段兜底）；
   *  2. 被人物压住、但轨道空闲的轨 —— 挑「遮挡权重最小」的那条。
   *     这类弹幕绘制时会被人物的 evenodd 裁剪挖空，视觉上是从人身后穿过去，
   *     人物区域里一个像素的弹幕都不会有；
   *  3. 都没有 → null。
   */
  private assignTrack(
    cand: Candidate,
    currentTime: number,
    size: { width: number; height: number },
    trackCount: number,
    opts: RenderOptions,
    zones: Rect[]
  ): number | null {
    const item = cand.item;
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

    // 显式轨道（TrackStrategyPlugin / 置顶带）：该轨空闲就直接采用，尊重插件意图
    const forced = item.renderHint?.track;
    if (forced != null && forced >= 0 && forced < trackCount) {
      if (this.trackFree(forced, cand, currentTime, size, opts)) return forced;
    }

    // 第一级：首选区间内的干净空轨（离人物最远，观感最好）
    let t = this.findFree(lo, hi, cand, currentTime, size, opts, zones);
    if (t >= 0) return t;
    // 第二级：整段找干净空轨（仅当首选区饱和，允许与固定带短暂共用）
    t = this.findFree(0, trackCount, cand, currentTime, size, opts, zones);
    if (t >= 0) return t;
    // 第三级：被避让区压住但空闲 —— 挑遮挡最少的，交给绘制期裁剪
    t = this.findLeastBlocked(lo, hi, cand, currentTime, size, opts, zones);
    if (t >= 0) return t;
    t = this.findLeastBlocked(0, trackCount, cand, currentTime, size, opts, zones);
    if (t >= 0) return t;
    return null;
  }

  /**
   * 该轨道是否可容纳一条新弹幕。
   * 关键：滚动型按移动方向分轨 —— 正向(scroll, dir=-1)与反向(reverse, dir=+1)在
   * 同一条轨道必会迎面交叠，因此异向直接判冲突；同向才看入口/出口余量；
   * 停留型(top/bottom/pinned)在其停留期内独占整条轨道。
   *
   * 另有一条容易漏掉的规则 —— **防追尾**：屏幕速度是 `(宽 + 弹幕宽) / 时长`，
   * 也就是「越长的弹幕飞得越快」。两条同轨同向的弹幕，后入场的如果更宽，
   * 就会在飞行途中追上前一条、压出半句叠字（截图里那种「一个字一个字穿插」的乱码）。
   * 所以同向还要算一次追及：后车在前车离场前追不上才放行。
   */
  private trackFree(
    track: number,
    cand: Candidate,
    currentTime: number,
    size: { width: number; height: number },
    opts: RenderOptions
  ): boolean {
    const dir = cand.dir;
    const sNew = (size.width + cand.width) / Math.max(0.001, cand.duration);
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
      const sOld = (size.width + a.width) / Math.max(0.001, a.duration);
      if (dir === -1) {
        // 前车（右侧）必须已经整条进入画布并让出 gap，后车才从右缘入场
        const edge = a.x + a.width;
        if (edge > size.width - opts.gap) return false;
        // 追及：后车更快时，前车右缘退出画布之前不能碰到它
        if (sNew > sOld && sNew * edge > sOld * size.width) return false;
      } else {
        if (a.x < opts.gap) return false;
        // 反向同理：前车左缘剩余路程 W - a.x
        if (sNew > sOld && sNew * (size.width - a.x) > sOld * size.width) return false;
      }
    }
    return true;
  }

  /** 在 [lo,hi) 内跳过避让区找空轨；无空轨返回 -1 */
  private findFree(
    lo: number,
    hi: number,
    cand: Candidate,
    currentTime: number,
    size: { width: number; height: number },
    opts: RenderOptions,
    zones: Rect[]
  ): number {
    for (let t = lo; t < hi; t++) {
      if (zones.length && trackBlocked(t, opts.trackHeight, zones)) continue;
      if (this.trackFree(t, cand, currentTime, size, opts)) return t;
    }
    return -1;
  }

  /**
   * 在 [lo,hi) 内找「遮挡权重最小」的空闲轨（允许被避让区压住，绘制期裁剪掉被压的部分）。
   * 无可用空轨返回 -1。这是画布被人物大面积覆盖时唯一还能让弹幕跑起来的通路。
   */
  private findLeastBlocked(
    lo: number,
    hi: number,
    cand: Candidate,
    currentTime: number,
    size: { width: number; height: number },
    opts: RenderOptions,
    zones: Rect[]
  ): number {
    let best = -1;
    let bestWeight = Infinity;
    for (let t = lo; t < hi; t++) {
      if (!this.trackFree(t, cand, currentTime, size, opts)) continue;
      const w = trackBlockWeight(t, opts.trackHeight, zones);
      if (w < bestWeight) {
        bestWeight = w;
        best = t;
        if (w === 0) break; // 已经不遮挡，没必要再找
      }
    }
    return best;
  }

  /** 清空（切换视频 / 清屏指令时调用） */
  clear(): void {
    this.active.clear();
    this.waiting.clear();
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
  // y 起点计入顶部安全区：弹幕整体下沉到控件浮层之下
  const y = opts.topInset + a.track * trackHeight + trackHeight * 0.5;
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
  // 宽度只量一次：measureText 是逐帧热点（满载时每帧几百条，重复量直接吃掉十几毫秒）
  if (!a.measured) {
    a.width = measure(a.item, ctx, opts).width;
    a.measured = true;
  }
  const totalW = a.width;

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
