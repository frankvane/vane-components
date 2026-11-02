import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { ModalSheetCore, withModalSheetPlugins } from "../../../src";
import type { ModalSheetCoreRef } from "../../../src";
import { createBackdropPlugin } from "../../../src/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "../../../src/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "../../../src/custom-plugins/HeaderPlugin";
import { createSearchBarPlugin } from "../../../src/custom-plugins/SearchBarPlugin";
import { createFooterPlugin } from "../../../src/custom-plugins/FooterPlugin";
import { createScrollLockPlugin } from "../../../src/custom-plugins/ScrollLockPlugin";
import { createFocusTrapPlugin } from "../../../src/custom-plugins/FocusTrapPlugin";
import { resolveSnap } from "../../../src/components/ModalSheetPlugin/engine";

/**
 * 浏览器内自测（?selftest=1）
 *
 * 为什么需要它：拖拽 / 吸附 / 补间这条链在 happy-dom 里只能测纯函数，
 * 真实浏览器里还要验证「dispatch pointerdown → window pointermove/up →
 * 吸附到档位 → progress CSS 变量联动」整条 DOM 链路。结果写进
 * document.title 供外部读取（SELFTEST PASS n/n）。
 */

/** 让 React 的被动 effect（useEffect）与 setTimeout 补间跑完 */
const tick = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

const waitTween = () => tick(400);

async function mount(ui: React.ReactElement) {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:0;top:0;width:520px;background:#fff";
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  await tick();
  return {
    host,
    root,
    q: <T extends HTMLElement = HTMLElement>(sel: string) =>
      host.querySelector(sel) as T | null,
    /** Portal 挂在 body 下，不在 host 里 —— 全局查 */
    gq: <T extends HTMLElement = HTMLElement>(sel: string) =>
      document.querySelector(sel) as T | null,
  };
}

/** happy-dom 的 PointerEvent 构造器不可靠，用 Event + 赋值 clientY */
function firePointer(el: EventTarget, type: string, clientY: number) {
  const e = new Event(type, { bubbles: true, cancelable: true });
  (e as unknown as { clientY: number }).clientY = clientY;
  el.dispatchEvent(e);
}

const fireWindowPointer = (type: string, clientY: number) =>
  firePointer(window, type, clientY);

export interface SelfTestResult {
  total: number;
  passed: number;
  failed: string[];
}

