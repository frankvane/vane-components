import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ResumeCoreProps,
  ResumeCoreRef,
  ResumeData,
  SectionKey,
  WorkItem,
  EduItem,
  SkillGroup,
  ProjectItem,
  AttachmentItem,
} from "./plugins/types";
import { DEFAULT_SECTION_ORDER } from "./plugins/types";
import {
  useResumeContext,
  useResumeSlot,
  useResumeContentSlot,
} from "./plugins/slots";
import { tokens, highlightText, safeHref } from "./plugins/tokens";

/**
 * ResumeCore - 结构化简历核心组件（分段式文档布局）。
 * 铁律：核心只做「分段布局 + 生命周期转发 + 文本高亮」，所有可变能力交给插件。
 *  - 工具栏 / 基础信息追加 / 附件 / 页脚：装饰累积槽（多插件拼接）
 *  - 工作 / 教育 / 技能 / 项目 / 其他：内容覆盖槽（插件优先，否则核心默认）
 *  - 板块顺序（SectionReorder）、折叠（SectionCollapse）、关键词高亮（KeywordHighlight）
 *    均经 ctx.state 驱动，核心只读不写，避免重复渲染源。
 */
const SECTION_TITLE: Record<Exclude<SectionKey, "basics">, string> = {
  work: "工作经历",
  education: "教育背景",
  skills: "专业技能",
  projects: "项目经历",
  extra: "荣誉 / 语言 / 证书",
  attachments: "附件",
};

