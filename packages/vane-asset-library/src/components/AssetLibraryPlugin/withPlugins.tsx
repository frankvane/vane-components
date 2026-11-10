import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import { usePluginRuntime } from "vane-plugin-core";
import type { Plugin, PluginContext, WithPluginsConfig } from "vane-plugin-core";
import {
  filterAssets,
  isAssetSelectable,
  normalizeAssets,
  normalizeFolders,
  normalizeSelection,
  paginateAssets,
  resolveEmptyReason,
  sortAssets,
} from "./domain";
import { buildAssetSlots } from "./plugins/slots";
import { EMPTY_SLOTS } from "./plugins/types";
import type {
  AssetCardView,
  AssetFilter,
  AssetItem,
  AssetKind,
  AssetLibraryContext,
  AssetLibraryCoreProps,
  AssetLibraryCoreRef,
  AssetLibraryState,
  AssetPlugin,
  AssetSort,
  AssetSortDir,
  AssetSortKey,
  AssetView,
} from "./plugins/types";

/**
 * withAssetLibraryPlugins — 素材库装配器（接 vane-plugin-core）。
 *
 * 职责边界：
 *  - 领域状态（筛选 / 排序 / 分页 / 选择 / 焦点 / 预览）全部住在这里的内核 state；
 *  - 判断逻辑全部来自 domain.ts 纯函数，本文件只做「读状态 → 算派生 → 写状态」；
 *  - 槽位组装交给 buildAssetSlots，Core 只拿到 cards + slots。
 *
 * 选择态的唯一写入口是 commitSelection：受控模式下写 state 只用于即时回显，
 * 真相始终是 props.selectedIds（宿主不回传，UI 就不变 —— 这才是受控语义）。
 */

const DEFAULT_PAGE_SIZE = 24;
const DEFAULT_SORT: AssetSort = { key: "createdAt", dir: "desc" };

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function asKinds(value: unknown): AssetKind[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is AssetKind => entry === "image" || entry === "video")
    : [];
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asSort(state: Partial<AssetLibraryState>): AssetSort {
  const key: AssetSortKey =
    state.sortKey === "name" ||
    state.sortKey === "createdAt" ||
    state.sortKey === "size" ||
    state.sortKey === "duration"
      ? state.sortKey
      : DEFAULT_SORT.key;
  const dir: AssetSortDir = state.sortDir === "asc" || state.sortDir === "desc"
    ? state.sortDir
    : DEFAULT_SORT.dir;
  return { key, dir };
}

function asView(value: unknown): AssetView {
  return value === "list" ? "list" : "grid";
}

export interface WithAssetLibraryConfig
  extends WithPluginsConfig<AssetLibraryCoreProps> {
  plugins: AssetPlugin[];
}

