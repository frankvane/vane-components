import type { PluginDoc } from "vane-plugin-core";
import type { ModalSheetPluginCreator } from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface SearchBarPluginConfig {
  /** 占位文本 */
  placeholder?: string;
  /** 初始值 */
  defaultValue?: string;
  /** 输入回调（同时经 bus 广播 "modal-sheet:search"） */
  onSearch?: (value: string) => void;
}

/**
 * 搜索框：非受控输入，输入时回调 onSearch 并经 bus 广播，
 * 领域插件（如后续的 ListSelect）监听总线即可做过滤联动。
 * priority 34（renderHeader 槽）。
 */
export const createSearchBarPlugin: ModalSheetPluginCreator<SearchBarPluginConfig> = (
  config = {}
) => {
  const { placeholder = "搜索", defaultValue = "", onSearch } = config;

  return {
    name: "search-bar",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 34,
    hooks: {
      renderHeader: () => (
        <div
          data-vane-ms-search=""
          style={{ padding: "0 16px 8px", flexShrink: 0 }}
        >
          <input
            type="search"
            defaultValue={defaultValue}
            placeholder={placeholder}
            aria-label={placeholder}
            onChange={(e) => {
              const value = e.currentTarget.value;
              onSearch?.(value);
            }}
            style={{
              width: "100%",
              height: 36,
              boxSizing: "border-box",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#f1f3f5",
              color: "#1f2329",
              padding: "0 14px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>
      ),
    },
  };
};

createSearchBarPlugin.meta = doc as PluginDoc;
