import React from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
  ActivityTask,
  TaskStatus,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface TaskListPluginConfig extends ActivityPluginConfigBase {
  /** 是否展示每个任务的进度条（默认 true） */
  showProgress?: boolean;
  /** 完成态文案（默认「已完成」） */
  doneLabel?: string;
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  locked: "未解锁",
  available: "进行中",
  completed: "已完成",
};

/** 状态色（ADR-13：禁用/锁定态实色 ≥4.5，不靠 opacity）
 *  locked   #5d636a（muted，白底 6.0:1）
 *  available #cf4407（白底 4.69:1）
 *  completed #15803d（白底 5.0:1）；#8a8f98/#1f9d55 仅 3.25/3.49 不达标，已弃用 */
const STATUS_COLOR: Record<TaskStatus, string> = {
  locked: "#5d636a",
  available: "#cf4407",
  completed: "#15803d",
};

/**
 * TaskListPlugin - 任务清单：渲染活动任务列表，展示标题 / 描述 / 进度与状态，
 * 含「去完成」动作按钮（调 context.props.onTaskAction）。
 */
export const createTaskListPlugin: PluginCreator<TaskListPluginConfig> = (
  config = {}
) => {
  const { showProgress = true, doneLabel = "已完成" } = config;

  return {
    name: "TaskListPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 20,
    config,
    // 任务清单是 renderTasks 的基准实现：与 TaskTabsPlugin（22）等更强视图竞争时让位，
    // 避免两份任务列表叠在一起（装配期去重并 console.warn）。
    exclusiveSlots: ["renderTasks"],
    hooks: {
      renderTasks: (context: ActivityPluginContext) => {
        const tasks = (context.tasks ?? []) as ActivityTask[];
        if (tasks.length === 0) return null;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.map((task) => {
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
                      onClick={() => context.props.onTaskAction?.(task.id)}
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
        );
      },
    },
  };
};

createTaskListPlugin.meta = doc as PluginDoc;
