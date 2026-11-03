import type React from "react";
import type {
  PluginContext,
  PluginHooks,
  Plugin,
  PluginCreator,
  PluginDoc,
} from "vane-plugin-core";

/**
 * vane-activity 领域类型层。
 *
 * 内核 vane-plugin-core 已提供 PluginContext / PluginHooks / Plugin 等通用类型，
 * 这里只声明「活动领域层」的差异：
 *  - ActivityTask / ActivityReward / ActivityRule / ActivityData：领域数据；
 *  - ActivityCoreProps / ActivityCoreRef：核心组件 props / ref；
 *  - ActivityPluginContext：内核 context + 活动专属派生字段
 *    （tasks / rewards 含状态 / progress / claimedIds / claim）；
 *  - ActivityPluginHooks：内核 9 钩子 + 6 个领域渲染槽
 *    （renderHeader / renderProgress / renderTasks / renderRewards / renderRules /
 *     renderFooter）；renderOverlay 复用内核钩子（浮层特效）。
 *  - ActivityPlugin：插件定义。
 *
 * 约定：领域钩子一律用「方法语法」声明参数，以便内核把 context 收窄为领域上下文时
 * 通过 bivariance 校验（strictFunctionTypes 下参数逆变会拒绝领域钩子赋值）。
 */

// ============ 领域数据 ============

export type TaskStatus = "locked" | "available" | "completed";
export type RewardStatus = "locked" | "claimable" | "claimed";
/** 奖励状态别名（与 RewardStatus 同义，便于消费方语义化引用） */
export type ActivityRewardStatus = RewardStatus;

/** 任务分组（TaskTabsPlugin 消费；任务用 task.group 归属） */
export interface ActivityTaskGroup {
  /** 分组键，与 task.group 对应；"all" 为内置的「全部」视图 */
  key: string;
  label: string;
  icon?: string;
}

/** 签到态（CheckinCalendarPlugin 消费） */
export interface ActivityCheckinState {
  /** 活动共几天（默认 7） */
  days?: number;
  /** 已完成签到天数 */
  done: number;
  /** 今天对应的格子下标（0-based，默认等于 done，即「今天还没签」） */
  todayIndex?: number;
}

/** 单个活动任务 */
export interface ActivityTask {
  id: string;
  title: string;
  desc?: string;
  /** 当前完成度 0..1（completed 态应为 1） */
  progress: number;
  status: TaskStatus;
  /** 所属分组键（TaskTabsPlugin 据此分组；不传归入「全部」） */
  group?: string;
  /** 行为按钮文案（如「去完成」「查看」），由 TaskList 渲染 */
  actionLabel?: string;
  /** 关联奖励 id（任务完成时点亮对应奖励） */
  rewardId?: string;
  /** 权重（默认 1），影响总体进度占比 */
  weight?: number;
}

/** 单个活动奖励（阈值触发领取） */
export interface ActivityReward {
  id: string;
  title: string;
  /** 触发领取所需的总体进度阈值 0..1 */
  threshold: number;
  icon?: string;
  desc?: string;
}

/** 带派生状态的奖励 */
export interface ActivityRewardWithStatus extends ActivityReward {
  status: ActivityRewardStatus;
}

/** 活动规则（长文，RuleExpand 折叠） */
export interface ActivityRule {
  title?: string;
  content: string;
}

/** 排行榜条目（LeaderboardPlugin 消费） */
export interface ActivityLeaderboardEntry {
  id: string;
  name: string;
  /** 榜单分值（越大越靠前） */
  score: number;
  /** 头像文案（emoji 或首字），不传取 name 首字 */
  avatar?: string;
  /** 是否当前用户（高亮） */
  isMe?: boolean;
}

/** 助力态（ShareBoostPlugin 消费） */
export interface ActivityShareState {
  /** 今日可助力总次数 */
  total: number;
  /** 已使用次数 */
  used: number;
  /** 已助力好友（按时间先后） */
  helpers?: { id: string; name: string; avatar?: string }[];
}

/** 活动默认数据形态 */
export interface ActivityData {
  title?: string;
  tasks: ActivityTask[];
  rewards: ActivityReward[];
  /** 规则：单段长文或分段 */
  rules: string | ActivityRule[];
  /** 活动截止时间（ISO 字符串或时间戳）；CountdownTimerPlugin 未传 config 时回退读取 */
  endTime?: string | number;
  /** 排行榜数据（LeaderboardPlugin 读取；不传则不渲染） */
  leaderboard?: ActivityLeaderboardEntry[];
  /** 助力数据（ShareBoostPlugin 读取；不传则用 config 默认值） */
  share?: ActivityShareState;
  /** 公告条目（AnnouncementPlugin 读取；不传则用 config.items） */
  announcements?: string[];
  /** 任务分组（TaskTabsPlugin 读取；不传则用 config.tabs 或单「全部」页签） */
  taskGroups?: ActivityTaskGroup[];
  /** 签到态（CheckinCalendarPlugin 读取；不传则用 config.days / done） */
  checkin?: ActivityCheckinState;
}

// ============ 核心组件 props / ref ============

