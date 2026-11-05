import type React from "react";
import type {
  PluginContext,
  PluginHooks,
  Plugin,
  PluginCreator,
  PluginDoc,
  PluginBus,
} from "vane-plugin-core";

/**
 * vane-danmaku 领域类型层。
 * 内核 vane-plugin-core 已提供 PluginContext / PluginHooks / Plugin 等通用类型，
 * 这里只声明「弹幕领域层」的差异。
 */

// ============ 领域数据 ============

/** 粉丝牌 */
export interface FanBadge {
  name: string;
  level: number;
  /** 牌底主色（core 绘制粉丝牌底块用） */
  color: string;
}

/** 弹幕模式：右→左滚动 / 顶部固定 / 底部固定 / 左→右滚动 */
export type DanmakuMode = "scroll" | "top" | "bottom" | "reverse";

/** 单条弹幕的元信息（业务语义载体） */
export interface DanmakuMeta {
  userId?: string;
  userName?: string;
  /** 用户等级（用于颜色策略 / 高赞置顶阈值） */
  level?: number;
  /** 粉丝牌（FanBadgePlugin 富化；core 绘制底块） */
  fanBadge?: FanBadge;
  isAdmin?: boolean;
  /** 弹幕颜色覆盖 */
  color?: string;
  fontSize?: number;
  /** 字体族覆盖（StylePresetPlugin 设定；渲染器优先采用） */
  fontFamily?: string;
  /** 字重覆盖（StylePresetPlugin 设定；渲染器优先采用） */
  fontWeight?: number;
  /** 礼物连击（GiftComboPlugin 富化；渲染器末尾绘制 xN 角标） */
  combo?: number;
  /** 表情包占位（EmojiRenderPlugin 填充） */
  emoji?: string[];
}

/** 互动指令（CmdParsePlugin 识别，命中则不进入渲染流） */
export interface DanmakuCommand {
  type: string;
  payload?: unknown;
}

/** 矩形避让区（防遮挡：SafeZonePlugin 注入，core 调度时避开） */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 渲染提示：插件绝不直绘 canvas，只写这里；由 core 的渲染器消费。
 * 这是「数据面插件 ↔ canvas 内核」的唯一契约边界。
 */
export interface DanmakuRenderHint {
  /** 指定轨道（置顶 / 防遮挡策略 / TrackStrategyPlugin 产出） */
  track?: number;
  /** 高赞高亮环 */
  ring?: boolean;
  /** 置顶固定（停在该轨道，不参与水平滚动） */
  pinned?: boolean;
  /** 敏感词已打码 */
  masked?: boolean;
  /** 该条局部避让区（可选，叠加全局避让区） */
  avoidZones?: Rect[];
  /** 高亮底块颜色（KeywordHighlightPlugin 等：渲染器画半透明圆角底） */
  highlight?: string;
  /** 分段着色：命中词 / @提及 等局部着色，渲染器按段绘制（缺省整条单色） */
  rich?: { text: string; color?: string }[];
}

/** 单条弹幕 */
export interface DanmakuItem {
  id: string;
  text: string;
  mode: DanmakuMode;
  /** 出现时间（秒，相对视频播放头） */
  time: number;
  /** 飞行时长（scroll / reverse；top / bottom 用 duration 作停留时长） */
  duration?: number;
  meta: DanmakuMeta;
  renderHint?: DanmakuRenderHint;
  /** CmdParse 标记后不渲染，改触发动作 */
  _cmd?: DanmakuCommand;
}

/** 弹幕数据集（transformData 的操作对象） */
export interface DanmakuData {
  items: DanmakuItem[];
  /** 当前播放时间（秒），驱动可见性 */
  now?: number;
}

// ============ 核心组件 props / ref ============

