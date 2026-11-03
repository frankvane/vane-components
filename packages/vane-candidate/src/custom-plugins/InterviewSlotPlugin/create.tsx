import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import { Overlay } from "../../components/CandidatePlugin/plugins/overlay";
import { tokens, toolbarBtn } from "../../components/CandidatePlugin/plugins/tokens";
import { FieldGroup } from "./FieldGroup";
import doc from "./doc.json";

export interface InterviewSlotConfig {
  /** 可选面试时间槽（展示文本） */
  slots?: string[];
  /** 可选面试官 */
  interviewers?: string[];
  /** 面试形式 */
  modes?: Array<"onsite" | "video" | "phone">;
}

const MODE_LABEL: Record<string, string> = {
  onsite: "现场",
  video: "视频",
  phone: "电话",
};

/**
 * InterviewSlot —— 面试安排。
 * 卡片操作区「安排面试」入口；浮层内从时间槽 / 面试官 / 形式中选择并保存到
 * candidate.interview。已安排时徽章区（经卡片正文 meta）显示面试信息。
 */
export const createInterviewSlotPlugin: CandidatePluginCreator<InterviewSlotConfig> = (
  config = {}
) => {
  const slots = config.slots ?? ["周二 14:00", "周三 10:00", "周四 16:00", "周五 15:00"];
  const interviewers = config.interviewers ?? ["王工", "李总监"];
  const modes = config.modes ?? ["onsite", "video"];
  return {
    name: "interview-slot",
    version: "0.1.0",
    description: doc.description,
    priority: 40,
    config: { order: 40 },
    hooks: {
      renderCardActions: (ctx, candidate) => {
        const editing = ctx.state.interviewEditingId === candidate.id;
        return (
          <button
            key="interview"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={editing}
            aria-label={`安排 ${candidate.name} 的面试`}
            onClick={() =>
              ctx.setState({
                interviewEditingId: editing ? null : candidate.id,
              })
            }
            style={slotBtn}
          >
            {candidate.interview ? "改期" : "安排面试"}
          </button>
        );
      },
      renderCardBody: (_ctx, candidate) => {
        const itv = candidate.interview;
        if (!itv) return null;
        return (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#8a4a06",
              background: "#fdf1e2",
              borderRadius: 6,
              padding: "4px 8px",
            }}
          >
            📅 面试：{itv.date}
            {itv.mode && ` · ${MODE_LABEL[itv.mode] ?? itv.mode}`}
            {itv.interviewer && ` · ${itv.interviewer}`}
          </div>
        );
      },
      renderOverlay: (ctx) => {
        const id = ctx.state.interviewEditingId as string | null;
        if (!id) return null;
        const candidate = ((ctx.data as Candidate[]) ?? []).find((c) => c.id === id);
        if (!candidate) return null;
        const close = () => ctx.setState({ interviewEditingId: null });
        const save = (patch: Partial<NonNullable<Candidate["interview"]>>) => {
          const base = candidate.interview ?? { date: slots[0] };
          ctx.updateCandidate(id, {
            interview: { ...base, ...patch } as Candidate["interview"],
          });
        };
        return (
          <Overlay
            key="interview-overlay"
            title={`安排面试 · ${candidate.name}`}
            onClose={close}
            width={360}
            zIndex={56}
          >
            <FieldGroup label="时间槽">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={candidate.interview?.date === s}
                  onClick={() => save({ date: s })}
                  style={toolbarBtn(candidate.interview?.date === s)}
                >
                  {s}
                </button>
              ))}
            </FieldGroup>
            <FieldGroup label="面试官">
              {interviewers.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={candidate.interview?.interviewer === p}
                  onClick={() => save({ interviewer: p })}
                  style={toolbarBtn(candidate.interview?.interviewer === p)}
                >
                  {p}
                </button>
              ))}
            </FieldGroup>
            <FieldGroup label="形式">
              {modes.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={candidate.interview?.mode === m}
                  onClick={() => save({ mode: m })}
                  style={toolbarBtn(candidate.interview?.mode === m)}
                >
                  {MODE_LABEL[m] ?? m}
                </button>
              ))}
            </FieldGroup>
            {candidate.interview && (
              <button
                type="button"
                onClick={() => ctx.updateCandidate(id, { interview: undefined })}
                style={{ ...toolbarBtn(false), marginTop: 12 }}
              >
                取消面试安排
              </button>
            )}
          </Overlay>
        );
      },
    },
  };
};

const slotBtn = {
  border: `1px solid ${tokens.lineStrong}`,
  background: tokens.chipBg,
  color: tokens.chipText,
  borderRadius: 6,
  fontSize: 12,
  padding: "2px 8px",
  cursor: "pointer",
};

createInterviewSlotPlugin.meta = doc as PluginDoc;
