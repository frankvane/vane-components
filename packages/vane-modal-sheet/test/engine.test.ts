import { describe, expect, it } from "vitest";
import {
  computeProgress,
  createSheetEngine,
  createSheetState,
  resolveMaxHeight,
  resolveSnap,
  resolveSnapPixels,
  type SheetEngineOps,
} from "../src/components/ModalSheetPlugin/engine";

const VH = 800;

/** 标准三档：[0.25, 0.5, 1] → y = [0, 400, 600]，hiddenY = 800 */
const snapYs = resolveSnapPixels([0.25, 0.5, 1], {
  viewportH: VH,
  contentH: 0,
  detent: "default",
});

describe("resolveSnapPixels", () => {
  it("把比例档解析为 translateY（升序，index 0 = 最高档）", () => {
    expect(snapYs).toEqual([0, 400, 600]);
  });

  it("缺省时为单档全高", () => {
    expect(
      resolveSnapPixels(undefined, { viewportH: VH, contentH: 0, detent: "default" })
    ).toEqual([0]);
  });

  it("像素档直接使用", () => {
    expect(
      resolveSnapPixels([300], { viewportH: VH, contentH: 0, detent: "default" })
    ).toEqual([VH - 300]);
  });

  it("乱序输入会被排序", () => {
    expect(
      resolveSnapPixels([1, 0.25, 0.5], { viewportH: VH, contentH: 0, detent: "default" })
    ).toEqual([0, 400, 600]);
  });

  it("detent=content 时最高档夹到内容高", () => {
    expect(
      resolveSnapPixels([1], { viewportH: VH, contentH: 320, detent: "content" })
    ).toEqual([VH - 320]);
  });

  it("detent=full 时最高档为满视口", () => {
    expect(
      resolveSnapPixels([0.5], { viewportH: VH, contentH: 100, detent: "full" })
    ).toEqual([0]);
  });

  it("maxHeight 夹紧每档高度", () => {
    expect(
      resolveSnapPixels([1], {
        viewportH: VH,
        contentH: 0,
        detent: "default",
        maxHeight: 500,
      })
    ).toEqual([VH - 500]);
    expect(
      resolveSnapPixels([0.25, 1], {
        viewportH: VH,
        contentH: 0,
        detent: "default",
        maxHeight: 500,
      })
    ).toEqual([300, 600]);
  });

  it("detent=content 先取内容高，再被 maxHeight 夹紧", () => {
    expect(
      resolveSnapPixels([1], {
        viewportH: VH,
        contentH: 320,
        detent: "content",
        maxHeight: 200,
      })
    ).toEqual([VH - 200]);
  });

  it("maxHeight=Infinity 时行为与不传一致", () => {
    expect(
      resolveSnapPixels([0.5], {
        viewportH: VH,
        contentH: 0,
        detent: "default",
        maxHeight: Infinity,
      })
    ).toEqual([400]);
  });
});

describe("resolveSnapPixels · 四向抽伸", () => {
  it("bottom：关闭行程 = 视口尺寸", () => {
    expect(
      resolveSnapPixels([300], {
        viewportH: VH,
        contentH: 0,
        detent: "default",
        placement: "bottom",
      })
    ).toEqual([VH - 300]);
  });

  it("top / left / right：贴边锚定，关闭行程 = 面板自身尺寸（最高档 y = 0）", () => {
    for (const placement of ["top", "left", "right"] as const) {
      expect(
        resolveSnapPixels([300], {
          viewportH: VH,
          contentH: 0,
          detent: "default",
          maxHeight: Infinity,
          placement,
        })
      ).toEqual([0]);
    }
  });

  it("多档按面板最大尺寸折算且仍升序", () => {
    for (const placement of ["top", "left", "right"] as const) {
      expect(
        resolveSnapPixels([0.25, 0.5, 1], {
          viewportH: VH,
          contentH: 0,
          detent: "default",
          maxHeight: Infinity,
          placement,
        })
      ).toEqual([0, 400, 600]);
    }
  });

  it("横向方位 maxHeight 不夹主尺寸（由调用方传 Infinity）", () => {
    expect(
      resolveSnapPixels([0.5], {
        viewportH: 400,
        contentH: 0,
        detent: "default",
        maxHeight: Infinity,
        placement: "left",
      })
    ).toEqual([0]);
  });
});