export interface DanmakuCoreProps {
  /** 弹幕列表（已按 transformData 富化/过滤；无插件时即原始列表） */
  items: DanmakuItem[];
  /** 当前播放时间（秒），驱动哪些弹幕可见；变化时激活新弹幕 */
  currentTime?: number;
  /** 是否播放中：暂停时弹幕静止（仍绘制当前帧） */
  playing?: boolean;
  /** 轨道高度（px），默认 28 */
  trackHeight?: number;
  /** 基础字号（px），默认 22 */
  baseFontSize?: number;
  /** 全局不透明度 0–1，默认 1 */
  opacity?: number;
  /** 渐显/渐隐时长（毫秒），默认 450 */
  fadeMs?: number;
  /** 同轨最小间隔（px，碰撞检测余量），默认 24 */
  gap?: number;
  /** 默认飞行时长（秒，item.duration 缺省时使用），默认 8 */
  defaultDuration?: number;
  /** 高亮主题色（高赞环 / 置顶高亮），默认 "#ff7a29" */
  accent?: string;
  /** 容器 className */
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  onMount?: () => void;
  onUnmount?: () => void;
  debug?: boolean;
  /** 由 withDanmakuPlugins 注入，插件经 ctx.refs.container 拿到同一引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;
  /** DOM 插槽产物（renderOverlay / renderHeader / renderFooter），由 HOC 注入 */
  children?: React.ReactNode;
  /** 防遮挡避让区 provider（HOC 从运行时 shared 桥接进来；每帧读取，不阻塞 60fps） */
  avoidZoneProvider?: () => Rect[];
  /** 顶部安全区（px）：统计条/过滤开关等控件浮层占用，弹幕不渲染到这里 */
  topInset?: number;
  /** 底部安全区（px）：指令输入框等控件占用，弹幕不渲染到这里 */
  bottomInset?: number;
}

export interface DanmakuCoreRef {
  getContainer: () => HTMLDivElement | null;
  forceUpdate: () => void;
  getSize: () => { width: number; height: number };
  /** 取 canvas 元素（消费方做截图 / 接 MediaPipe 帧源） */
  getCanvas: () => HTMLCanvasElement | null;
  /**
   * 清屏：清空在飞与等待中的弹幕，但保留「已激活」记录，
   * 因此清屏后这些条目不会因为 time 已过而重新飞出来（对应 CmdParse 的 clear 指令）。
   */
  clearScreen: () => void;
  /**
   * 运行时读数（压测 / 监控用）：
   *  · active —— 当前在飞条数（真正逐帧绘制的量，出画即回收，不含未到时间与已离场条目）
   *  · dropped —— 自上次时钟回绕（换轮次）以来因画布饱和（无任何空闲轨）被丢弃的累计条数，
   *    饱和时宁可丢弃也不叠字
   */
  getStats: () => { active: number; dropped: number };
}

// ============ 插件上下文 ============

/**
 * 弹幕插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / forceUpdate / getSize / logger；这里把 data 收敛为领域视图
 * DanmakuData（基类 data 为可选泛型，领域覆盖为必填），保持 data 必填。
 *
 * 公共契约位：泛型名保留 `_` 前缀以标注「有意不使用」。
 * 历史上 `T` 未参与类型结构，但外部可能已写 `DanmakuPluginContext<Foo>`；
 * 保留该参数（默认值 any）以免破坏既有类型签名，内部不消费它。
 */
export interface DanmakuPluginContext<_T = any>
  extends PluginContext<DanmakuCoreProps, DanmakuData> {
  data: DanmakuData;
}

// ============ 插件钩子 ============

/**
 * 内核 9 钩子 + 弹幕 3 个 DOM 渲染槽（overlay / header / footer）。
 * 数据面插件用基类已提供的 transformData(context, data: DanmakuData): DanmakuData
 * 操作弹幕流（过滤 / 富化 / 重排 / 拦截指令），绝不触碰 canvas。
 * 钩子一律用「方法语法」声明（bivariance，见 vane-profile / vane-sign-in 同款约定）。
 */
/** 公共契约位：钩子泛型默认值 any 保留（不写 T 的插件定义依赖默认值） */
export interface DanmakuPluginHooks<T = any>
  extends PluginHooks<DanmakuCoreProps, DanmakuData> {
  renderOverlay?(context: DanmakuPluginContext<T>): React.ReactNode;
  renderHeader?(context: DanmakuPluginContext<T>): React.ReactNode;
  renderFooter?(context: DanmakuPluginContext<T>): React.ReactNode;
}

// ============ 插件定义 ============

/** 公共契约位：插件泛型默认值 any 保留（`Plugin[]` 这类写法依赖默认值） */
export interface DanmakuPlugin<T = any>
  extends Plugin<DanmakuCoreProps, DanmakuData> {
  hooks: DanmakuPluginHooks<T>;
}

/** 公共契约位：工厂泛型默认值 any 保留（不传配置的调用方依赖默认值） */
export type DanmakuPluginCreator<Config = any> = PluginCreator<
  Config,
  DanmakuCoreProps,
  DanmakuData
>;

export type { PluginBus, PluginDoc };
