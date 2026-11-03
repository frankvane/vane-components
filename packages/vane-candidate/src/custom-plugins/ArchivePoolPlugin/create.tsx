import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import { Overlay } from "../../components/CandidatePlugin/plugins/overlay";
import { tokens, toolbarBtn } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface ArchivePoolConfig {
  /** 人才库浮层每页条数上限 */
  poolPageSize?: number;
}

/**
 * ArchivePool —— 人才库归档池。
 * transformData 把 archived 候选人从主看板滤除；工具栏「人才库」按钮（带计数）
 * 打开浮层，支持恢复（archived:false）与彻底流转查看。归档入口在批量操作与
 * 卡片右键场景之外，这里额外提供卡片操作区「归档」按钮。
 */
export const createArchivePoolPlugin: CandidatePluginCreator<ArchivePoolConfig> = (
  config = {}
) => {
  const poolPageSize = config.poolPageSize ?? 0;
  return {
    name: "archive-pool",
    version: "0.1.0",
    description: doc.description,
    priority: 50,
    config: { order: 50 },
    hooks: {
      transformData: (_ctx, data) => {
        return (((data as Candidate[]) ?? []).filter((c) => !c.archived)) as typeof data;
      },
      renderToolbar: (ctx) => {
        // 人才库统计必须用全量内部数据 ctx.rawData（transformData 管道之前、
        // 含 archived），不能用 ctx.data（管道后、archived 已滤除），也不能用
        // ctx.props.data（非受控模式下是宿主初始引用，归档后不更新）。
        const raw = ((ctx.rawData as Candidate[] | undefined) ??
          (ctx.props?.data as Candidate[] | undefined)) ?? [];
        const archivedCount = raw.filter((c) => c.archived).length;
        const open = !!ctx.state.archivePoolOpen;
        return (
          <button
            key="archive-pool"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => ctx.setState({ archivePoolOpen: !open })}
            style={toolbarBtn(open)}
          >
            人才库（{archivedCount}）
          </button>
        );
      },
      renderOverlay: (ctx) => {
        if (!ctx.state.archivePoolOpen) return null;
        const raw = ((ctx.rawData as Candidate[] | undefined) ??
          (ctx.props?.data as Candidate[] | undefined)) ?? [];
        const archived = raw.filter((c) => c.archived);
        const list = poolPageSize > 0 ? archived.slice(0, poolPageSize) : archived;
        const close = () => ctx.setState({ archivePoolOpen: false });
        return (
          <Overlay key="archive-pool-overlay" title={`人才库（${archived.length}）`} onClose={close} width={420} zIndex={56}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {list.length === 0 && (
                <span style={{ color: tokens.muted, fontSize: 13 }}>人才库为空：在卡片或批量操作里归档候选人后会出现在这里。</span>
              )}
              {list.map((c) => (
                <div
                  key={c.id}
                  data-candidate-id={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: tokens.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <strong>{c.name}</strong>
                    <span style={{ color: tokens.muted }}> · {c.role}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`恢复 ${c.name} 到看板`}
                    onClick={() => ctx.updateCandidate(c.id, { archived: false })}
                    style={toolbarBtn(true)}
                  >
                    恢复
                  </button>
                </div>
              ))}
            </div>
          </Overlay>
        );
      },
      renderCardActions: (ctx, candidate) => (
        <button
          key="archive"
          type="button"
          aria-label={`归档 ${candidate.name} 到人才库`}
          onClick={() => ctx.updateCandidate(candidate.id, { archived: true })}
          style={poolBtn}
        >
          归档
        </button>
      ),
    },
  };
};

const poolBtn = {
  border: `1px solid ${tokens.lineStrong}`,
  background: tokens.chipBg,
  color: tokens.chipText,
  borderRadius: 6,
  fontSize: 12,
  padding: "2px 8px",
  cursor: "pointer",
};

createArchivePoolPlugin.meta = doc as PluginDoc;