describe("resolveMaxHeight", () => {
  it("undefined / null → 无上限", () => {
    expect(resolveMaxHeight(undefined, VH)).toBe(Infinity);
    expect(resolveMaxHeight(null as unknown as undefined, VH)).toBe(Infinity);
  });

  it("正数按 px 使用；<=0 或无上限", () => {
    expect(resolveMaxHeight(480, VH)).toBe(480);
    expect(resolveMaxHeight(0, VH)).toBe(Infinity);
    expect(resolveMaxHeight(-12, VH)).toBe(Infinity);
  });

  it("vh / % 按视口高折算", () => {
    expect(resolveMaxHeight("72vh", VH)).toBe(576);
    expect(resolveMaxHeight("80%", VH)).toBe(640);
    expect(resolveMaxHeight("100vh", VH)).toBe(VH);
  });

  it("px 与纯数字串", () => {
    expect(resolveMaxHeight("480px", VH)).toBe(480);
    expect(resolveMaxHeight("480", VH)).toBe(480);
    expect(resolveMaxHeight(" 480PX ", VH)).toBe(480);
  });

  it("非法 / NaN / <=0 → 无上限", () => {
    expect(resolveMaxHeight("", VH)).toBe(Infinity);
    expect(resolveMaxHeight("abc", VH)).toBe(Infinity);
    expect(resolveMaxHeight("72vw", VH)).toBe(Infinity);
    expect(resolveMaxHeight("0px", VH)).toBe(Infinity);
    expect(resolveMaxHeight("-5vh", VH)).toBe(Infinity);
  });

  it("viewportH=0 时 vh/% 折算为 0，回退无上限", () => {
    expect(resolveMaxHeight("72vh", 0)).toBe(Infinity);
    expect(resolveMaxHeight("80%", 0)).toBe(Infinity);
  });
});

describe("resolveSnap", () => {
  const base = {
    snapYs,
    hiddenY: VH,
    velocityThreshold: 500,
    closeThreshold: 0.6,
  };

  it("稳态最近档：中位附近吸附中间档", () => {
    expect(resolveSnap({ ...base, y: 380, velocity: 0 })).toEqual({
      type: "snap",
      index: 1,
    });
  });

  it("快速下滑直接关闭（速度超阈值）", () => {
    expect(resolveSnap({ ...base, y: 100, velocity: 600 })).toEqual({
      type: "close",
    });
  });

  it("上抛速度不触发关闭，走最近档", () => {
    expect(resolveSnap({ ...base, y: 300, velocity: -800 })).toEqual({
      type: "snap",
      index: 1,
    });
  });

  it("拖出比例超阈值关闭：从最低档（y=600）拖过 60% 距离", () => {
    // range = 800 - 0 = 800；600 > 0 + 800*0.6 = 480 → close
    expect(resolveSnap({ ...base, y: 500, velocity: 0 })).toEqual({
      type: "close",
    });
  });

  it("拖出未超阈值时回最近档", () => {
    expect(resolveSnap({ ...base, y: 470, velocity: 0 })).toEqual({
      type: "snap",
      index: 1,
    });
  });

  it("速度阈值优先于比例阈值", () => {
    // y=100（未超比例）但速度超阈值 → close
    expect(resolveSnap({ ...base, y: 100, velocity: 500 })).toEqual({
      type: "close",
    });
  });

  it("空档位列表直接关闭", () => {
    expect(resolveSnap({ ...base, snapYs: [], y: 0, velocity: 0 })).toEqual({
      type: "close",
    });
  });

  it("轻扫 5px（速度超阈值）不关闭：速度关闭需满足最小位移", () => {
    expect(
      resolveSnap({ ...base, y: snapYs[0] + 5, velocity: 900, minCloseDistance: 8 })
    ).toEqual({ type: "snap", index: 0 });
  });

  it("位移达到最小关闭距离后速度关闭仍生效", () => {
    expect(
      resolveSnap({ ...base, y: snapYs[0] + 8, velocity: 900, minCloseDistance: 8 })
    ).toEqual({ type: "close" });
  });
});

describe("computeProgress", () => {
  const s = { hiddenY: VH, snapYs };

  it("完全展开 = 1", () => {
    expect(computeProgress({ ...s, y: 0 })).toBe(1);
  });

  it("完全关闭 = 0", () => {
    expect(computeProgress({ ...s, y: VH })).toBe(0);
  });

  it("中间档 = 比例值", () => {
    expect(computeProgress({ ...s, y: 400 })).toBeCloseTo(0.5);
  });

  it("越界钳制", () => {
    expect(computeProgress({ ...s, y: -50 })).toBe(1);
    expect(computeProgress({ ...s, y: VH + 50 })).toBe(0);
  });
});

// ---------- B3-1 引擎状态机与 timer ----------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createOps(overrides: Partial<SheetEngineOps> = {}) {
  const state = createSheetState();
  const root = document.createElement("div");
  const panel = document.createElement("div");
  const content = document.createElement("div");
  const calls = {
    open: 0,
    snap: [] as number[],
    close: [] as (boolean | undefined)[],
  };
  const ops: SheetEngineOps = {
    state,
    getRoot: () => root,
    getPanel: () => panel,
    getContent: () => content,
    getSnapPoints: () => [0.5],
    getDetent: () => "default",
    getMaxHeight: () => Infinity,
    getInitialSnap: () => 0,
    getTweenDuration: () => 120,
    getPrefersReducedMotion: () => false,
    getVelocityThreshold: () => 500,
    getCloseThreshold: () => 0.6,
    onSnap: (index) => calls.snap.push(index),
    onOpen: () => {
      calls.open += 1;
    },
    onClose: (fromExternal) => calls.close.push(fromExternal),
    ...overrides,
  };
  return { state, ops, calls };
}

