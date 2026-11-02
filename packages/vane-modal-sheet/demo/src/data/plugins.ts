/**
 * MVP 插件目录（总览页数字与表格的真源）
 *
 * priority 按主题分带防撞车：10s 遮罩 / 20s 把手 / 30–40s 头尾 / 50–60s 行为。
 */
export interface PluginCard {
  name: string;
  priority: number;
  kind: "slot" | "hook";
  slot?: string;
  desc: string;
}

export const PLUGINS: PluginCard[] = [
  {
    name: "BackdropPlugin",
    priority: 10,
    kind: "slot",
    slot: "renderBackdrop",
    desc: "遮罩，透明度随 progress 联动，点击关闭",
  },
  {
    name: "DragHandlePlugin",
    priority: 20,
    kind: "slot",
    slot: "renderHandle",
    desc: "拖拽指示条 + 拖拽面（getDragProps 透传内核）",
  },
  {
    name: "SnapDotsPlugin",
    priority: 24,
    kind: "slot",
    slot: "renderHandle",
    desc: "档位指示点，当前档高亮，点击直达",
  },
  {
    name: "HeaderPlugin",
    priority: 30,
    kind: "slot",
    slot: "renderHeader",
    desc: "标题栏 + 关闭按钮，兼作拖拽面",
  },
  {
    name: "StepFlowPlugin",
    priority: 32,
    kind: "slot",
    slot: "renderHeader+Footer",
    desc: "步骤条 + 上一步/下一步（分步表单）",
  },
  {
    name: "SearchBarPlugin",
    priority: 34,
    kind: "slot",
    slot: "renderHeader",
    desc: "搜索框，受控 value + onSearch 过滤回调",
  },
  {
    name: "FooterPlugin",
    priority: 40,
    kind: "slot",
    slot: "renderFooter",
    desc: "吸底操作区（主/次按钮、加载态）",
  },
  {
    name: "KeyboardAvoidPlugin",
    priority: 50,
    kind: "hook",
    desc: "VirtualKeyboard + visualViewport 兜底，键盘弹出顶到最高档",
  },
  {
    name: "ScrollLockPlugin",
    priority: 52,
    kind: "hook",
    desc: "body 锁滚 + 恢复滚动位置",
  },
  {
    name: "FocusTrapPlugin",
    priority: 54,
    kind: "hook",
    desc: "role=dialog / aria-modal / 焦点圈定与归还",
  },
];