export interface ActivityCoreProps<T = ActivityData> {
  /** 内核数据（活动定义：任务/奖励/规则），透传给 context.data */
  data?: T;
  /**
   * 受控：已领取奖励 id 列表；不传则内核持有内部态。
   * 受控时必须根据 onClaim 回写新数组；未回写时该奖励保持「请求中」，
   * 重复点击不会再触发 onClaim。
   */
  claimedRewardIds?: string[];
  /** 领取回调；受控模式下需要据此回写 claimedRewardIds 才会生效 */
  onClaim?: (rewardId: string) => void;
  /** 任务动作回调（点击「去完成」等） */
  onTaskAction?: (taskId: string) => void;
  /** 空态文案 */
  emptyText?: React.ReactNode;
  /** 加载中 */
  loading?: boolean;
  /** 容器类名 */
  containerClassName?: string;
  /** 容器内联样式 */
  containerStyle?: React.CSSProperties;
  /** 生命周期回调 */
  onMount?: () => void;
  onUnmount?: () => void;
  /** 调试开关 */
  debug?: boolean;
  /** 由 withPlugins 注入，插件通过 ctx.refs.container 拿到同一引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement>;
}

export interface ActivityCoreRef {
  getContainer: () => HTMLDivElement | null;
  forceUpdate: () => void;
  getSize: () => { width: number; height: number };
}

// ============ 插件上下文 ============

/**
 * 活动插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / deviceInfo / forceUpdate / getSize / logger；这里补充活动
 * 专属派生字段，供插件按语义访问。
 */
export interface ActivityPluginContext<T = ActivityData>
  extends PluginContext<ActivityCoreProps<T>, T> {
  /** 经派生的任务列表（直接来自 data.tasks） */
  tasks: ActivityTask[];
  /** 经派生、带状态的奖励列表（locked/claimable/claimed） */
  rewards: ActivityRewardWithStatus[];
  /** 总体进度 0..1（由任务完成度加权求得） */
  progress: number;
  /** 已领取奖励 id 列表（受控或内部态） */
  claimedIds: string[];
  /**
   * 领取奖励：仅 claimable 态生效；未知 id / locked / claimed 直接忽略并告警。
   * 非受控时写入内部态 + 调 onClaim；受控时只调 onClaim，由宿主回写。
   */
  claim: (rewardId: string) => void;
}

// ============ 插件钩子 ============

/**
 * 内核 9 钩子（onMount / onUnmount / onPropsChange / onError / transformProps /
 * transformData / renderOverlay / renderHeader / renderFooter）+ 活动领域 6 渲染槽：
 *   renderHeader  （活动头部横幅：标题/副标题/标签/状态）
 *   renderProgress（顶部进度区：进度条/环/数字）
 *   renderTasks（任务清单主体）
 *   renderRewards（奖励领取区）
 *   renderRules（规则折叠面板）
 *   renderFooter （活动底部：助力/榜单等社交区）
 * renderOverlay 复用内核钩子（浮层特效：达成庆祝 / 领取 toast）。
 */
export interface ActivityPluginHooks<T = ActivityData>
  extends PluginHooks<ActivityCoreProps<T>, T> {
  /** 活动头部横幅 */
  renderHeader?: (context: ActivityPluginContext<T>) => React.ReactNode;
  /** 顶部进度区 */
  renderProgress?: (context: ActivityPluginContext<T>) => React.ReactNode;
  /** 任务清单主体 */
  renderTasks?: (context: ActivityPluginContext<T>) => React.ReactNode;
  /** 奖励领取区 */
  renderRewards?: (context: ActivityPluginContext<T>) => React.ReactNode;
  /** 规则折叠面板 */
  renderRules?: (context: ActivityPluginContext<T>) => React.ReactNode;
  /** 活动底部社交区 */
  renderFooter?: (context: ActivityPluginContext<T>) => React.ReactNode;
}

// ============ 插件定义 ============

/**
 * 所有插件工厂配置的公共字段。
 *
 * `order` 由内核排序消费（renderActivitySlot：order 升序 → priority 降序），
 * 用于同槽位共存时微调上下顺序（如环在进度条上方）。独占槽位用不到但保留无害。
 */
export interface ActivityPluginConfigBase {
  /** 同槽位排序键，升序靠前（默认 0） */
  order?: number;
}

/** 活动插件：在内核 Plugin 基础上把 hooks 收窄为领域钩子 */
export interface ActivityPlugin<T = ActivityData>
  extends Plugin<ActivityCoreProps<T>, T> {
  hooks: ActivityPluginHooks<T>;
  /**
   * 声明本插件独占的领域槽位（如 ["renderRewards"]）。
   * 装配期（withPlugins）按 priority 降序去重：同一槽位上声明独占的插件只保留
   * priority 最高者，其余被整体丢弃并 console.warn。未声明独占的插件不受影响
   * （同槽位仍可共存，如 ProgressFx 与 CountdownTimer 同在 renderProgress）。
   */
  exclusiveSlots?: ActivitySlotName[];
}

/** 插件工厂：可调用 + 挂载 meta，供文档生成与 demo 导航使用 */
export type ActivityPluginCreator<Config = any, T = ActivityData> = PluginCreator<
  Config,
  ActivityCoreProps<T>,
  T
>;

/** 领域渲染槽名（包内 renderActivitySlot 消费，复用内核排序 + priority + 错误边界） */
export type ActivitySlotName =
  | "renderHeader"
  | "renderProgress"
  | "renderTasks"
  | "renderRewards"
  | "renderRules"
  | "renderFooter"
  | "renderOverlay";

export type { PluginDoc };
