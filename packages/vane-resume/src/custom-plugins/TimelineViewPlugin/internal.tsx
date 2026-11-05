import type { WorkItem, EduItem } from "../../components/ResumePlugin/plugins/types";
import { highlightText } from "../../components/ResumePlugin/plugins/tokens";

/**
 * 时间轴条目组件（内部实现，仅由 create.tsx 引用）。
 * 单独成文件：create.tsx 同时导出工厂函数与组件会触发 react-refresh 告警。
 */
export function Timeline({
  items,
  kind,
  kw,
}: {
  items: (WorkItem | EduItem)[];
  kind: "work" | "edu";
  kw: string[];
}) {
  if (!items.length) return null;
  return (
    <div style={{ position: "relative", paddingLeft: 20 }}>
      <div style={{ position: "absolute", left: 5, top: 4, bottom: 4, width: 2, background: "var(--vr-line, #e3e6ea)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((it, i) => (
          <div key={(it as WorkItem).id ?? i} style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: -19,
                top: 4,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--vr-accent, #2f6feb)",
                boxShadow: "0 0 0 3px #fff",
              }}
            />
            <div style={{ fontWeight: 700, color: "var(--vr-text, #1f2328)" }}>
              {kind === "work"
                ? highlightText((it as WorkItem).company, kw)
                : highlightText((it as EduItem).school, kw)}
            </div>
            <div style={{ color: "var(--vr-muted, #5d636a)", fontSize: 13 }}>
              {kind === "work"
                ? <>
                    {(it as WorkItem).role ? <>{highlightText((it as WorkItem).role as string, kw)} </> : null}
                    {`${(it as WorkItem).start} — ${(it as WorkItem).end}`}
                  </>
                : <>
                    {highlightText((it as EduItem).degree, kw)}
                    {(it as EduItem).major ? <> · {highlightText((it as EduItem).major as string, kw)}</> : null}
                    {` ${(it as EduItem).start} — ${(it as EduItem).end}`}
                  </>}
            </div>
            {kind === "work" && (it as WorkItem).highlights?.length > 0 && (
              <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: "var(--vr-muted, #5d636a)" }}>
                {(it as WorkItem).highlights.map((h, j) => (
                  <li key={j}>{highlightText(h, kw)}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
