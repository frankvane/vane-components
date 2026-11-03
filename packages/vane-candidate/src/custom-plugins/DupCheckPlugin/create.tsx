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

/** 计算候选人 key：按所选字段拼接（缺失字段跳过；全空返回 [] 不判重） */
function dupKeys(c: Candidate, fields: Array<"name" | "email" | "phone">): string[] {
  const keys: string[] = [];
  for (const f of fields) {
    const v = (c[f] as string | undefined)?.trim().toLowerCase();
    if (v) keys.push(`${f}:${v}`);
  }
  return keys;
}

/**
 * key → 命中候选人 id 列表的倒排索引（按列表引用 WeakMap 缓存）。
 * 一次 O(N) 构建，逐卡 O(1) 查询，替代每卡全表扫描的 O(N²)。
 */
const dupIndexCache = new WeakMap<Candidate[], Map<string, string[]>>();

function getDupIndex(list: Candidate[], fields: Array<"name" | "email" | "phone">) {
  const cached = dupIndexCache.get(list);
  if (cached) return cached;
  const index = new Map<string, string[]>();
  for (const c of list) {
    for (const k of dupKeys(c, fields)) {
      const ids = index.get(k);
      if (ids) ids.push(c.id);
      else index.set(k, [c.id]);
    }
  }
  dupIndexCache.set(list, index);
  return index;
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
        // 判重必须用管道前的原始数据 ctx.rawData：ctx.data 是 ContactMask 等
        // transform 之后的结果，不同号码掩码碰撞（138****5678）会误报重复。
        const list = ((ctx.rawData as Candidate[] | undefined) ??
          (ctx.data as Candidate[]) ??
          []);
        const myKeys = dupKeys(candidate, fields);
        if (myKeys.length === 0) return null;
        const index = getDupIndex(list, fields);
        const dupIds = new Set<string>();
        for (const k of myKeys) {
          for (const otherId of index.get(k) ?? []) {
            if (otherId !== candidate.id) dupIds.add(otherId);
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
