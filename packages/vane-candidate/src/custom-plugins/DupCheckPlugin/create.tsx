import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import doc from "./doc.json";

export interface DupCheckConfig {
  /** 参与判重的字段（候选人为空的字段跳过） */
  fields?: Array<"name" | "email" | "phone">;
}

/** 计算候选人 key：按所选字段拼接（缺失字段跳过；全空返回 null 不判重） */
function dupKeys(c: Candidate, fields: Array<"name" | "email" | "phone">): string[] {
  const keys: string[] = [];
  for (const f of fields) {
    const v = (c[f] as string | undefined)?.trim().toLowerCase();
    if (v) keys.push(`${f}:${v}`);
  }
  return keys;
}

/**
 * DupCheck —— 重复候选人检测。
 * 用 signature map 扫描列表中同名 / 同邮箱 / 同手机号的候选人，
 * 命中者在卡片徽章区显示「疑似重复」警示（黄色底，防误导为错误）。
 */
export const createDupCheckPlugin: CandidatePluginCreator<DupCheckConfig> = (
  config = {}
) => {
  const fields = config.fields ?? ["name", "email", "phone"];
  return {
    name: "dup-check",
    version: "0.1.0",
    description: doc.description,
    priority: 20,
    config: { order: 20 },
    hooks: {
      renderCardBadges: (ctx, candidate) => {
        const list = (ctx.data as Candidate[]) ?? [];
        const myKeys = dupKeys(candidate, fields);
        if (myKeys.length === 0) return null;
        const dupIds = new Set<string>();
        for (const other of list) {
          if (other.id === candidate.id) continue;
          if (dupKeys(other, fields).some((k) => myKeys.includes(k))) {
            dupIds.add(other.id);
          }
        }
        if (dupIds.size === 0) return null;
        return (
          <span
            key="dup-check"
            title={`与另外 ${dupIds.size} 位候选人疑似重复`}
            aria-label={`疑似重复：另有 ${dupIds.size} 位`}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#8a4a06",
              background: "#fdf1e2",
              border: "1px solid #ecd3ae",
              borderRadius: 999,
              padding: "0 8px",
              lineHeight: "18px",
            }}
          >
            疑似重复
          </span>
        );
      },
    },
  };
};

createDupCheckPlugin.meta = doc as PluginDoc;
