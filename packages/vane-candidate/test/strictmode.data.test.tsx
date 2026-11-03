/**
 * 数据链回归测试（针对组件分析报告 tasks/67 的 M1/M2/M3/M4）：
 *  - StrictMode 下每次数据变更只触发一次 onDataChange（副作用已移出 setState updater）
 *  - 不存在的 id 不触发回调（M2）
 *  - 批量接口单次聚合回调（M3）
 *  - moveCandidateTo 目标阶段直给（M4）
 */
import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { withCandidatePlugins } from "../src/components/CandidatePlugin/withPlugins";
import CandidateCore from "../src/components/CandidatePlugin/CandidateCore";
import type {
  Candidate,
  CandidatePlugin,
} from "../src/components/CandidatePlugin/plugins/types";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeData(): Candidate[] {
  return [
    { id: "a", name: "甲", role: "前端", stage: "applied" },
    { id: "b", name: "乙", role: "后端", stage: "screening" },
  ];
}

const starPlugin: CandidatePlugin = {
  name: "probe-star",
  version: "0.0.0",
  hooks: {
    renderCardActions: (ctx, candidate) => (
      <button
        key="probe"
        data-probe={candidate.id}
        onClick={() => ctx.updateCandidate(candidate.id, { starred: true })}
      >
        star
      </button>
    ),
  },
};

const batchPlugin: CandidatePlugin = {
  name: "probe-batch",
  version: "0.0.0",
  hooks: {
    renderToolbar: (ctx) => (
      <button
        key="probe-batch"
        onClick={() =>
          ctx.updateCandidates([
            { id: "a", patch: { starred: true } },
            { id: "b", patch: { starred: true } },
            { id: "ghost", patch: { starred: true } }, // 不存在的 id 应被忽略
          ])
        }
      >
        batch
      </button>
    ),
  },
};

const moveToPlugin: CandidatePlugin = {
  name: "probe-move-to",
  version: "0.0.0",
  hooks: {
    renderToolbar: (ctx) => (
      <button
        key="probe-move"
        onClick={() => ctx.moveCandidateTo("a", "offer")}
      >
        move
      </button>
    ),
  },
};

function findButton(container: HTMLElement, selector: string): HTMLButtonElement {
  const btn = container.querySelector<HTMLButtonElement>(selector);
  if (!btn) throw new Error(`button not found: ${selector}`);
  return btn;
}

async function click(container: HTMLElement, selector: string) {
  await act(async () => {
    findButton(container, selector).dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );
  });
}

function setup(
  plugins: CandidatePlugin[],
  onDataChange: (list: Candidate[]) => void
) {
  const Enhanced = withCandidatePlugins(CandidateCore, plugins);
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  void act(() => {
    root.render(
      <StrictMode>
        <Enhanced data={makeData()} onDataChange={onDataChange} />
      </StrictMode>
    );
  });
  return {
    container,
    cleanup: () => {
      void act(() => root.unmount());
      container.remove();
    },
  };
}

describe("withCandidatePlugins 数据链（StrictMode）", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it("单条更新只触发一次 onDataChange，且状态生效", async () => {
    let changes = 0;
    const { container, cleanup } = setup([starPlugin], () => {
      changes += 1;
    });
    cleanups.push(cleanup);
    await click(container, 'button[data-probe="a"]');
    expect(changes).toBe(1);
    expect(
      container.querySelector<HTMLElement>('[data-candidate-id="a"] [data-probe="a"]')
    ).toBeTruthy();
  });

  it("批量更新聚合为一次回调，不存在的 id 被忽略", async () => {
    let changes = 0;
    let lastList: Candidate[] = [];
    const { container, cleanup } = setup([batchPlugin], (list) => {
      changes += 1;
      lastList = list;
    });
    cleanups.push(cleanup);
    await click(container, "button");
    // 只有一个 toolbar 按钮，直接命中
    expect(changes).toBe(1);
    expect(lastList.find((c) => c.id === "a")?.starred).toBe(true);
    expect(lastList.find((c) => c.id === "b")?.starred).toBe(true);
    expect(lastList).toHaveLength(2); // ghost 未混入
  });

  it("moveCandidateTo 直达目标阶段并追加 history", async () => {
    let changes = 0;
    let lastList: Candidate[] = [];
    const { container, cleanup } = setup([moveToPlugin], (list) => {
      changes += 1;
      lastList = list;
    });
    cleanups.push(cleanup);
    await click(container, "button");
    expect(changes).toBe(1);
    const moved = lastList.find((c) => c.id === "a");
    expect(moved?.stage).toBe("offer");
    expect(moved?.history?.[0]?.action).toBe("阶段流转");
    expect(moved?.history?.[0]?.detail).toBe("offer");
  });
});