describe("createSheetEngine 状态机", () => {
  it("打开补间中 close 立即进入 closing，且不再回调 onOpen", async () => {
    const { state, ops, calls } = createOps();
    const engine = createSheetEngine(ops);

    engine.open();
    expect(state.phase).toBe("opening");
    engine.close(true);
    expect(state.phase).toBe("closing");

    await sleep(200);
    expect(state.phase).toBe("closed");
    expect(calls.open).toBe(0);
    expect(calls.close).toEqual([true]);

    // 关闭态 snapTo 是 no-op，不把已关闭面板拉回
    engine.snapTo(0);
    expect(state.phase).toBe("closed");
    expect(state.y).toBe(state.hiddenY);
    engine.destroy();
  });

  it("closing 中 handlePointerDown 无效", async () => {
    const { state, ops } = createOps();
    const engine = createSheetEngine(ops);

    engine.open();
    engine.close();
    expect(state.phase).toBe("closing");

    engine.handlePointerDown({ clientY: 100 });
    expect(state.phase).toBe("closing");

    await sleep(200);
    expect(state.phase).toBe("closed");
    engine.destroy();
  });

  it("destroy 后计时器到达不再触发 onOpen / onClose", async () => {
    const { ops, calls } = createOps();
    const engine = createSheetEngine(ops);

    engine.open();
    engine.destroy();

    await sleep(200);
    expect(calls.open).toBe(0);
    expect(calls.close).toHaveLength(0);
  });

  it("open 补间正常结束进入 open", async () => {
    const { state, ops, calls } = createOps();
    const engine = createSheetEngine(ops);

    engine.open();
    await sleep(200);
    expect(state.phase).toBe("open");
    expect(calls.open).toBe(1);
    expect(calls.snap).toEqual([0]);
    engine.destroy();
  });
});

describe("createSheetEngine 四向抽伸拖拽", () => {
  /** happy-dom 的 MouseEvent 坐标不一定可写，显式定义保证事件带上坐标 */
  function pointerMove(clientX: number, clientY: number) {
    const event = new MouseEvent("pointermove");
    Object.defineProperty(event, "clientX", { value: clientX });
    Object.defineProperty(event, "clientY", { value: clientY });
    window.dispatchEvent(event);
  }

  async function openEngine(
    placement: "bottom" | "top" | "left" | "right",
    snapPoints: number[] = [0.5]
  ) {
    const { state, ops, calls } = createOps({
      getPlacement: () => placement,
      getSnapPoints: () => snapPoints,
    });
    const engine = createSheetEngine(ops);
    engine.open();
    await sleep(200);
    return { state, engine, calls };
  }

  it("bottom：向下拖 100px → 关闭方向位移 +100", async () => {
    const { state, engine } = await openEngine("bottom");
    const y0 = state.y;
    // happy-dom 默认视口：hidden = innerHeight，0.5 档 → innerHeight / 2
    expect(y0).toBe(window.innerHeight / 2);
    engine.handlePointerDown({ clientY: 100 });
    pointerMove(0, 200);
    expect(state.y).toBe(y0 + 100);
    engine.destroy();
  });

  it("top：向上拖 100px → 关闭方向位移 +100（关闭行程 = 面板高）", async () => {
    const { state, engine } = await openEngine("top");
    expect(state.y).toBe(0);
    expect(state.hiddenY).toBe(window.innerHeight / 2);
    engine.handlePointerDown({ clientY: 600 });
    pointerMove(0, 500);
    expect(state.y).toBe(100);
    engine.destroy();
  });

  it("left：向左拖 100px → 关闭方向位移 +100（关闭行程 = 面板宽）", async () => {
    const { state, engine } = await openEngine("left");
    expect(state.y).toBe(0);
    expect(state.viewportH).toBe(window.innerWidth);
    expect(state.hiddenY).toBe(window.innerWidth / 2);
    engine.handlePointerDown({ clientX: 600 });
    pointerMove(500, 0);
    expect(state.y).toBe(100);
    engine.destroy();
  });

  it("right：沿视口宽测量，贴右时完全展开，向右拖 100px → 关闭方向位移 +100", async () => {
    const { state, engine } = await openEngine("right");
    expect(state.viewportH).toBe(window.innerWidth);
    // 右侧贴边锚定：完全展开的 transform 为 0，关闭行程 = 面板宽
    expect(state.y).toBe(0);
    expect(state.hiddenY).toBe(window.innerWidth / 2);
    engine.handlePointerDown({ clientX: 100 });
    pointerMove(200, 0);
    expect(state.y).toBe(100);
    engine.destroy();
  });

  it("拖拽位移按轴投影：top 竖直拖动里的横向位移不影响 y", async () => {
    const { state, engine } = await openEngine("top");
    engine.handlePointerDown({ clientX: 100, clientY: 600 });
    pointerMove(400, 500);
    expect(state.y).toBe(100);
    engine.destroy();
  });
});
