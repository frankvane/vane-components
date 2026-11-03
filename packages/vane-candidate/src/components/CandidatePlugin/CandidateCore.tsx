import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  Candidate,
  CandidateCoreProps,
  CandidateCoreRef,
  StageConfig,
} from "./plugins/types";
import { DEFAULT_STAGES } from "./plugins/types";
import {
  useCandidateCardSlot,
  useCandidateColumnSlot,
  useCandidateContentSlot,
  useCandidateContext,
  useCandidateSlot,
} from "./plugins/slots";
import { TONE_COLOR, tokens } from "./plugins/tokens";

/**
 * CandidateCore - 候选人流水线核心组件（看板骨架）。
 * 铁律：核心只做「看板布局 + 卡片骨架 + 生命周期转发」，所有可变能力交给插件。
 *  - 工具栏 / 页脚 / 列头 / 卡片徽章 / 卡片操作：装饰累积槽（多插件拼接）
 *  - renderCards / renderCardBody：内容覆盖槽（插件优先，否则核心默认）
 *  - 阶段流转数据由装配层（withCandidatePlugins）经 bus 落内部态，核心只读。
 */
const CandidateCore = forwardRef<CandidateCoreRef, CandidateCoreProps>(
  function CandidateCore(props, ref) {
    const {
      children,
      containerClassName,
      containerStyle,
      onMount,
      onUnmount,
      containerRefExternal,
    } = props;

    const localRef = useRef<HTMLDivElement | null>(null);
    // containerRefExternal 允许 `RefObject<HTMLDivElement | null>`（宿主 useRef 的常见类型）。
    const containerRef = containerRefExternal ?? localRef;
    const [, setTick] = useState(0);

    const ctx = useCandidateContext<Candidate>();
    const ctxRef = useRef(ctx);
    ctxRef.current = ctx;
    const propsRef = useRef(props);
    propsRef.current = props;

    const stages = (props.stages ?? (DEFAULT_STAGES as StageConfig[])) as StageConfig[];
    const data = (ctx?.data ?? props.data) as Candidate[] | undefined;
    const candidates = data ?? [];

    useImperativeHandle(
      ref,
      () => ({
        getContainer: () => containerRef.current,
        forceUpdate: () => setTick((t) => t + 1),
        getSize: () => {
          const el = containerRef.current;
          return el
            ? { width: el.offsetWidth, height: el.offsetHeight }
            : { width: 0, height: 0 };
        },
        getStageKeys: () =>
          (propsRef.current.stages ?? (DEFAULT_STAGES as StageConfig[])).map((s) => s.key),
      }),
      [containerRef]
    );

    useEffect(() => {
      onMount?.();
      return () => onUnmount?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toolbar = useCandidateSlot("renderToolbar");
    const footer = useCandidateSlot("renderFooter");

    // 整体内容覆盖槽：无插件胜出时回落核心看板（惰性工厂，避免白造默认树）
    const board = useCandidateContentSlot(
      "renderCards",
      () => renderKanbanDefault(stages, candidates),
      { stages, candidates }
    );

    return (
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={`vcd-root ${containerClassName || ""}`}
        style={{
          position: "relative",
          boxSizing: "border-box",
          background: tokens.bg,
          color: tokens.text,
          fontFamily:
            "var(--vcd-font, system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif)",
          fontSize: 14,
          lineHeight: 1.6,
          ...containerStyle,
        }}
      >
        {toolbar.length > 0 && (
          <div
            className="vcd-toolbar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderBottom: `1px solid ${tokens.line}`,
            }}
          >
            {toolbar}
          </div>
        )}

        <div className="vcd-board" style={{ padding: "12px 16px 4px" }}>{board}</div>

        {footer.length > 0 && (
          <div
            className="vcd-footer"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              padding: "12px 16px 14px",
              borderTop: `1px solid ${tokens.line}`,
              alignItems: "center",
            }}
          >
            {footer}
          </div>
        )}

        {/* 内核浮层兜底层（Note / InterviewSlot / RejectTpl / ArchivePool / ActivityLog 弹层…） */}
        {children}
      </div>
    );
  }
);

