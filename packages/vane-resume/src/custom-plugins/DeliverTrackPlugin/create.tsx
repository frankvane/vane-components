import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import { Overlay } from "../../components/ResumePlugin/plugins/overlay";
import doc from "./doc.json";

export type DeliverStatus = "投递" | "面试" | "offer" | "拒绝";
export interface Delivery {
  id: string;
  company: string;
  role?: string;
  date: string;
  status: DeliverStatus;
}
export interface DeliverTrackConfig {
  initial?: Delivery[];
  onChange?: (list: Delivery[]) => void;
}

const STATUS_COLOR: Record<DeliverStatus, string> = {
  投递: "#2f6feb",
  面试: "#e8590c",
  offer: "#1f9d55",
  拒绝: "#8a9099",
};

export const createDeliverTrackPlugin: ResumePluginCreator<DeliverTrackConfig> = (config = {}) => {
  const init = config.initial ?? [];
  /** 列表真源放在 shared：bus 回调跨渲染存活，不能依赖会被替换的 ctx.state 快照 */
  const LIST_KEY = "deliver:list";
  const readList = (ctx: ResumePluginContext<ResumeData>): Delivery[] =>
    (ctx.shared.get(LIST_KEY) as Delivery[] | undefined) ??
    (ctx.state.deliveries as Delivery[] | undefined) ??
    [];
  const writeList = (ctx: ResumePluginContext<ResumeData>, next: Delivery[]) => {
    ctx.shared.set(LIST_KEY, next);
    ctx.setState({ deliveries: next });
  };

  return {
    name: "deliver-track",
    version: "0.1.0",
    description: doc.description,
    priority: 36,
    config: { order: 36 },
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (!ctx.state.deliveries) {
          ctx.setState({ deliveries: init, deliverOpen: false, deliverCompany: "", deliverStatus: "投递" as DeliverStatus });
        }
        ctx.shared.set(LIST_KEY, readList(ctx));
        // 返回清理函数：插件集合变化 / 卸载时由 PluginManager 逆序执行，避免监听泄漏
        return ctx.bus.on("resume:deliver:add", (item: Delivery) => {
          const list = readList(ctx);
          const next = [...list, { ...item, id: item.id || `d${Date.now()}`, date: item.date || new Date().toISOString().slice(0, 10) }];
          writeList(ctx, next);
          config.onChange?.(next);
        });
      },
      renderFooter: (ctx) => {
        const list = (ctx.state.deliveries as Delivery[]) || [];
        const counts = list.reduce<Record<string, number>>((acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        }, {});
        return (
          <button
            key="deliver-foot"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={!!ctx.state.deliverOpen}
            onClick={() => ctx.setState({ deliverOpen: !ctx.state.deliverOpen })}
            style={{
              display: "inline-flex",
              gap: 6,
              fontSize: 12,
              cursor: "pointer",
              background: "transparent",
              border: "none",
              padding: 0,
              font: "inherit",
            }}
          >
            <span style={{ color: "var(--vr-muted, #5d636a)" }}>投递：</span>
            {(Object.keys(STATUS_COLOR) as DeliverStatus[]).map((s) => (
              <span key={s} style={{ color: STATUS_COLOR[s], fontWeight: 600 }}>
                {s} {counts[s] || 0}
              </span>
            ))}
          </button>
        );
      },
      renderOverlay: (ctx) => {
        if (!ctx.state.deliverOpen) return null;
        const list = (ctx.state.deliveries as Delivery[]) || [];
        const company = (ctx.state.deliverCompany as string) || "";
        const status = (ctx.state.deliverStatus as DeliverStatus) || "投递";
        const close = () => ctx.setState({ deliverOpen: false });
        const add = () => {
          if (!company.trim()) return;
          const next = [...list, { id: `d${Date.now()}`, company: company.trim(), status, date: new Date().toISOString().slice(0, 10) }];
          writeList(ctx, next);
          ctx.setState({ deliverCompany: "" });
          config.onChange?.(next);
        };
        return (
          <Overlay key="deliver-overlay" title="投递追踪" onClose={close} width={420} zIndex={56} align="end">
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input
                  value={company}
                  placeholder="公司 / 岗位"
                  onChange={(e) => ctx.setState({ deliverCompany: e.target.value })}
                  style={{ flex: 1, padding: 6, borderRadius: 6, border: "1px solid #d4d8de" }}
                />
                <select
                  value={status}
                  onChange={(e) => ctx.setState({ deliverStatus: e.target.value as DeliverStatus })}
                  style={{ padding: 6, borderRadius: 6, border: "1px solid #d4d8de" }}
                >
                  {(Object.keys(STATUS_COLOR) as DeliverStatus[]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button type="button" onClick={add} style={toolbarBtn(true)}>添加</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflow: "auto" }}>
                {list.length === 0 && <div style={{ color: "#8a9099", fontSize: 12 }}>暂无投递记录</div>}
                {list.map((d) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, borderBottom: "1px solid #eee", paddingBottom: 6 }}>
                    <span style={{ flex: 1 }}>{d.company}{d.role ? ` · ${d.role}` : ""}</span>
                    <span style={{ color: STATUS_COLOR[d.status], fontWeight: 600 }}>{d.status}</span>
                    <span style={{ color: "#8a9099", fontSize: 11 }}>{d.date}</span>
                  </div>
                ))}
              </div>
          </Overlay>
        );
      },
    },
  };
};

createDeliverTrackPlugin.meta = doc as PluginDoc;
