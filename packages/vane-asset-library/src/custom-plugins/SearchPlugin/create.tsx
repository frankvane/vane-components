/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React, { useEffect, useRef, useState } from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import doc from "./doc.json";

/**
 * SearchPlugin — 关键词搜索。
 *
 * 输入框是本地受控 + 防抖写回 ctx.setQuery：每次按键都写内核 state 会让整墙重排，
 * 200ms 防抖是「手感」与「渲染量」的折中。外部改 query（清空筛选 / URL 恢复）时
 * 用 effect 反向同步本地值，否则输入框会与外部的真实条件脱钩。
 */
export interface SearchConfig {
  placeholder?: string;
  /** 防抖毫秒，默认 200 */
  debounce?: number;
  /** ⌘K / Ctrl+K 聚焦，默认 true */
  hotkey?: boolean;
  /** 输入框宽度，默认 200 */
  width?: number;
}

interface SearchBoxProps {
  ctx: AssetLibraryContext;
  placeholder: string;
  debounce: number;
  hotkey: boolean;
  width: number;
}

function SearchBox({ ctx, placeholder, debounce, hotkey, width }: SearchBoxProps) {
  const [value, setValue] = useState(ctx.query);
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 外部条件变化 → 同步输入框（清空筛选、从 URL 恢复等）
  useEffect(() => {
    setValue(ctx.query);
  }, [ctx.query]);

  useEffect(() => {
    if (!hotkey || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkey]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const commit = (next: string) => {
    setValue(next);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      ctx.setQuery(next);
    }, debounce);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        ref={inputRef}
        className="vc-asset-input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label="搜索素材"
        style={{ width }}
        onChange={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.stopPropagation();
            commit("");
          }
        }}
      />
      {value ? (
        <button
          type="button"
          className="vc-asset-btn"
          aria-label="清空搜索"
          onClick={() => commit("")}
        >
          清空
        </button>
      ) : null}
    </div>
  );
}

export const createSearchPlugin: AssetPluginCreator<SearchConfig> = (config = {}) => {
  const placeholder = config.placeholder ?? "搜索名称 / 标签 / 分组";
  const debounce = config.debounce ?? 200;
  const hotkey = config.hotkey !== false;
  const width = config.width ?? 200;

  return {
    name: "search",
    version: "0.1.0",
    description: doc.description,
    priority: 10,
    config,
    hooks: {
      renderToolbar: (context) => (
        <SearchBox
          ctx={context}
          placeholder={placeholder}
          debounce={debounce}
          hotkey={hotkey}
          width={width}
        />
      ),
    },
  } satisfies AssetPlugin;
};

createSearchPlugin.meta = doc as PluginDoc;