CandidateCore.displayName = "CandidateCore";

// ============ 核心默认渲染（renderCards / renderCardBody 的 fallback） ============

function renderKanbanDefault(stages: StageConfig[], candidates: Candidate[]) {
  return (
    <div
      className="vcd-kanban"
      style={{ display: "flex", gap: 12, alignItems: "flex-start", overflowX: "auto", paddingBottom: 8 }}
    >
      {stages.map((stage) => {
        const list = candidates.filter((c) => c.stage === stage.key);
        return <StageColumn key={stage.key} stage={stage} list={list} />;
      })}
      {candidates.length === 0 && (
        <div style={{ color: tokens.muted, fontSize: 13, padding: "8px 2px" }}>
          暂无候选人
        </div>
      )}
    </div>
  );
}

function StageColumn({ stage, list }: { stage: StageConfig; list: Candidate[] }) {
  const columnExtras = useCandidateColumnSlot("renderColumnHeader", stage, list.length);
  const tone = TONE_COLOR[stage.tone ?? "neutral"] ?? TONE_COLOR.neutral;
  return (
    <section
      data-stage-key={stage.key}
      className="vcd-column"
      style={{
        flex: "1 0 220px",
        minWidth: 220,
        background: tokens.chipBg,
        borderRadius: "var(--vcd-radius, 8px)",
        padding: 8,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: tone.fg,
            background: tone.bg,
            padding: "1px 8px",
            borderRadius: 999,
          }}
        >
          {stage.label}
        </span>
        <span style={{ fontSize: 12, color: tokens.muted }}>{list.length}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>{columnExtras}</span>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </section>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <article
      data-candidate-id={candidate.id}
      className="vcd-card"
      style={{
        background: tokens.bg,
        color: tokens.text,
        border: `1px solid ${tokens.line}`,
        borderRadius: "var(--vcd-radius, 8px)",
        padding: "10px 12px",
        boxSizing: "border-box",
      }}
    >
      <CandidateCardBody candidate={candidate} />
    </article>
  );
}

function CandidateCardBody({ candidate }: { candidate: Candidate }) {
  const badges = useCandidateCardSlot("renderCardBadges", candidate);
  const actions = useCandidateCardSlot("renderCardActions", candidate);
  const body = useCandidateContentSlot(
    "renderCardBody",
    () => renderCardBodyDefault(candidate),
    candidate
  );
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {candidate.avatar ? (
          <img
            src={candidate.avatar}
            alt=""
            width={32}
            height={32}
            style={{ borderRadius: "50%", objectFit: "cover", border: `1px solid ${tokens.line}` }}
          />
        ) : (
          <span
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: tokens.accentWash,
              color: tokens.accent,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {candidate.name.slice(0, 1)}
          </span>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <strong style={{ fontSize: 14, color: tokens.text }}>{candidate.name}</strong>
            {badges.length > 0 && <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>{badges}</span>}
          </div>
          <div style={{ fontSize: 12, color: tokens.muted }}>{candidate.role}</div>
        </div>
      </div>
      {body}
      {actions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 8,
            paddingTop: 8,
            borderTop: `1px solid ${tokens.line}`,
          }}
        >
          {actions}
        </div>
      )}
    </>
  );
}

function renderCardBodyDefault(c: Candidate) {
  return (
    <>
      {c.summary && (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 12,
            color: tokens.muted,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {c.summary}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", marginTop: 6, fontSize: 12, color: tokens.muted }}>
        {c.source && <span>来源：{c.source}</span>}
        {c.appliedAt && <span>投递：{c.appliedAt}</span>}
        {c.email && <span>{c.email}</span>}
        {c.phone && <span>{c.phone}</span>}
      </div>
    </>
  );
}

export default CandidateCore;
