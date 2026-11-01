import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface AuditLogConfig {
  /** 每条弹幕的审计回调（审核/落库/风控用）；不修改弹幕流 */
  onLog?: (item: DanmakuData["items"][number], context: DanmakuPluginContext) => void;
  /** 是否同时经 bus 广播 "danmaku:audit"，默认 false */
  emit?: boolean;
}

/**
 * AuditLogPlugin —— 弹幕审计（数据面旁路）。
 * 不增删弹幕：对每条弹幕触发 onLog（审核/风控/落库）回调，可选经 bus 广播
 * "danmaku:audit" 事件。纯旁路，放在流水线末尾（priority 最低的数据面）最合适。
 */
export function createAuditLogPlugin(
  config: AuditLogConfig = {}
): DanmakuPlugin {
  const onLog = config.onLog;
  const emit = config.emit ?? false;
  // transformData 随播放时钟多次执行：按 id 去重，避免同一条弹幕被重复审计/落库
  const seen = new Set<string>();

  return {
    name: "audit-log",
    version: "0.1.0",
    description: doc.description,
    priority: 23,
    enabled: true,
    hooks: {
      transformData: (
        context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        for (const it of data.items) {
          if (seen.has(it.id)) continue;
          seen.add(it.id);
          onLog?.(it, context);
          if (emit) context.bus.emit("danmaku:audit", { item: it });
        }
        return data;
      },
    },
  };
}

createAuditLogPlugin.meta = doc as PluginDoc;