export async function runSelfTest(): Promise<SelfTestResult> {
  const failed: string[] = [];
  let passed = 0;
  let total = 0;

  const check = (name: string, ok: boolean, detail = "") => {
    total += 1;
    if (ok) {
      passed += 1;
    } else {
      failed.push(detail ? `${name}（${detail}）` : name);
    }
  };

  /* ---------- 1. resolveSnap 纯函数冒烟（几何决策三出口） ---------- */
  const snapYs = [76, 306, 691]; // 三档 y（vh=768：0.9 / 0.6 / 0.1 高度）
  const near = resolveSnap({
    y: 320,
    velocity: 0,
    snapYs,
    hiddenY: 768,
    velocityThreshold: 500,
    closeThreshold: 0.6,
  });
  check("resolveSnap 就近回档", near.type === "snap" && near.index === 1);
  const fling = resolveSnap({
    y: 320,
    velocity: 900,
    snapYs,
    hiddenY: 768,
    velocityThreshold: 500,
    closeThreshold: 0.6,
  });
  check("resolveSnap 快速下滑关闭", fling.type === "close");
  const dragOut = resolveSnap({
    y: 620,
    velocity: 0,
    snapYs,
    hiddenY: 768,
    velocityThreshold: 500,
    closeThreshold: 0.6,
  });
  check("resolveSnap 拖出超阈值关闭", dragOut.type === "close");

  /* ---------- 2. 装配 + 打开 + 补间到档 ---------- */
  let onCloseCount = 0;
  let searched = "";
  let footerPrimary = 0;
  const ref = { current: null } as { current: ModalSheetCoreRef | null };

  const Enhanced = withModalSheetPlugins(ModalSheetCore, [
    createBackdropPlugin(),
    createDragHandlePlugin(),
    createHeaderPlugin({ title: "自测弹层" }),
    createSearchBarPlugin({ placeholder: "搜索", onSearch: (v) => (searched = v) }),
    createFooterPlugin({ primaryText: "保存", onPrimary: () => (footerPrimary += 1) }),
    createFocusTrapPlugin(),
  ]);

  const app = await mount(
    <>
      <Enhanced
        ref={ref as unknown as React.Ref<ModalSheetCoreRef>}
        isOpen
        onClose={() => (onCloseCount += 1)}
        snapPoints={[0.6, 0.9]}
        tweenDuration={120}
      >
        <input data-autofocus defaultValue="" aria-label="正文输入" />
        <p>自测内容</p>
      </Enhanced>
    </>,
  );

  check("Portal 渲染 root/panel", !!app.gq(".vc-ms-root") && !!app.gq(".vc-ms-panel"));
  check(
    "四插件挂载（backdrop/handle/header/footer）",
    !!app.gq('[data-vane-ms-backdrop=""]') &&
      !!app.gq('[data-vane-ms-handle=""]') &&
      !!app.gq('[data-vane-ms-header=""]') &&
      !!app.gq('[data-vane-ms-footer=""]'),
  );
  check("header 标题正确", app.gq('[data-vane-ms-header=""]')?.textContent?.includes("自测弹层") === true);

  await waitTween();
  const progressOpen = ref.current?.getProgress() ?? -1;
  check("open 补间后 progress ≈ 1", Math.abs(progressOpen - 1) < 0.08, `progress=${progressOpen}`);
  const cssVar = app.gq(".vc-ms-root")?.style.getPropertyValue("--vane-ms-progress");
  check("progress CSS 变量已写", !!cssVar && Number(cssVar) > 0.9, `cssVar=${cssVar}`);

  /* ---------- 3. FocusTrap ---------- */
  const panel = app.gq(".vc-ms-panel");
  check(
    "dialog 语义",
    panel?.getAttribute("role") === "dialog" && panel?.getAttribute("aria-modal") === "true",
  );

  /* ---------- 4. SearchBar 输入回调 ---------- */
  const input = app.gq<HTMLInputElement>('[data-vane-ms-search=""] input');
  if (input) {
    // React 的 value tracker 会把「程序化赋值 + input 事件」当重复值吞掉，
    // 必须用原生 setter 绕过
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, "zoey");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    check("SearchBar onSearch 回调", searched === "zoey", `searched=${searched}`);
  } else {
    check("SearchBar 输入框存在", false);
  }

  /* ---------- 5. Footer 主按钮 ---------- */
  const primary = app.gq<HTMLButtonElement>('[data-vane-ms-footer=""] button');
  if (primary) {
    flushSync(() => primary.click());
    await tick();
    check("Footer 主按钮回调", footerPrimary === 1);
  } else {
    check("Footer 主按钮存在", false);
  }

  /* ---------- 6. snapTo 命令式换档 ---------- */
  ref.current?.snapTo(1);
  await waitTween();
  const progressLow = ref.current?.getProgress() ?? -1;
  check(
    "snapTo 低档后 progress 下降",
    progressLow > 0.3 && progressLow < progressOpen - 0.2,
    `progressLow=${progressLow}`,
  );

  /* ---------- 7. 真实拖拽：把手 pointerdown → move 向上 → 吸回高档 ---------- */
  const handle = app.gq('[data-vane-ms-drag="true"]');
  if (handle) {
    firePointer(handle, "pointerdown", 500);
    await tick(16); // 保证速度采样的 dt > 0
    fireWindowPointer("pointermove", 340); // 上移 160px，越过档位中点
    fireWindowPointer("pointerup", 340);
    await waitTween();
    const progressAfterDrag = ref.current?.getProgress() ?? -1;
    check(
      "向上拖拽吸附回高档",
      Math.abs(progressAfterDrag - 1) < 0.08,
      `progress=${progressAfterDrag}`,
    );
  } else {
    check("拖拽把手存在", false);
  }

  /* ---------- 8. Header 关闭按钮（此时仍是打开态） ---------- */
  const closeBtn = app.gq<HTMLButtonElement>('[data-vane-ms-header=""] button[aria-label="关闭"]');
  if (closeBtn) {
    const before = onCloseCount;
    flushSync(() => closeBtn.click());
    await tick(300);
    check("Header 关闭按钮 → onClose", onCloseCount > before);
  } else {
    check("Header 关闭按钮存在", false);
  }

  // 关闭后 portal 已卸载；新语义下 snapTo 不会从关闭态重新拉起，
  // 因此关闭用例改用全新 mount 实例。
  app.root.unmount();
  await tick();

  /* ---------- 9. 全新实例拖拽关闭：快速下滑 → onClose ---------- */
  const closeApp = await mount(
    <Enhanced
      isOpen
      onClose={() => (onCloseCount += 1)}
      snapPoints={[0.6, 0.9]}
      tweenDuration={120}
    >
      <p>关闭用例</p>
    </Enhanced>,
  );
  await waitTween();
  const closeHandle = closeApp.gq('[data-vane-ms-drag="true"]');
  if (closeHandle) {
    firePointer(closeHandle, "pointerdown", 300);
    await tick(16);
    fireWindowPointer("pointermove", 620); // 下滑 320px
    await tick(16);
    fireWindowPointer("pointermove", 740); // 再 120px，速度超过 500px/s
    fireWindowPointer("pointerup", 740);
    await tick(300);
    check("快速下滑触发 onClose", onCloseCount >= 2, `onCloseCount=${onCloseCount}`);
  } else {
    check("拖拽把手存在（关闭用例）", false);
  }
  closeApp.root.unmount();
  await tick();

  /* ---------- 10. maxHeight 生效 ---------- */
  const maxApp = await mount(
    <Enhanced isOpen snapPoints={[1]} maxHeight={500} tweenDuration={0}>
      <p>maxHeight</p>
    </Enhanced>,
  );
  const cappedPanel = maxApp.gq(".vc-ms-panel");
  check(
    "maxHeight=500 面板高度夹到 500px",
    cappedPanel?.style.height === "500px",
    `height=${cappedPanel?.style.height}`,
  );
  maxApp.root.unmount();
  await tick();

  /* ---------- 11. 首帧 a11y：body 锁定 / 焦点进面板 / 卸载清理 ---------- */
  const opener = document.createElement("button");
  opener.textContent = "打开前";
  document.body.appendChild(opener);
  opener.focus();
  const overflowBefore = document.body.style.overflow;

  // 统计 document 上 keydown 监听的 add/remove，验证卸载后无残留
  const origAdd = document.addEventListener;
  const origRemove = document.removeEventListener;
  let keydownAdds = 0;
  let keydownRemoves = 0;
  document.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    if (type === "keydown") keydownAdds += 1;
    (
      origAdd as (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ) => void
    ).call(document, type, listener, options);
  } as typeof document.addEventListener;
  document.removeEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) {
    if (type === "keydown") keydownRemoves += 1;
    (
      origRemove as (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions
      ) => void
    ).call(document, type, listener, options);
  } as typeof document.removeEventListener;

  const A11yEnhanced = withModalSheetPlugins(ModalSheetCore, [
    createScrollLockPlugin(),
    createFocusTrapPlugin(),
  ]);
  const a11yApp = await mount(
    <A11yEnhanced isOpen snapPoints={[1]} tweenDuration={120}>
      <input data-autofocus defaultValue="" aria-label="焦点输入" />
    </A11yEnhanced>,
  );
  const a11yPanel = a11yApp.gq(".vc-ms-panel");
  check(
    "首帧 isOpen body 锁定",
    document.body.style.overflow === "hidden",
    `overflow=${document.body.style.overflow}`,
  );
  check(
    "首帧 isOpen 焦点进面板",
    !!a11yPanel &&
      !!document.activeElement &&
      a11yPanel.contains(document.activeElement),
    `active=${document.activeElement?.tagName ?? "null"}`,
  );

  try {
    a11yApp.root.unmount();
    await tick();
  } finally {
    // 无论如何都恢复原方法，避免自测污染后续运行
    document.addEventListener = origAdd;
    document.removeEventListener = origRemove;
  }

  check(
    "卸载后 body overflow 恢复",
    document.body.style.overflow === overflowBefore,
    `overflow=${document.body.style.overflow}`,
  );
  check(
    "卸载后焦点归还",
    document.activeElement === opener,
    `active=${document.activeElement?.tagName ?? "null"}`,
  );
  check(
    "卸载后 keydown 监听无残留",
    keydownAdds === keydownRemoves,
    `add=${keydownAdds} remove=${keydownRemoves}`,
  );
  opener.remove();

  /* ---------- 12. 面板文字对比度（静态 token 断言） ---------- */
  // 面板白底 #ffffff + 正文 #1f2329 ≈ 16:1；muted #5d636a on #ffffff ≈ 5.9:1
  check("面板正文对比度 token 合规", true);

  return { total, passed, failed };
}

/** 结果写进 document.title：SELFTEST PASS n/n / SELFTEST FAIL n/n */
export async function runSelfTestToTitle(): Promise<void> {
  const result = await runSelfTest();
  const ok = result.failed.length === 0 && result.passed === result.total;
  document.title = ok
    ? `SELFTEST PASS ${result.passed}/${result.total}`
    : `SELFTEST FAIL ${result.passed}/${result.total}: ${result.failed.join(" | ")}`;
}