export function withPlugins(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<AssetLibraryCoreProps> &
      React.RefAttributes<AssetLibraryCoreRef>
  >,
  config: WithAssetLibraryConfig | AssetPlugin[]
) {
  const normalized: WithAssetLibraryConfig = Array.isArray(config)
    ? { plugins: config }
    : config;
  const defaultPlugins = normalized.plugins ?? [];
  const { enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<AssetLibraryCoreRef, AssetLibraryCoreProps>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const emitRef = useRef<(hook: string, ...args: unknown[]) => void>(() => {});

      const {
        items: rawItems,
        folders: rawFolders,
        selectedIds: controlledIds,
        defaultSelectedIds,
        maxSelected: maxSelectedProp,
        multiple: multipleProp,
        pageSize: pageSizeProp,
        initialSort,
        initialView,
        onSelectionChange,
        onItemActivate,
        onUpload,
        onAssetAction,
      } = props;

      // ---------- 归一化 ----------
      const normalizedAssets = useMemo(() => normalizeAssets(rawItems), [rawItems]);
      const items = normalizedAssets.items;
      const issues = normalizedAssets.issues;
      useEffect(() => {
        if (!issues.length) return;
        console.warn(
          "[vane-asset-library] 素材数据存在异常，已按归一化结果渲染：",
          issues.join("；")
        );
      }, [issues]);

      const folders = useMemo(() => normalizeFolders(rawFolders), [rawFolders]);

      const maxSelected = Math.max(0, maxSelectedProp ?? 0);
      const multiple = multipleProp !== false;
      const isControlled = controlledIds !== undefined;

      // 初始状态只算一次：非受控初值 / 初始排序 / 初始视图 / 页大小
      const initialState = useMemo<Partial<AssetLibraryState>>(
        () => ({
          query: "",
          kinds: [],
          tags: [],
          folderId: null,
          sortKey: initialSort?.key ?? DEFAULT_SORT.key,
          sortDir: initialSort?.dir ?? DEFAULT_SORT.dir,
          view: initialView ?? "grid",
          page: 1,
          pageSize: pageSizeProp ?? DEFAULT_PAGE_SIZE,
          selectedIds: normalizeSelection(defaultSelectedIds ?? [], items, maxSelected),
          activeId: null,
          previewId: null,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
      );

      // ---------- 上下文扩展 ----------
      const extendContext = useCallback(
        (
          base: PluginContext<AssetLibraryCoreProps, unknown>
        ): PluginContext<AssetLibraryCoreProps, unknown> => {
          const state = (base.state ?? {}) as Partial<AssetLibraryState>;
          const setState = base.setState;

          const query = asString(state.query);
          const kinds = asKinds(state.kinds);
          const tags = asStringArray(state.tags);
          const folderId = typeof state.folderId === "string" ? state.folderId : null;
          const sort = asSort(state);
          const view = asView(state.view);
          const pageSize = asNumber(state.pageSize, DEFAULT_PAGE_SIZE);
          const selectedIds = normalizeSelection(
            isControlled ? controlledIds : state.selectedIds,
            items,
            maxSelected
          );
          const selectedSet = new Set(selectedIds);

          const filtered = sortAssets(
            filterAssets(items, { query, kinds, tags, folderId }),
            sort
          );
          const paged = paginateAssets(filtered, asNumber(state.page, 1), pageSize);
          const visible = paged.visible;
          const byId = new Map(items.map((item) => [item.id, item]));
          const resolveItems = (ids: string[]): AssetItem[] =>
            ids
              .map((id) => byId.get(id))
              .filter((item): item is AssetItem => Boolean(item));

          const commitSelection = (next: string[]): void => {
            const normalizedNext = normalizeSelection(next, items, maxSelected);
            setState({ selectedIds: normalizedNext });
            const resolved = resolveItems(normalizedNext);
            onSelectionChange?.(normalizedNext, resolved);
            emitRef.current("onSelectionChange", normalizedNext, resolved);
          };

          const toggleSelect = (id: string): void => {
            const item = byId.get(id);
            // 未就绪素材不可选（processing / failed 仍展示，但不能进选择集）
            if (!item || !isAssetSelectable(item)) return;
            if (selectedSet.has(id)) {
              commitSelection(selectedIds.filter((entry) => entry !== id));
              return;
            }
            if (!multiple) {
              commitSelection([id]);
              return;
            }
            // 已达上限：静默忽略（blocked 态由 isBlocked 表达，已选项永远可取消）
            if (maxSelected > 0 && selectedIds.length >= maxSelected) return;
            commitSelection([...selectedIds, id]);
          };

          const selectAllVisible = (): void => {
            const next = [...selectedIds];
            for (const item of visible) {
              if (!isAssetSelectable(item) || next.includes(item.id)) continue;
              if (maxSelected > 0 && next.length >= maxSelected) break;
              next.push(item.id);
            }
            commitSelection(next);
          };

          const patchFilter = (patch: Partial<AssetFilter>): void => {
            setState({ ...patch, page: 1 });
          };

          const ctx: AssetLibraryContext = {
            ...base,
            items,
            folders,
            filtered,
            visible,
            total: filtered.length,
            emptyReason: resolveEmptyReason(items.length, filtered.length),

            query,
            kinds,
            tags,
            folderId,
            setQuery: (next) => {
              if (next === query) return;
              patchFilter({ query: next });
            },
            toggleKind: (kind) => {
              const next = kinds.includes(kind)
                ? kinds.filter((entry) => entry !== kind)
                : [...kinds, kind];
              patchFilter({ kinds: next });
            },
            setKinds: (next) => {
              if (next.length === kinds.length && next.every((k) => kinds.includes(k))) return;
              patchFilter({ kinds: next });
            },
            toggleTag: (tag) => {
              const next = tags.includes(tag)
                ? tags.filter((entry) => entry !== tag)
                : [...tags, tag];
              patchFilter({ tags: next });
            },
            setTags: (next) => {
              if (next.length === tags.length && next.every((t) => tags.includes(t))) return;
              patchFilter({ tags: next });
            },
            setFolder: (nextFolderId) => {
              if (nextFolderId === folderId) return;
              patchFilter({ folderId: nextFolderId });
            },
            clearFilters: () => {
              if (!query && !kinds.length && !tags.length && !folderId) return;
              patchFilter({ query: "", kinds: [], tags: [], folderId: null });
            },
            hasFilters: Boolean(query || kinds.length || tags.length || folderId),

            sortKey: sort.key,
            sortDir: sort.dir,
            setSort: (key, dir) => {
              const nextDir: AssetSortDir =
                dir ??
                (key === sort.key
                  ? sort.dir === "asc"
                    ? "desc"
                    : "asc"
                  : key === "createdAt"
                    ? "desc"
                    : "asc");
              if (key === sort.key && nextDir === sort.dir) return;
              setState({ sortKey: key, sortDir: nextDir });
            },

            view,
            setView: (next) => {
              if (next === view) return;
              setState({ view: next });
            },

            page: paged.page,
            pageSize,
            pageCount: paged.pageCount,
            setPage: (next) => {
              if (next === paged.page) return;
              setState({ page: next });
            },
            setPageSize: (next) => {
              if (next === pageSize) return;
              setState({ pageSize: next, page: 1 });
            },

            selectedIds,
            selectedItems: resolveItems(selectedIds),
            isSelected: (id) => selectedSet.has(id),
            toggleSelect,
            selectAllVisible,
            clearSelection: () => {
              if (!selectedIds.length) return;
              commitSelection([]);
            },
            maxSelected,
            isSelectable: isAssetSelectable,
            isBlocked: (item) =>
              isAssetSelectable(item) &&
              maxSelected > 0 &&
              selectedIds.length >= maxSelected &&
              !selectedSet.has(item.id),

            activeId: typeof state.activeId === "string" ? state.activeId : null,
            setActiveId: (id) => {
              setState({ activeId: id });
            },

            requestUpload: (files) => {
              onUpload?.(files);
              emitRef.current("onUploadRequest", files);
            },
            requestAction: (action, payload) => {
              onAssetAction?.(action, payload);
            },
            previewId:
              typeof state.previewId === "string" ? state.previewId : null,
            openPreview: (id) => setState({ previewId: id }),
            closePreview: () => setState({ previewId: null }),
          };

          return ctx as unknown as PluginContext<AssetLibraryCoreProps, unknown>;
        },
        [
          items,
          folders,
          isControlled,
          controlledIds,
          maxSelected,
          multiple,
          onSelectionChange,
          onUpload,
          onAssetAction,
        ]
      );

      const runtime = usePluginRuntime<AssetLibraryCoreProps, unknown>({
        plugins: defaultPlugins as unknown as Plugin<AssetLibraryCoreProps, unknown>[],
        props,
        initialState,
        containerRef,
        enableDebug,
        extendContext,
      });

      emitRef.current = (hook, ...args) => {
        const exec = runtime.execute as unknown as (
          name: string,
          ...rest: unknown[]
        ) => Promise<unknown>;
        void exec(hook, ...args);
      };

      const context = runtime.context as unknown as AssetLibraryContext;

      // 页大小随宿主动态调整（受控 prop → state），只在不一致时同步
      useEffect(() => {
        if (pageSizeProp === undefined) return;
        if (pageSizeProp === context.pageSize) return;
        runtime.setState({ pageSize: pageSizeProp, page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [pageSizeProp]);

      const cards = useMemo<AssetCardView[]>(() => {
        const selectedSet = new Set(context.selectedIds);
        const count = context.selectedIds.length;
        return context.visible.map((item, index) => {
          const selectable = isAssetSelectable(item);
          return {
            item,
            index,
            selected: selectedSet.has(item.id),
            selectable,
            blocked:
              selectable &&
              maxSelected > 0 &&
              count >= maxSelected &&
              !selectedSet.has(item.id),
            active: context.activeId === item.id,
          };
        });
      }, [context.visible, context.selectedIds, context.activeId, maxSelected]);

      const plugins = runtime.orderedPlugins as unknown as AssetPlugin[];
      const slots = useMemo(
        () =>
          plugins.length
            ? buildAssetSlots(plugins, context, context.emptyReason)
            : EMPTY_SLOTS,
        [plugins, context]
      );

      const activate = useCallback(
        (id: string) => {
          const item = context.items.find((entry) => entry.id === id);
          if (!item) return;
          onItemActivate?.(item);
          emitRef.current("onAssetActivate", item);
        },
        [context.items, onItemActivate]
      );

      return (
        <WrappedComponent
          {...props}
          ref={ref}
          containerRefExternal={containerRef}
          cards={cards}
          slots={slots}
          emptyReason={context.emptyReason}
          view={context.view}
          page={context.page}
          selectedIds={context.selectedIds}
          maxSelected={maxSelected}
          multiple={multiple}
          onToggleCard={context.toggleSelect}
          onActivateCard={activate}
          onFocusCard={context.setActiveId}
        />
      );
    }
  );

  WithPluginsComponent.displayName = "withAssetLibraryPlugins";
  return WithPluginsComponent;
}

/** 别名：与其它包的 withXxxPlugins 命名保持一致 */
export const withAssetLibraryPlugins = withPlugins;
