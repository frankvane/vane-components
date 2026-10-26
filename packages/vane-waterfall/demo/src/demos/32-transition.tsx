/**
 * 32 · Transition 插件
 *
 * 给每项加 transform / opacity 过渡，重排时位置不瞬移。
 * 点「打乱顺序」把数据随机重排 —— 有过渡时卡片是滑过去的，没有时是瞬移。
 *
 * 顺带提醒：自动化量几何（比如场景库的体检）要么等过渡结束再量，要么把它关掉，
 * 否则会量到中间态。
 */
import { createTransitionPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "transition",
  title: "Transition 插件",
  group: "plugin",
  plugin: "TransitionPlugin",
  intro: "打乱顺序，看卡片是滑过去还是瞬移。",
  why: "筛选、排序、拖拽后布局会大幅变化，没有过渡会显得「闪一下」；加上 200–300ms 就顺了。",
  plugs: [
    {
      fn: "createTransitionPlugin",
      cfg: 'duration: {{duration}}, easing: "cubic-bezier(.22,.61,.36,1)"',
      why: "只加 CSS 过渡（transform / opacity），不参与布局计算",
    },
  ],
  props: ["columns={3}", "containerStyle={{ height: 420 }}"],
  note: "把 duration 拖到 0 就等于关掉。过渡期间 item 的 transform 是中间值，用 transform 读位置的工具会读到中间态。",
  controls: [
    { key: "duration", label: "duration（ms）", kind: "number", init: 260, min: 0, max: 800, step: 20 },
  ],
};

export default createFeedStage({
  count: 24,
  seed: 4801,
  instrument: true,
  plugins: (api) => [createTransitionPlugin({ duration: Number(api.cfg.duration) })],
  coreProps: () => ({ columns: 3, gap: 12 }),
  chrome: (api) => (
    <div className="stage-anchors">
      <button
        type="button"
        onClick={() => {
          api.setItems((prev) => {
            const next = prev.slice();
            for (let i = next.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [next[i], next[j]] = [next[j], next[i]];
            }
            return next;
          });
          api.log(`打乱顺序（过渡 ${Number(api.cfg.duration)}ms）`);
        }}
      >
        打乱顺序
      </button>
      <span className="muted">duraton 拖到 0 再点一次，就是瞬移</span>
    </div>
  ),
});
