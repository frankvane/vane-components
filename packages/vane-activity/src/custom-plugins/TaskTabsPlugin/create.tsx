import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
  ActivityTask,
  ActivityTaskGroup,
} from "../../components/ActivityPlugin/plugins/types";
import { TaskTabs } from "./internal";
import doc from "./doc.json";

export interface TaskTabsPluginConfig extends ActivityPluginConfigBase {
  /** 页签（未传则读 data.taskGroups；都没有则单「全部」页签） */
  tabs?: ActivityTaskGroup[];
  /** 默认选中页签 key（默认第一个） */
  defaultTab?: string;
  /** 是否展示任务进度条（默认 true） */
  showProgress?: boolean;
  /** 完成态文案（默认「已完成」） */
  doneLabel?: string;
  /** 分组无任务时的文案（默认「该分组暂无任务」） */
  emptyText?: string;
}

/**
 * TaskTabsPlugin - 分组任务清单：页签切换 + 每页签完成度 + 组内任务行。
 *
 * 独占 renderTasks 槽：与 TaskListPlugin 同时装配时只留 priority 高者（本插件 22 >
 * TaskList 20，装配期去重并 console.warn）。任务用 task.group 归属分组，
 * 分组定义来自 data.taskGroups（或 config.tabs）。
 */
export const createTaskTabsPlugin: PluginCreator<TaskTabsPluginConfig> = (
  config = {}
) => {
  const {
    tabs = [],
    defaultTab,
    showProgress = true,
    doneLabel = "已完成",
    emptyText = "该分组暂无任务",
  } = config;

  return {
    name: "TaskTabsPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 22,
    config,
    exclusiveSlots: ["renderTasks"],
    hooks: {
      renderTasks: (context: ActivityPluginContext) => {
        const tasks = (context.tasks ?? []) as ActivityTask[];
        if (tasks.length === 0) return null;
        return (
          <TaskTabs
            ctx={context}
            tabs={tabs}
            defaultTab={defaultTab}
            showProgress={showProgress}
            doneLabel={doneLabel}
            emptyText={emptyText}
          />
        );
      },
    },
  };
};

createTaskTabsPlugin.meta = doc as PluginDoc;
