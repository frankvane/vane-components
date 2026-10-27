/**
 * A11yPlugin - 无障碍增强（ARIA 标注 / 键盘导航 / 聚焦播报 / 高对比）
 *
 * 迁移要点（C3.2）：
 *  - 旧版的 focus 监听是匿名箭头函数，removeEventListener 拿不到引用 → 永不移除，
 *    卡片反复挂载会累积监听；改为具名 handler，随 onMount 返回值统一回收。
 *  - 全局 #a11y-live-region 改为「引用计数」：多张卡共用同一个播报节点，
 *    最后一张卡卸载时才移除，避免先卸载的卡把别人的播报区删掉。
 *  - 清理不再走 onUnmount 钩子（那要在卸载时再查一次 getContainer），
 *    直接在 onMount 里返回，和内核的 cleanup 语义一致。
 */

import type { CardPlugin, PluginCreator } from "../../plugins/types";

export interface A11yPluginConfig {
  announceOnFocus?: boolean;
  keyboardNavigation?: boolean;
  highContrast?: boolean;
}

function handleKeyboard(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  // 简易键盘导航：Enter 触发点击，Space 阻止滚动并触发点击
  if (e.key === "Enter") {
    target.click();
  } else if (e.key === " ") {
    e.preventDefault();
    target.click();
  }
}

// ===== 全局播报区（引用计数）=====

const LIVE_REGION_ID = "a11y-live-region";
let liveRegionUsers = 0;

function acquireLiveRegion(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  let el = document.getElementById(LIVE_REGION_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = LIVE_REGION_ID;
    el.setAttribute("aria-live", "polite");
    el.setAttribute("role", "status");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    el.style.width = "1px";
    el.style.height = "1px";
    el.style.overflow = "hidden";
    document.body.appendChild(el);
  }
  liveRegionUsers += 1;
  return el;
}

function releaseLiveRegion(): void {
  liveRegionUsers = Math.max(0, liveRegionUsers - 1);
  if (liveRegionUsers > 0) return;
  if (typeof document === "undefined") return;
  document.getElementById(LIVE_REGION_ID)?.remove();
}

/** 仅供测试：当前播报区引用计数 */
export function __getLiveRegionUsers(): number {
  return liveRegionUsers;
}

export const createA11yPlugin: PluginCreator<any, A11yPluginConfig> = (
  config = {}
) => {
  const {
    announceOnFocus = false,
    keyboardNavigation = true,
    highContrast = false,
  } = config;

  const plugin: CardPlugin = {
    name: "A11yPlugin",
    version: "1.1.0",
    description: "无障碍增强插件（ARIA与键盘导航）",
    priority: 100,
    hooks: {
      onMount: (context) => {
        const container = context.getContainer();
        if (!container) return;

        const name =
          (context.data as any)?.name || (context.data as any)?.title || "商品卡片";
        container.setAttribute("role", "article");
        container.setAttribute("aria-label", name);

        if (keyboardNavigation) {
          container.setAttribute("tabindex", "0");
          container.addEventListener("keydown", handleKeyboard);
        }

        // 聚焦播报：具名 handler + 播报区引用计数
        let live: HTMLElement | null = null;
        const onFocus = () => {
          if (live) live.textContent = `聚焦：${name}`;
        };
        if (announceOnFocus) {
          live = acquireLiveRegion();
          container.addEventListener("focus", onFocus);
        }

        if (highContrast) {
          container.style.outline = "2px solid #000";
          container.style.backgroundColor = "#fff";
          container.style.color = "#000";
        }

        return () => {
          container.removeEventListener("keydown", handleKeyboard);
          if (announceOnFocus) {
            container.removeEventListener("focus", onFocus);
            releaseLiveRegion();
          }
          container.removeAttribute("tabindex");
          container.removeAttribute("role");
          container.removeAttribute("aria-label");
        };
      },
    },
    config,
  };

  return plugin;
};
