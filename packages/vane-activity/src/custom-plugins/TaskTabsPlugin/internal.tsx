/**
 * TaskTabsPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import React, { useRef, useState } from "react";
import type {
  ActivityData,
  ActivityPluginContext,
  ActivityTask,
  ActivityTaskGroup,
  TaskStatus,
} from "../../components/ActivityPlugin/plugins/types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  locked: "未解锁",
  available: "进行中",
  completed: "已完成",
};

/** 状态色（ADR-13：实色 ≥4.5，不靠 opacity，同 TaskListPlugin） */
const STATUS_COLOR: Record<TaskStatus, string> = {
  locked: "#5d636a",
  available: "#cf4407",
  completed: "#15803d",
};

const ALL_TAB: ActivityTaskGroup = { key: "all", label: "全部" };

export function TaskTabs({
  ctx,
  tabs: tabsProp,
  defaultTab,
  showProgress,
  doneLabel,
  emptyText,
}: {
  ctx: ActivityPluginContext;
  tabs: ActivityTaskGroup[];
  defaultTab?: string;
  showProgress: boolean;
  doneLabel: string;
  emptyText: string;
}) {
  const data = ctx.data as ActivityData | undefined;
  const dataTabs = data?.taskGroups;
  const tabs =
    dataTabs && dataTabs.length > 0 ? dataTabs : tabsProp.length > 0 ? tabsProp : [ALL_TAB];
  const tasks = (ctx.tasks ?? []) as ActivityTask[];

  const baseId = React.useId();
  const [active, setActive] = useState(defaultTab ?? tabs[0].key);
  // 页签被外部换掉时回到第一个，避免停在已不存在的分组上
  const current = tabs.some((t) => t.key === active) ? active : tabs[0].key;

  // P2-11：WAI-ARIA tabs 模式——方向键在页签间移动焦点并选中，Home/End 到两端。
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const focusTab = (key: string) => {
    tabRefs.current.get(key)?.focus();
    setActive(key);
  };
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, key: string) => {
    const keys = tabs.map((t) => t.key);
    const index = keys.indexOf(key);
    if (index < 0) return;
    let next: string | null = null;
    if (event.key === "ArrowRight") next = keys[(index + 1) % keys.length];
    else if (event.key === "ArrowLeft") next = keys[(index - 1 + keys.length) % keys.length];
    else if (event.key === "Home") next = keys[0];
    else if (event.key === "End") next = keys[keys.length - 1];
    if (next !== null) {
      event.preventDefault();
      focusTab(next);
    }
  };

  const shown = current === "all" ? tasks : tasks.filter((t) => t.group === current);

  return (
    <section aria-label="任务清单">
      <div
        role="tablist"
        aria-label="任务分组"
        style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}
      >
        {tabs.map((tab) => {
          const groupTasks =
            tab.key === "all" ? tasks : tasks.filter((t) => t.group === tab.key);
          const groupDone = groupTasks.filter((t) => t.status === "completed").length;
          const selected = tab.key === current;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.key, el);
                else tabRefs.current.delete(tab.key);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              data-testid="task-tab"
              onClick={() => setActive(tab.key)}
              onKeyDown={(event) => onTabKeyDown(event, tab.key)}
              style={{
                flex: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                border: selected ? "1px solid #cf4407" : "1px solid rgba(128,128,128,0.22)",
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: selected ? 600 : 400,
                /* 选中 #cf4407 白字 4.69:1；未选中白底 #5d636a 6.0:1 */
                background: selected ? "#cf4407" : "#fff",
                color: selected ? "#fff" : "#5d636a",
                cursor: "pointer",
              }}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              {tab.label}
              {/* 选中态白字压 #cf4407 不能降 opacity：0.9 → 4.06:1 不达标（ADR-13） */}
              <span style={{ fontSize: 11 }}>
                {groupDone}/{groupTasks.length}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${current}`}
        style={{ marginTop: 10 }}
      >
        {shown.length === 0 ? (
          <div
            style={{
              padding: "18px 0",
              textAlign: "center",
              fontSize: 13,
              color: "#5d636a",
            }}
          >
            {emptyText}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shown.map((task) => {
              const color = STATUS_COLOR[task.status];
              const pct = Math.round(
                Math.max(0, Math.min(1, task.progress ?? 0)) * 100
              );
              return (
                <div
                  key={task.id}
                  data-testid="activity-task"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(128,128,128,0.18)",
                    background: "#fff",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1f2328" }}>
                      {task.title}
                    </div>
                    {task.desc && (
                      <div style={{ fontSize: 12, color: "#5d636a", marginTop: 2 }}>
                        {task.desc}
                      </div>
                    )}
                    {showProgress && task.status !== "completed" && (
                      <div
                        style={{
                          marginTop: 6,
                          height: 4,
                          borderRadius: 2,
                          background: "rgba(128,128,128,0.18)",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            borderRadius: 2,
                            background: "#cf4407",
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {task.status === "completed" ? doneLabel : STATUS_LABEL[task.status]}
                  </span>
                  {task.actionLabel && task.status !== "completed" && (
                    <button
                      type="button"
                      onClick={() => ctx.props.onTaskAction?.(task.id)}
                      style={{
                        border: "none",
                        borderRadius: 999,
                        padding: "6px 14px",
                        background: "#cf4407",
                        color: "#fff",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {task.actionLabel}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
