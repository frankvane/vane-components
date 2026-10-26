/**
 * 11 · 任务看板（固定列 + 拖拽换列）
 *
 * 版式诉求：固定 4 列（列 = 泳道），拖卡片到别的列就是改状态。
 *
 * 这里刻意不用 AutoColumnPlugin：看板列数由泳道数量决定，不能随宽度变。
 * 用 `columns={4}` + `sequential` 让第 i 张卡稳定落在第 i%4 列，
 * 再由 DragReorderPlugin 提供 from/to，页面把 to 映射成目标泳道。
 */
import React, { useMemo, useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createA11yPlugin,
  createAlignmentPlugin,
  createDragReorderPlugin,
  createGapPlugin,
  createTransitionPlugin,
} from "vane-waterfall/custom-plugins";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "kanban",
  title: "任务看板 · 固定四列",
  group: "后台",
  ref: { label: "Trello / 飞书多维表格看板", url: "https://trello.com/" },
  pain: "列数必须恒定（泳道固定），拖拽换列还要能改业务状态",
  plugs: [
    { fn: "createAlignmentPlugin", cfg: 'mode: "sequential"', why: "第 i 张卡稳定落 i%4 列，列 = 泳道" },
    { fn: "createDragReorderPlugin", cfg: "onReorder: (from, to) => move(from, to)", why: "拖拽回调里把 to 换算成目标泳道并更新数据" },
    { fn: "createA11yPlugin", cfg: 'containerLabel: "任务看板"', why: "看板是可交互列表，需要语义与键盘可达" },
    { fn: "createGapPlugin", cfg: "columnGap: 14, rowGap: 12", why: "列间距大于行间距，泳道感更强" },
    { fn: "createTransitionPlugin", cfg: "duration: 220", why: "换列后位置过渡" },
  ],
  props: ["columns={4}", "containerStyle={{ height: 420 }}", "renderItem={(item) => <TaskCard item={item} />}"],
  note:
    "sequential 下「列 = index % columns」，所以拖拽换列要真的改数组顺序（把卡片移到目标列对应的下标），只改状态字段是没用的。",
};

const LANES = ["待排期", "进行中", "待验收", "已完成"];

interface Task {
  id: string;
  title: string;
  owner: string;
  lane: number;
  height: number;
  tag: string;
  /** 用于让 sequential 把卡片排到目标列：由 lane 决定的「虚拟下标」 */
  order: number;
}

const OWNERS = ["阿岚", "周知夏", "陆青野", "苏见月", "陈默", "白露"];
const TITLES = [
  "补齐上传失败的重试提示",
  "商品详情页首屏 LCP 优化",
  "订单列表支持按渠道筛选",
  "导出报表加时间范围",
  "修复 iOS 下吸顶错位",
  "结算页地址簿改造",
  "埋点补齐「加入购物车」",
  "优惠券叠加规则梳理",
  "客服工作台拆包",
  "灰度开关接入配置中心",
  "库存超卖兜底方案",
  "对账异常告警",
];

function build(): Task[] {
  const perLane = Math.ceil(TITLES.length / LANES.length);
  return TITLES.map((title, i) => {
    const lane = i % LANES.length;
    return {
      id: `t${i}`,
      title,
      owner: OWNERS[i % OWNERS.length],
      lane,
      height: 74 + (i % 3) * 18,
      tag: ["P0", "P1", "P2"][i % 3],
      order: lane * perLane + Math.floor(i / LANES.length),
    };
  }).sort((a, b) => a.order - b.order);
}

export default function KanbanScenario() {
  const [tasks, setTasks] = useState<Task[]>(build);
  const [lastOp, setLastOp] = useState("拖到另一列试试：卡片会带状态一起搬走");

  const Waterfall = useMemo(() => {
    const move = (from: number, to: number) => {
      setTasks((prev) => {
        if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
          return prev;
        }
        const next = prev.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        // 换列后重排 order：seq·perLane 决定落在哪一列
        return next.map((task, index) => ({
          ...task,
          lane: index % LANES.length,
          order: index,
        }));
      });
      const laneFrom = from % LANES.length;
      const laneTo = to % LANES.length;
      setLastOp(
        laneFrom === laneTo
          ? `同列内调整：第 ${from + 1} → 第 ${to + 1}`
          : `${LANES[laneFrom]} → ${LANES[laneTo]}（第 ${to + 1} 位）`
      );
    };

    return withPlugins<Task>(WaterfallCore, [
      createAlignmentPlugin({ mode: "sequential" }),
      createDragReorderPlugin<Task>({ onReorder: move }),
      createA11yPlugin({ containerLabel: "任务看板", enableTabIndex: false }),
      createGapPlugin({ columnGap: 14, rowGap: 12 }),
      createTransitionPlugin({ duration: 220 }),
    ]);
  }, []);

  const counts = LANES.map((_l, i) => tasks.filter((t) => t.lane === i).length);

  return (
    <div className="scn-widget">
      <div className="scn-lanes">
        {LANES.map((lane, i) => (
          <span key={lane} className="scn-lane">
            {lane}
            <em>{counts[i]}</em>
          </span>
        ))}
      </div>

      <Waterfall
        items={tasks}
        columns={4}
        containerStyle={{ height: 372 }}
        keyExtractor={(item) => item.id}
        renderItem={(item) => (
          <div className="wf-card is-task" style={{ height: item.height }}>
            <span className={`wf-task-tag is-${item.tag.toLowerCase()}`}>{item.tag}</span>
            <p className="wf-task-title">{item.title}</p>
            <p className="wf-task-meta">
              <span className="wf-avatar">{item.owner.slice(0, 1)}</span>
              {item.owner}
            </p>
          </div>
        )}
      />
      <p className="scn-hint">{lastOp}</p>
    </div>
  );
}
