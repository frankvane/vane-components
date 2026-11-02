/**
 * 插件工坊数据源：21 个内置插件 + 真工厂
 *
 * priority 按主题分带防撞车：10s 遮罩 / 20s 把手 / 30–40s 头尾 /
 * 50–60s 行为环境 / 80–90s 反馈与内容。
 *
 * 工坊是「勾选即装配」：`make()` 直接产出真插件实例交给 HOC，
 * `doc` 取自工厂上挂载的 `.meta`（与 docs/plugins.md 同源），
 * 页面不手抄描述，避免文档漂移。
 */
import type { PluginDoc } from "vane-plugin-core";
import type { ModalSheetPlugin } from "vane-modal-sheet";

import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createSnapDotsPlugin } from "vane-modal-sheet/custom-plugins/SnapDotsPlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createStepFlowPlugin } from "vane-modal-sheet/custom-plugins/StepFlowPlugin";
import { createSearchBarPlugin } from "vane-modal-sheet/custom-plugins/SearchBarPlugin";
import { createFooterPlugin } from "vane-modal-sheet/custom-plugins/FooterPlugin";
import { createKeyboardAvoidPlugin } from "vane-modal-sheet/custom-plugins/KeyboardAvoidPlugin";
import { createScrollLockPlugin } from "vane-modal-sheet/custom-plugins/ScrollLockPlugin";
import { createFocusTrapPlugin } from "vane-modal-sheet/custom-plugins/FocusTrapPlugin";
import { createEscClosePlugin } from "vane-modal-sheet/custom-plugins/EscClosePlugin";
import { createNestedScrollPlugin } from "vane-modal-sheet/custom-plugins/NestedScrollPlugin";
import { createSafeAreaPlugin } from "vane-modal-sheet/custom-plugins/SafeAreaPlugin";
import { createResponsivePlugin } from "vane-modal-sheet/custom-plugins/ResponsivePlugin";
import { createKeepMountedPlugin } from "vane-modal-sheet/custom-plugins/KeepMountedPlugin";
import { createHistoryPlugin } from "vane-modal-sheet/custom-plugins/HistoryPlugin";
import { createModalEffectPlugin } from "vane-modal-sheet/custom-plugins/ModalEffectPlugin";
import { createHapticsPlugin } from "vane-modal-sheet/custom-plugins/HapticsPlugin";
import { createAnnouncerPlugin } from "vane-modal-sheet/custom-plugins/AnnouncerPlugin";
import { createLoadingStatePlugin } from "vane-modal-sheet/custom-plugins/LoadingStatePlugin";
import { createEmptyStatePlugin } from "vane-modal-sheet/custom-plugins/EmptyStatePlugin";

export type PluginGroup = "visual" | "behavior" | "feedback";

export const GROUP_ORDER: PluginGroup[] = ["visual", "behavior", "feedback"];

export const GROUP_LABEL: Record<PluginGroup, string> = {
  visual: "视觉",
  behavior: "行为",
  feedback: "反馈",
};

/** doc.json 可能带的扩展字段（插件文档契约里还没有，先按可选读） */
export type PluginDocView = PluginDoc & {
  features?: string[];
  useCases?: string[];
  notes?: string[];
};

export interface PluginCard {
  name: string;
  priority: number;
  group: PluginGroup;
  kind: "slot" | "hook";
  slot?: string;
  /** 一行职责 */
  summary: string;
  /** 工厂调用表达式（同时用于代码块生成） */
  factory: string;
  doc: PluginDocView;
  /** 演示用装配：勾选后真跑 */
  make: () => ModalSheetPlugin;
}

