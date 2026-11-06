import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";

export interface TabItem {
  /** 页签 id（唯一） */
  id: string;
  /** 页签文案 */
  label: React.ReactNode;
  /** 可选图标 */
  icon?: React.ReactNode;
}

export interface TabSyncConfig {
  /** 页签定义（至少一个） */
  tabs: TabItem[];
  /** 样式变体，默认 underline */
  variant?: "underline" | "pill" | "segmented";
  /** 是否吸顶，默认 false */
  sticky?: boolean;
  /** 切换时是否把容器滚动到顶部，默认 true */
  scrollTopOnChange?: boolean;
  /** 切换回调（activeTab 已更新后触发） */
  onChange?: (id: string | null, oldId: string | null) => void;
}

/**
 * TabSync - 页签系统：渲染页签栏 + 切换时联动内容区重渲染。
 *
 * 这是 profile 的「交互中枢」：
 *  - `renderTabBar`：按 config.tabs 渲染按钮，点击调用 context.setActiveTab；
 *  - `onTabChange`：activeTab 变化后触发（由 withPlugins 驱动）；默认把容器
 *    滚到顶部，并调用 config.onChange。
 *
 * 内容区子节点经 `useProfileContext().activeTab` 订阅，实现「页签切换 → 内容区
 * 重渲染」——无需本插件关心内容怎么渲染。
 */
// 泛型默认值 unknown：T 仅出现在入参位（逆变安全），不写 T 的调用方不受影响。
export function createTabSyncPlugin<T = unknown>(
  config: TabSyncConfig
): ProfilePlugin<T> {
  const {
    tabs,
    variant = "underline",
    sticky = false,
    scrollTopOnChange = true,
    onChange,
  } = config;
  const items = Array.isArray(tabs) ? tabs.filter((t) => !!t && !!t.id) : [];
  if (items.length === 0) {
    // 页签通常来自异步接口，首帧常常是空数组。这里不能 throw：
    // 工厂一般在渲染期构造，抛错发生在 React 渲染之外，错误边界接不住，直接白屏。
    // 因此空 tabs 返回一个 enabled:false 的空插件，等数据到位后由宿主重建插件数组。
    return {
      name: "TabSync",
      version: "0.1.0",
      description:
        "页签系统：渲染页签栏 + 切换时联动内容区重渲染（消费方子节点经 useProfileContext 订阅 activeTab）。",
      priority: 20,
      enabled: false,
      hooks: {},
    };
  }

  const activeStyle = (active: boolean): React.CSSProperties => {
    if (variant === "segmented") {
      return {
        flex: 1,
        padding: "6px 0",
        borderRadius: 6,
        background: active ? "#fff" : "transparent",
        color: active ? "#1a5fd0" : "#555",
        fontWeight: active ? 700 : 400,
      };
    }
    if (variant === "pill") {
      return {
        padding: "4px 14px",
        borderRadius: 999,
        background: active ? "#1a5fd0" : "transparent",
        color: active ? "#fff" : "#555",
        border: active ? "none" : "1px solid #ddd",
      };
    }
    // underline
    return {
      padding: "8px 12px",
      borderBottom: active ? "2px solid #1a5fd0" : "2px solid transparent",
      color: active ? "#1a5fd0" : "#555",
      fontWeight: active ? 700 : 400,
    };
  };

  return {
    name: "TabSync",
    version: "0.1.0",
    description:
      "页签系统：渲染页签栏 + 切换时联动内容区重渲染（消费方子节点经 useProfileContext 订阅 activeTab）。",
    priority: 20,
    enabled: true,
    hooks: {
      renderTabBar: (context: ProfilePluginContext<T>) => {
        const active = context.activeTab;
        return (
          <div
            className="vp-tab-bar-inner"
            role="tablist"
            style={{
              display: "flex",
              gap: variant === "segmented" ? 4 : 8,
              position: sticky ? "sticky" : "static",
              top: sticky ? 0 : undefined,
              background: sticky ? "#fff" : "transparent",
              zIndex: sticky ? 1 : undefined,
              ...(variant === "segmented"
                ? { background: "#eee", borderRadius: 8, padding: 4 }
                : {}),
            }}
          >
            {items.map((t) => {
              const isActive = t.id === active;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => context.setActiveTab(t.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    ...activeStyle(isActive),
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </div>
        );
      },
      onTabChange: (context, newTab, oldTab) => {
        if (scrollTopOnChange) {
          const el = context.refs.container?.current;
          if (el) el.scrollTop = 0;
        }
        onChange?.(newTab, oldTab);
      },
    },
  };
}

