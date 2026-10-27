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

export const createA11yPlugin: PluginCreator<any, A11yPluginConfig> = (
  config = {}
) => {
  const { announceOnFocus = false, keyboardNavigation = true, highContrast = false } = config;

  const plugin: CardPlugin = {
    name: "A11yPlugin",
    version: "1.0.0",
    description: "无障碍增强插件（ARIA与键盘导航）",
    priority: 100,
    hooks: {
      onMount: (context) => {
        const container = context.getContainer();
        if (!container) return;

        const name = (context.data as any)?.name || (context.data as any)?.title || "商品卡片";
        container.setAttribute("role", "article");
        container.setAttribute("aria-label", name);

        if (keyboardNavigation) {
          container.setAttribute("tabindex", "0");
          container.addEventListener("keydown", handleKeyboard);
        }

        if (announceOnFocus) {
          container.addEventListener("focus", () => {
            const msg = `聚焦：${name}`;
            const live = document.getElementById("a11y-live-region") || (() => {
              const el = document.createElement("div");
              el.id = "a11y-live-region";
              el.setAttribute("aria-live", "polite");
              el.style.position = "absolute";
              el.style.left = "-9999px";
              document.body.appendChild(el);
              return el;
            })();
            live.textContent = msg;
          });
        }

        if (highContrast) {
          container.style.outline = "2px solid #000";
          container.style.backgroundColor = "#fff";
          container.style.color = "#000";
        }
      },
      onUnmount: (context) => {
        const container = context.getContainer();
        container?.removeEventListener("keydown", handleKeyboard);
      },
    },
    config,
  };

  return plugin;
};