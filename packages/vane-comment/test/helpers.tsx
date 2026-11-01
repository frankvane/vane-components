import React from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";

/** 让微任务 / 渲染回调跑完（与 demo 自测同一手法） */
export const tick = () => new Promise<void>((r) => setTimeout(r, 0));

export interface Mounted {
  host: HTMLDivElement;
  root: Root;
  /** querySelector（返回 HTMLElement） */
  q: (sel: string) => HTMLElement | null;
  /** querySelectorAll（返回数组） */
  qa: (sel: string) => HTMLElement[];
  /** 同步点击并等待一次 tick */
  click: (sel: string) => Promise<void>;
  /** 同一 root 上重新渲染（模拟消费方 props 更新） */
  render: (ui: React.ReactElement) => void;
  /** 卸载并移除宿主节点 */
  unmount: () => void;
}

function build(host: HTMLDivElement, root: Root): Mounted {
  const q = (sel: string) => host.querySelector(sel) as HTMLElement | null;
  const qa = (sel: string) =>
    Array.from(host.querySelectorAll<HTMLElement>(sel));
  return {
    host,
    root,
    q,
    qa,
    click: async (sel: string) => {
      const el = q(sel);
      if (!el) throw new Error(`找不到元素 ${sel}`);
      flushSync(() => el.click());
      await tick();
    },
    render: (ui: React.ReactElement) => {
      flushSync(() => root.render(ui));
    },
    unmount: () => {
      flushSync(() => root.unmount());
      host.remove();
    },
  };
}

/** 挂载 + 等待一轮微任务（常规用例） */
export async function mount(ui: React.ReactElement): Promise<Mounted> {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  const mounted = build(host, root);
  await tick();
  return mounted;
}

/**
 * 只做同步挂载（不等待定时器）：给「假时钟」用例使用，
 * 否则 tick() 里的 setTimeout 在假时钟下永远不会 resolve。
 */
export function mountSync(ui: React.ReactElement): Mounted {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  const mounted = build(host, root);
  // 再冲一次，让挂载期的被动副作用（定时器注册 / 清理登记）落地
  flushSync(() => {
    /* noop */
  });
  return mounted;
}

/** 给受控 textarea / input 赋值并派发 input 事件（触发 React onChange） */
export function typeInto(
  el: HTMLTextAreaElement | HTMLInputElement,
  value: string
): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** 用 dataURL 无关的最小文件对象；happy-dom 支持 File 构造 */
export function fileOf(name: string, type: string, bytes = 1): File {
  return new File([new Uint8Array(bytes)], name, { type });
}