export const PLUGINS: PluginCard[] = [
  {
    name: "BackdropPlugin",
    priority: 10,
    group: "visual",
    kind: "slot",
    slot: "renderBackdrop",
    summary: "遮罩，透明度随进度联动，点击关闭",
    factory: "createBackdropPlugin()",
    doc: createBackdropPlugin.meta as PluginDocView,
    make: () => createBackdropPlugin(),
  },
  {
    name: "DragHandlePlugin",
    priority: 20,
    group: "visual",
    kind: "slot",
    slot: "renderHandle",
    summary: "拖拽指示条 + 拖拽面（透传内核手势）",
    factory: "createDragHandlePlugin()",
    doc: createDragHandlePlugin.meta as PluginDocView,
    make: () => createDragHandlePlugin(),
  },
  {
    name: "SnapDotsPlugin",
    priority: 24,
    group: "visual",
    kind: "slot",
    slot: "renderHandle",
    summary: "档位指示点，当前档高亮，点击直达",
    factory: "createSnapDotsPlugin()",
    doc: createSnapDotsPlugin.meta as PluginDocView,
    make: () => createSnapDotsPlugin(),
  },
  {
    name: "HeaderPlugin",
    priority: 30,
    group: "visual",
    kind: "slot",
    slot: "renderHeader",
    summary: "标题栏 + 关闭按钮，兼作拖拽面",
    factory: 'createHeaderPlugin({ title: "插件工坊" })',
    doc: createHeaderPlugin.meta as PluginDocView,
    make: () => createHeaderPlugin({ title: "插件工坊" }),
  },
  {
    name: "StepFlowPlugin",
    priority: 32,
    group: "visual",
    kind: "slot",
    slot: "renderHeader+Footer",
    summary: "步骤条 + 上一步/下一步（分步表单）",
    factory: 'createStepFlowPlugin({ steps: ["选择", "确认"] })',
    doc: createStepFlowPlugin.meta as PluginDocView,
    make: () => createStepFlowPlugin({ steps: ["选择", "确认"] }),
  },
  {
    name: "SearchBarPlugin",
    priority: 34,
    group: "visual",
    kind: "slot",
    slot: "renderHeader",
    summary: "搜索框，输入经 bus 广播过滤回调",
    factory: 'createSearchBarPlugin({ placeholder: "搜索插件…" })',
    doc: createSearchBarPlugin.meta as PluginDocView,
    make: () => createSearchBarPlugin({ placeholder: "搜索插件…" }),
  },
  {
    name: "FooterPlugin",
    priority: 40,
    group: "visual",
    kind: "slot",
    slot: "renderFooter",
    summary: "吸底操作区（主/次按钮、加载态）",
    factory:
      'createFooterPlugin({ primaryText: "完成", secondaryText: "取消" })',
    doc: createFooterPlugin.meta as PluginDocView,
    make: () =>
      createFooterPlugin({ primaryText: "完成", secondaryText: "取消" }),
  },
  {
    name: "KeyboardAvoidPlugin",
    priority: 50,
    group: "behavior",
    kind: "hook",
    summary: "键盘弹出时顶到最高档，visualViewport 兜底",
    factory: "createKeyboardAvoidPlugin()",
    doc: createKeyboardAvoidPlugin.meta as PluginDocView,
    make: () => createKeyboardAvoidPlugin(),
  },
  {
    name: "ScrollLockPlugin",
    priority: 52,
    group: "behavior",
    kind: "hook",
    summary: "锁 body 滚动，关闭后恢复原滚动位置",
    factory: "createScrollLockPlugin()",
    doc: createScrollLockPlugin.meta as PluginDocView,
    make: () => createScrollLockPlugin(),
  },
  {
    name: "FocusTrapPlugin",
    priority: 54,
    group: "behavior",
    kind: "hook",
    summary: "dialog 语义 + 焦点圈定与归还",
    factory: "createFocusTrapPlugin()",
    doc: createFocusTrapPlugin.meta as PluginDocView,
    make: () => createFocusTrapPlugin(),
  },
  {
    name: "EscClosePlugin",
    priority: 56,
    group: "behavior",
    kind: "hook",
    summary: "Esc 关闭；多层嵌套只关最顶层",
    factory: "createEscClosePlugin()",
    doc: createEscClosePlugin.meta as PluginDocView,
    make: () => createEscClosePlugin(),
  },
  {
    name: "NestedScrollPlugin",
    priority: 58,
    group: "behavior",
    kind: "hook",
    summary: "内容未滚回顶部时锁定拖拽，避免误滑关闭",
    factory: "createNestedScrollPlugin()",
    doc: createNestedScrollPlugin.meta as PluginDocView,
    make: () => createNestedScrollPlugin(),
  },
  {
    name: "SafeAreaPlugin",
    priority: 60,
    group: "behavior",
    kind: "hook",
    summary: "刘海屏 / 手势条安全区内边距",
    factory: "createSafeAreaPlugin()",
    doc: createSafeAreaPlugin.meta as PluginDocView,
    make: () => createSafeAreaPlugin(),
  },
  {
    name: "ResponsivePlugin",
    priority: 62,
    group: "behavior",
    kind: "hook",
    summary: "窄屏底部弹层 / 宽屏居中悬浮弹窗",
    factory: "createResponsivePlugin()",
    doc: createResponsivePlugin.meta as PluginDocView,
    make: () => createResponsivePlugin(),
  },
  {
    name: "KeepMountedPlugin",
    priority: 64,
    group: "behavior",
    kind: "hook",
    summary: "关闭保活：重开恢复滚动阅读进度",
    factory: "createKeepMountedPlugin()",
    doc: createKeepMountedPlugin.meta as PluginDocView,
    make: () => createKeepMountedPlugin(),
  },
  {
    name: "HistoryPlugin",
    priority: 66,
    group: "behavior",
    kind: "hook",
    summary: "Android 返回手势 / 浏览器后退关闭",
    factory: "createHistoryPlugin()",
    doc: createHistoryPlugin.meta as PluginDocView,
    make: () => createHistoryPlugin(),
  },
  {
    name: "ModalEffectPlugin",
    priority: 80,
    group: "feedback",
    kind: "hook",
    summary: "iOS modal effect：背景随进度轻微放大",
    factory: "createModalEffectPlugin()",
    doc: createModalEffectPlugin.meta as PluginDocView,
    make: () => createModalEffectPlugin(),
  },
  {
    name: "HapticsPlugin",
    priority: 82,
    group: "feedback",
    kind: "hook",
    summary: "吸附 / 关闭时振动反馈（navigator.vibrate）",
    factory: "createHapticsPlugin()",
    doc: createHapticsPlugin.meta as PluginDocView,
    make: () => createHapticsPlugin(),
  },
  {
    name: "AnnouncerPlugin",
    priority: 84,
    group: "feedback",
    kind: "hook",
    summary: "读屏播报当前档位（aria-live）",
    factory: "createAnnouncerPlugin()",
    doc: createAnnouncerPlugin.meta as PluginDocView,
    make: () => createAnnouncerPlugin(),
  },
  {
    name: "LoadingStatePlugin",
    priority: 86,
    group: "feedback",
    kind: "hook",
    summary: "加载骨架 + 加载中锁定拖拽",
    factory: "createLoadingStatePlugin()",
    doc: createLoadingStatePlugin.meta as PluginDocView,
    make: () => createLoadingStatePlugin(),
  },
  {
    name: "EmptyStatePlugin",
    priority: 88,
    group: "feedback",
    kind: "hook",
    summary: "空态占位 + 引导动作",
    factory: "createEmptyStatePlugin()",
    doc: createEmptyStatePlugin.meta as PluginDocView,
    make: () => createEmptyStatePlugin(),
  },
];

/**
 * 默认勾选：Backdrop 会遮住整页让工坊没法继续操作，默认留给用户手动体验；
 * StepFlow 自带底部导航，与 FooterPlugin 同时勾选会出现两排按钮，默认不叠。
 */
export const DEFAULT_SELECTED = PLUGINS.filter(
  (p) => p.name !== "BackdropPlugin" && p.name !== "StepFlowPlugin"
).map((p) => p.name);
