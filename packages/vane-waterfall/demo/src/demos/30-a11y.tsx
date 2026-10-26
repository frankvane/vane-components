/**
 * 30 · A11y 插件
 *
 * 给容器补 role / aria-label，给项补 role / tabIndex。开「检查 DOM 属性」直接读真实节点，
 * 比文档里写「会加 role=list」有说服力。
 */
import { createA11yPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "a11y",
  title: "A11y 插件",
  group: "plugin",
  plugin: "A11yPlugin",
  intro: "容器 role=list、项 role=listitem，一键读出来验证。",
  why: "瀑布流本质是列表，但 div 堆出来的结构对读屏软件等于不存在。这个插件把语义补齐，成本极低。",
  plugs: [
    {
      fn: "createA11yPlugin",
      cfg: 'containerRole: "list", itemRole: "listitem", containerLabel: "示例卡片列表", enableTabIndex: false',
      why: "在 onMount / onLayoutComplete 里写语义属性（不是渲染期副作用），项用 renderItemWrapper 包一层",
    },
  ],
  props: ["columns={3}", "containerStyle={{ height: 420 }}"],
  note: "enableTabIndex 打开后每张卡都能 Tab 到，键盘可达但 Tab 会很累 —— 除非卡片真的可操作，否则保持关闭，用 roving tabindex 更好。",
};

export default createFeedStage({
  count: 16,
  seed: 4601,
  instrument: true,
  plugins: () => [
    createA11yPlugin({
      containerRole: "list",
      itemRole: "listitem",
      containerLabel: "示例卡片列表",
      enableTabIndex: false,
    }),
  ],
  coreProps: () => ({ columns: 3, gap: 12 }),
  chrome: (api) => (
    <div className="stage-a11y">
      <button
        type="button"
        onClick={() => {
          const box = api.ref.current?.getContainer();
          if (!box) {
            api.log("容器还没挂载", "warn");
            return;
          }
          const first = box.querySelector<HTMLElement>("[data-index]");
          api.log(`容器 role="${box.getAttribute("role") ?? "无"}" aria-label="${box.getAttribute("aria-label") ?? "无"}"`);
          api.log(
            `首项 role="${first?.getAttribute("role") ?? "无"}" tabIndex="${first?.getAttribute("tabindex") ?? "无"}"`
          );
        }}
      >
        检查 DOM 属性
      </button>
      <span className="muted">结果写到右栏日志</span>
    </div>
  ),
});
