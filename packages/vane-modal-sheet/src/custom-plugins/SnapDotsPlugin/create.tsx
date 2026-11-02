import type { PluginDoc } from "vane-plugin-core";
import type { ModalSheetPluginCreator } from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface SnapDotsPluginConfig {
  /** 激活档颜色 */
  activeColor?: string;
  /** 非激活档颜色 */
  inactiveColor?: string;
}

/**
 * 吸附档位指示点：当前档高亮，点击即 snapTo(i)。
 * 时基值走 getter + onSnap 里 forceUpdate（家族铁律：钩子改状态必须触发宿主重渲）。
 * priority 24（renderHandle 槽，与 DragHandle 共存）。
 */
export const createSnapDotsPlugin: ModalSheetPluginCreator<SnapDotsPluginConfig> = (
  config = {}
) => {
  const { activeColor, inactiveColor } = config;

  return {
    name: "snap-dots",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 24,
    hooks: {
      // 档位变化 → 触发宿主重渲，renderHandle 里 getter 才能读到最新 currentSnap
      onSnap: (ctx) => {
        ctx.forceUpdate();
      },
      renderHandle: (ctx) => {
        const count = ctx.snapCount;
        if (count < 2) return null;
        const current = ctx.currentSnap;
        const drag = ctx.getDragProps();
        return (
          <div
            {...drag}
            data-vane-ms-snap-dots=""
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              padding: "6px 0 2px",
              flexShrink: 0,
              background: "var(--vane-modal-sheet-bg, #ffffff)",
              color: "var(--vane-modal-sheet-ink, #1f2329)",
            }}
          >
            {Array.from({ length: count }, (_, i) => {
              const active = i === current;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`吸附到第 ${i + 1} 档`}
                  aria-current={active ? "true" : undefined}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => ctx.snapTo(i)}
                  style={{
                    width: active ? 16 : 8,
                    height: 8,
                    borderRadius: 999,
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    background: active
                      ? (activeColor ?? "var(--vane-modal-sheet-dot-active, #1f2329)")
                      : (inactiveColor ?? "var(--vane-modal-sheet-dot, #7c8288)"),
                    transition: "width 200ms ease",
                  }}
                />
              );
            })}
          </div>
        );
      },
    },
  };
};

createSnapDotsPlugin.meta = doc as PluginDoc;