const ResumeCore = forwardRef<ResumeCoreRef, ResumeCoreProps>(
  function ResumeCore(props, ref) {
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
    // 该类型在 ref 属性上因泛型型变不可直接赋值，运行时对象完全一致，故在此收窄。
    const containerRef = containerRefExternal ?? localRef;
    const [, setTick] = useState(0);

    const ctx = useResumeContext<ResumeData>();
    // 供命令式句柄在「调用时」读取最新值，而不是固化首帧闭包
    const ctxRef = useRef(ctx);
    ctxRef.current = ctx;
    const propsRef = useRef(props);
    propsRef.current = props;
    const data = (ctx?.data ?? (props.data as ResumeData | undefined)) as
      | ResumeData
      | undefined;
    const highlightKeywords = (ctx?.state?.highlightKeywords as string[] | undefined) ?? [];
    const collapsed = (ctx?.state?.collapsed as string[] | undefined) ?? [];
    const collapseMode = !!ctx?.state?.collapseMode;
    // 模板 / 主题注入的 CSS 变量（主题覆盖模板的同名变量），供各插槽与默认渲染引用
    const templateVars = (ctx?.state?.templateVars as Record<string, string> | undefined) ?? {};
    const themeVars = (ctx?.state?.themeVars as Record<string, string> | undefined) ?? {};

    useImperativeHandle(
      ref,
      () => ({
        getContainer: () => containerRef.current,
        forceUpdate: () => setTick((t) => t + 1),
        getSize: () => {
          const el = containerRef.current;
          return el ? { width: el.offsetWidth, height: el.offsetHeight } : { width: 0, height: 0 };
        },
        getSectionOrder: () =>
          (ctxRef.current?.state?.sectionOrder as SectionKey[] | undefined) ??
          propsRef.current.defaultSectionOrder ??
          [...DEFAULT_SECTION_ORDER],
      }),
      // 调用时经 ref 读取最新 ctx / props，SectionReorder 等插件写入后立即可见
      [containerRef]
    );

    useEffect(() => {
      onMount?.();
      return () => onUnmount?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleCollapse = (key: string) => {
      if (!ctx) return;
      const set = new Set(collapsed);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      ctx.setState({ collapsed: [...set] });
    };

    const order =
      (ctx?.state?.sectionOrder as SectionKey[] | undefined) ??
      props.defaultSectionOrder ??
      DEFAULT_SECTION_ORDER;

    // 关键词数组常为内联新建，用内容签名做依赖，避免同关键词重复构造默认节点
    const keywordsKey = highlightKeywords.join("\u0001");

    const toolbar = useResumeSlot("renderToolbar");
    const basicsSlot = useResumeSlot("renderBasics");
    const attachmentsSlot = useResumeSlot("renderAttachments");
    const attachmentsDefault = useMemo(
      () =>
        data?.attachments?.length
          ? renderAttachmentsDefault(data.attachments, highlightKeywords)
          : null,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [data?.attachments, keywordsKey]
    );
    const attachmentsContent =
      attachmentsSlot.length > 0 ? attachmentsSlot : attachmentsDefault;
    const footerSlot = useResumeSlot("renderFooter");

    // 内容覆盖槽（fallback = 核心默认渲染）。
    // 传工厂而不是已创建节点：插件覆盖该槽时默认 DOM 不再被白白构造。
    // 工厂再经 useMemo 按「本槽实际消费的数据片段 + 关键词签名」缓存，
    // 无关 state（折叠、弹层开关等）变化时不重建默认树。
    const workFallback = useMemo(
      () => () => (data ? renderWorkDefault(data.work ?? [], highlightKeywords) : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [data?.work, keywordsKey]
    );
    const eduFallback = useMemo(
      () => () => (data ? renderEducationDefault(data.education ?? [], highlightKeywords) : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [data?.education, keywordsKey]
    );
    const skillsFallback = useMemo(
      () => () => (data ? renderSkillsDefault(data.skills ?? [], highlightKeywords) : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [data?.skills, keywordsKey]
    );
    const projectsFallback = useMemo(
      () => () => (data?.projects?.length ? renderProjectsDefault(data.projects, highlightKeywords) : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [data?.projects, keywordsKey]
    );
    const extraFallback = useMemo(
      () => () => (data ? renderExtraDefault(data, highlightKeywords) : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [data, keywordsKey]
    );

    const workNode = useResumeContentSlot("renderWork", workFallback);
    const eduNode = useResumeContentSlot("renderEducation", eduFallback);
    const skillsNode = useResumeContentSlot("renderSkills", skillsFallback);
    const projectsNode = useResumeContentSlot("renderProjects", projectsFallback);
    const extraNode = useResumeContentSlot("renderExtra", extraFallback);

    const basicsDefault = useMemo(
      () => (data ? renderBasicsDefault(data, highlightKeywords) : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [data, keywordsKey]
    );

    const renderBody = (key: SectionKey, title: string, content: React.ReactNode) => {
      if (content === null || content === undefined) return null;
      const isCollapsed = collapseMode && collapsed.includes(key);
      return (
        <section
          key={key}
          data-section-key={key}
          className="vr-section"
          style={{ padding: "var(--vr-pad, 16px) 20px", borderTop: `1px solid ${tokens.line}` }}
        >
          <header
            className="vr-section-head"
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isCollapsed ? 0 : 10 }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "var(--vr-h2, 15px)",
                fontWeight: 700,
                color: tokens.text,
                letterSpacing: 0.5,
              }}
            >
              {title}
            </h2>
            {collapseMode && (
              <button
                type="button"
                aria-label={isCollapsed ? "展开" : "折叠"}
                onClick={() => toggleCollapse(key)}
                style={{
                  marginLeft: "auto",
                  background: tokens.chipBg,
                  color: tokens.text,
                  border: `1px solid ${tokens.line}`,
                  borderRadius: "var(--vr-radius, 6px)",
                  fontSize: 12,
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                {isCollapsed ? "展开" : "折叠"}
              </button>
            )}
          </header>
          {!isCollapsed && <div className="vr-section-body">{content}</div>}
        </section>
      );
    };

    return (
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={`vr-root ${containerClassName || ""}`}
        style={{
          position: "relative",
          boxSizing: "border-box",
          background: tokens.bg,
          color: tokens.text,
          maxWidth: 820,
          margin: "0 auto",
          fontFamily:
            "var(--vr-font, system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif)",
          fontSize: 14,
          lineHeight: 1.6,
          // 模板 / 主题变量（主题覆盖模板同名变量）
          ...(templateVars as React.CSSProperties),
          ...(themeVars as React.CSSProperties),
          ...containerStyle,
        }}
      >
        {toolbar.length > 0 && (
          <div
            className="vr-toolbar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderBottom: `1px solid ${tokens.line}`,
            }}
          >
            {toolbar}
          </div>
        )}

        {order.map((key) => {
          switch (key) {
            case "basics": {
              // 无数据且无插件追加内容时不渲染空段
              if (!basicsDefault && basicsSlot.length === 0) return null;
              return renderBody(
                "basics",
                "基本信息",
                <>
                  {basicsDefault}
                  {basicsSlot}
                </>
              );
            }
            case "work":
              return renderBody("work", SECTION_TITLE.work, workNode);
            case "education":
              return renderBody("education", SECTION_TITLE.education, eduNode);
            case "skills":
              return renderBody("skills", SECTION_TITLE.skills, skillsNode);
            case "projects":
              return data?.projects?.length
                ? renderBody("projects", SECTION_TITLE.projects, projectsNode)
                : null;
            case "extra":
              return renderBody("extra", SECTION_TITLE.extra, extraNode);
            case "attachments":
              return renderBody("attachments", SECTION_TITLE.attachments, attachmentsContent);
            default:
              return null;
          }
        })}

        {footerSlot.length > 0 && (
          <div
            className="vr-footer"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              padding: "14px 20px",
              borderTop: `1px solid ${tokens.line}`,
            }}
          >
            {footerSlot}
          </div>
        )}

        {/* 内核三槽兜底层（PrivacyMask 毛玻璃 / AttachmentPreview 灯箱 / QrCode 角标 / ShareLink 模态 …） */}
        {children}
      </div>
    );
  }
);

ResumeCore.displayName = "ResumeCore";

// ============ 核心默认渲染（被内容覆盖槽的 fallback 引用） ============

function Text({ value, kw }: { value: string; kw: string[] }) {
  return <>{highlightText(value, kw)}</>;
}

function renderBasicsDefault(data: ResumeData, kw: string[]) {
  const b = data.basics;
  if (!b) return null;
  return (
    <div className="vr-basics" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {b.avatar && (
        <img
          src={b.avatar}
          alt={b.name}
          style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `1px solid ${tokens.line}` }}
        />
      )}
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: tokens.text }}>{b.name}</div>
        {b.title && (
          <div style={{ color: "var(--vr-accent, #2f6feb)", fontWeight: 600, marginTop: 2 }}>
            <Text value={b.title} kw={kw} />
          </div>
        )}
        {b.summary && (
          <p style={{ margin: "8px 0 0", color: tokens.muted, fontSize: 13 }}>
            <Text value={b.summary} kw={kw} />
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 8, fontSize: 13, color: tokens.muted }}>
          {b.location && <span>📍 <Text value={b.location} kw={kw} /></span>}
          {b.birthDate && <span>🎂 <Text value={b.birthDate} kw={kw} /></span>}
        </div>
        {b.contacts?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 4, fontSize: 13 }}>
            {b.contacts.map((c, i) => {
              const href = safeHref(c.href);
              return (
                <span key={i} style={{ color: tokens.text }}>
                  {href ? (
                    <a href={href} style={{ color: "var(--vr-accent, #2f6feb)", textDecoration: "none" }}>
                      {c.label}：<Text value={c.value} kw={kw} />
                    </a>
                  ) : (
                    <span>{c.label}：<Text value={c.value} kw={kw} /></span>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function dateRange(start: string, end: string) {
  return `${start} — ${end}`;
}

function renderWorkDefault(items: WorkItem[], kw: string[]) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((w, i) => (
        <div key={w.id ?? i} style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 120, flexShrink: 0, color: tokens.faint, fontSize: 12, paddingTop: 2 }}>
            {dateRange(w.start, w.end)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: tokens.text }}>
              <Text value={w.company} kw={kw} />
              {w.role && <span style={{ fontWeight: 400, color: tokens.muted }}> · <Text value={w.role} kw={kw} /></span>}
            </div>
            {w.location && (
              <div style={{ color: tokens.faint, fontSize: 12 }}>{w.location}</div>
            )}
            {w.highlights?.length > 0 && (
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: tokens.muted }}>
                {w.highlights.map((h, j) => (
                  <li key={j}><Text value={h} kw={kw} /></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderEducationDefault(items: EduItem[], kw: string[]) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((e, i) => (
        <div key={e.id ?? i} style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 120, flexShrink: 0, color: tokens.faint, fontSize: 12, paddingTop: 2 }}>
            {dateRange(e.start, e.end)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: tokens.text }}>
              <Text value={e.school} kw={kw} />
            </div>
            <div style={{ color: tokens.muted }}>
              <Text value={e.degree} kw={kw} />
              {e.major && <span> · <Text value={e.major} kw={kw} /></span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderSkillsDefault(groups: SkillGroup[], kw: string[]) {
  if (!groups.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {groups.map((g, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 110, flexShrink: 0, color: tokens.muted, fontWeight: 600 }}>
            <Text value={g.category} kw={kw} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {g.items.map((it, j) => (
              <span
                key={j}
                style={{
                  background: tokens.chipBg,
                  color: tokens.chipText,
                  border: `1px solid ${tokens.line}`,
                  borderRadius: "var(--vr-radius, 12px)",
                  padding: "2px 10px",
                  fontSize: 12,
                }}
              >
                <Text value={it} kw={kw} />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderProjectsDefault(items: ProjectItem[], kw: string[]) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((p, i) => (
        <div key={p.id ?? i}>
          <div style={{ fontWeight: 700, color: tokens.text }}>
            <Text value={p.name} kw={kw} />
            {p.role && <span style={{ fontWeight: 400, color: tokens.muted }}> · <Text value={p.role} kw={kw} /></span>}
            {(p.start || p.end) && (
              <span style={{ float: "right", color: tokens.faint, fontSize: 12, fontWeight: 400 }}>
                {dateRange(p.start ?? "", p.end ?? "")}
              </span>
            )}
          </div>
          <p style={{ margin: "4px 0 0", color: tokens.muted, fontSize: 13 }}>
            <Text value={p.desc} kw={kw} />
          </p>
          {p.links && p.links.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {p.links.map((l, j) => {
                const href = safeHref(l);
                return href ? (
                  <a key={j} href={href} style={{ color: "var(--vr-accent, #2f6feb)", fontSize: 12, marginRight: 12, textDecoration: "none" }}>
                    链接{j + 1} ↗
                  </a>
                ) : null;
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function renderExtraDefault(data: ResumeData, kw: string[]) {
  const blocks: React.ReactNode[] = [];
  if (data.awards?.length) {
    blocks.push(
      <div key="awards">
        <div style={{ fontWeight: 600, color: tokens.text, marginBottom: 4 }}>荣誉奖项</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: tokens.muted }}>
          {data.awards.map((a, i) => (
            <li key={i}>
              <Text value={a.title} kw={kw} /> · {a.issuer}
              {a.date && <span style={{ color: tokens.faint }}> · {a.date}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (data.languages?.length) {
    blocks.push(
      <div key="langs">
        <div style={{ fontWeight: 600, color: tokens.text, marginBottom: 4 }}>语言能力</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {data.languages.map((l, i) => (
            <span key={i} style={{ background: tokens.chipBg, color: tokens.chipText, borderRadius: "var(--vr-radius, 12px)", padding: "2px 10px", fontSize: 12 }}>
              <Text value={l.name} kw={kw} /> · {l.level}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (data.certificates?.length) {
    blocks.push(
      <div key="certs">
        <div style={{ fontWeight: 600, color: tokens.text, marginBottom: 4 }}>证书</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: tokens.muted }}>
          {data.certificates.map((c, i) => (
            <li key={i}>
              <Text value={c.name} kw={kw} /> · {c.issuer}
              {c.date && <span style={{ color: tokens.faint }}> · {c.date}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (!blocks.length) return null;
  return <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{blocks}</div>;
}

function renderAttachmentsDefault(items: AttachmentItem[], kw: string[]) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {items.map((a, i) => (
        <a
          key={a.id ?? i}
          href={safeHref(a.url)}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: tokens.chipBg,
            color: tokens.text,
            border: `1px solid ${tokens.line}`,
            borderRadius: "var(--vr-radius, 8px)",
            padding: "8px 12px",
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          <span style={{ color: "var(--vr-accent, #2f6feb)", textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>
            {a.kind}
          </span>
          <span><Text value={a.name} kw={kw} /></span>
          {a.size ? <span style={{ color: tokens.faint, fontSize: 11 }}>{(a.size / 1024).toFixed(0)}KB</span> : null}
        </a>
      ))}
    </div>
  );
}

export default ResumeCore;
