import type { PluginDoc } from "vane-plugin-core";
import type { ModalSheetPluginCreator } from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface StepFlowPluginConfig {
  /** 各步骤标题（决定总步数） */
  steps: string[];
  /** 起始步骤索引（默认 0） */
  initialStep?: number;
  /** 最后一步点击「完成」时触发 */
  onFinish?: () => void;
}

/**
 * 分步流程：头部步骤指示 + 底部上一步/下一步。
 * 步骤状态是插件闭包本地态，变更后必须 ctx.forceUpdate()（家族铁律）。
 * priority 32（renderHeader）/ 42（renderFooter）。
 */
export const createStepFlowPlugin: ModalSheetPluginCreator<StepFlowPluginConfig> = (
  config = {} as StepFlowPluginConfig
) => {
  const { steps = [], initialStep = 0, onFinish } = config;
  let step = Math.min(Math.max(initialStep, 0), Math.max(steps.length - 1, 0));

  const goTo = (next: number, ctx: { forceUpdate(): void }) => {
    const clamped = Math.min(Math.max(next, 0), steps.length - 1);
    if (clamped === step) return;
    step = clamped;
    ctx.forceUpdate();
  };

  return {
    name: "step-flow",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 32,
    hooks: {
      renderHeader: (_ctx) => {
        const total = steps.length;
        if (total === 0) return null;
        const pct = ((step + 1) / total) * 100;
        return (
          <div
            data-vane-ms-steps=""
            style={{
              padding: "0 16px 10px",
              flexShrink: 0,
              background: "var(--vane-modal-sheet-bg, #ffffff)",
              color: "var(--vane-modal-sheet-ink, #1f2329)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              <span style={{ fontWeight: 500 }}>{steps[step]}</span>
              <span style={{ color: "var(--vane-modal-sheet-muted, #5d636a)" }}>
                {step + 1} / {total}
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 999,
                background: "#e5e7eb",
                overflow: "hidden",
              }}
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={step + 1}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "var(--vane-modal-sheet-primary, #1f2329)",
                  transition: "width 200ms ease",
                }}
              />
            </div>
          </div>
        );
      },
      renderFooter: (ctx) => {
        const isFirst = step === 0;
        const isLast = step === steps.length - 1;
        return (
          <div
            data-vane-ms-step-actions=""
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 16px",
              flexShrink: 0,
              background: "var(--vane-modal-sheet-bg, #ffffff)",
            }}
          >
            <button
              type="button"
              disabled={isFirst}
              onClick={() => goTo(step - 1, ctx)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                border: "1px solid #d0d4d9",
                background: "#f1f3f5",
                color: isFirst ? "#767b80" : "#1f2329",
                fontSize: 15,
                cursor: isFirst ? "default" : "pointer",
              }}
            >
              上一步
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLast) onFinish?.();
                else goTo(step + 1, ctx);
              }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                border: "none",
                background: "var(--vane-modal-sheet-primary, #1f2329)",
                color: "#ffffff",
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              {isLast ? "完成" : "下一步"}
            </button>
          </div>
        );
      },
    },
  };
};

createStepFlowPlugin.meta = doc as PluginDoc;
