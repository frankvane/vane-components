import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type {
  AssetCardView,
  AssetLibraryCoreProps,
  AssetLibraryCoreRef,
  AssetSlots,
} from "./plugins/types";
import { EMPTY_SLOTS } from "./plugins/types";

/**
 * 素材库核心组件。
 *
 * 只做三件事：渲染网格骨架、导航生命周期、暴露 ref。
 * 素材的筛选/排序/分页/选择状态全部在 withAssetLibraryPlugins 里（domain.ts 纯函数），
 * 视觉长尾（角标 / 操作钮 / 元信息 / 工具栏 / 页脚 / 空态 / 浮层）全部走槽位。
 *
 * 键盘导航放在核心里而不是插件：方向键的步长 = 网格列数，列数是网格几何的一部分，
 * 插件拿不到真实列数就不该假装能导航。
 */

const EMPTY_CARDS: AssetCardView[] = [];
const DEFAULT_COLUMN_WIDTH = 176;
const DEFAULT_GAP = 12;

/** 从 computedStyle 读真实列数；无布局引擎（happy-dom）时退回 1 */
function readColumnCount(el: HTMLElement | null): number {
  if (!el || typeof window === "undefined") return 1;
  const template = window.getComputedStyle(el).gridTemplateColumns;
  if (!template || template === "none") return 1;
  const count = template.trim().split(/\s+/).filter(Boolean).length;
  return count > 0 ? count : 1;
}

interface AssetCardProps {
  card: AssetCardView;
  slots: AssetSlots;
  tabIndex: number;
  onToggle?: (id: string) => void;
  onActivate?: (id: string) => void;
  onFocus?: (id: string) => void;
}

function AssetCard({ card, slots, tabIndex, onToggle, onActivate, onFocus }: AssetCardProps) {
  const { item } = card;
  const title = item.title?.trim() || item.id;
  const cover = item.kind === "video" ? (item.thumbnail ?? "") : item.src;
  const [broken, setBroken] = useState(false);

  // 换素材后重置失败态：否则同一张卡复用到新图时还是占位块
  useEffect(() => setBroken(false), [cover]);

  return (
    <div
      role="option"
      aria-selected={card.selected}
      aria-disabled={card.blocked || undefined}
      aria-label={title}
      tabIndex={tabIndex}
      data-asset-id={item.id}
      data-active={card.active ? "true" : "false"}
      data-selected={card.selected ? "true" : "false"}
      data-blocked={card.blocked ? "true" : "false"}
      data-kind={item.kind}
      data-status={item.status ?? "ready"}
      className="vc-asset-card"
      onClick={() => onToggle?.(item.id)}
      onDoubleClick={() => onActivate?.(item.id)}
      onFocus={() => onFocus?.(item.id)}
    >
      <div className="vc-asset-card__media">
        {cover && !broken ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="vc-asset-card__ph" aria-hidden="true">
            {item.kind === "video" ? "video" : "image"}
          </span>
        )}
        {slots.cardOverlay(item, card.index)}
        {slots.cardActions(item, card.index)}
      </div>
      <div className="vc-asset-card__body">
        <span className="vc-asset-card__title" title={title}>
          {title}
        </span>
        {slots.cardMeta(item, card.index)}
      </div>
    </div>
  );
}

export const AssetLibraryCore = forwardRef<AssetLibraryCoreRef, AssetLibraryCoreProps>(
  (props, ref) => {
    const {
      cards = EMPTY_CARDS,
      slots = EMPTY_SLOTS,
      emptyReason,
      multiple = true,
      view = "grid",
      columnWidth = DEFAULT_COLUMN_WIDTH,
      gap = DEFAULT_GAP,
      selectedIds = [],
      onToggleCard,
      onActivateCard,
      onFocusCard,
      containerClassName,
      containerStyle,
      onMount,
      onUnmount,
      debug,
      containerRefExternal,
    } = props;

    const localRef = useRef<HTMLDivElement | null>(null);
    const containerRef = containerRefExternal ?? localRef;
    const gridRef = useRef<HTMLDivElement | null>(null);
    const [, setTick] = useState(0);
    // 只有键盘驱动才把焦点搬到新卡片；点击/程序化改动抢焦点会让页面乱跳
    const keyboardNavRef = useRef(false);

    useImperativeHandle(
      ref,
      () => ({
        getContainer: () => containerRef.current,
        forceUpdate: () => setTick((t) => t + 1),
        getSize: () => ({
          width: containerRef.current?.offsetWidth ?? 0,
          height: containerRef.current?.offsetHeight ?? 0,
        }),
        getSelection: () => selectedIds,
        getVisibleIds: () => cards.map((card) => card.item.id),
      }),
      [containerRef, cards, selectedIds]
    );

    useEffect(() => {
      if (debug) console.debug("[AssetLibraryCore] mounted");
      onMount?.();
      return () => onUnmount?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!keyboardNavRef.current) return;
      keyboardNavRef.current = false;
      const el = gridRef.current?.querySelector<HTMLElement>('[data-active="true"]');
      el?.focus();
    }, [cards]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!cards.length) return;
      const current = Math.max(
        0,
        cards.findIndex((card) => card.active)
      );
      const columns = readColumnCount(gridRef.current);
      let next = -1;
      switch (event.key) {
        case "ArrowRight":
          next = current + 1;
          break;
        case "ArrowLeft":
          next = current - 1;
          break;
        case "ArrowDown":
          next = current + columns;
          break;
        case "ArrowUp":
          next = current - columns;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = cards.length - 1;
          break;
        case " ":
        case "Spacebar":
          next = current;
          onToggleCard?.(cards[current].item.id);
          break;
        case "Enter":
          onActivateCard?.(cards[current].item.id);
          return;
        default:
          return;
      }
      event.preventDefault();
      if (next < 0 || next >= cards.length) return;
      keyboardNavRef.current = true;
      onFocusCard?.(cards[next].item.id);
    };

    const tabbableId =
      cards.find((card) => card.active)?.item.id ?? cards[0]?.item.id ?? null;

    return (
      <div
        ref={containerRef as React.Ref<HTMLDivElement>}
        className={["vc-asset", containerClassName].filter(Boolean).join(" ")}
        data-view={view}
        style={containerStyle}
      >
        {slots.dropzone}
        {slots.toolbar}
        <div
          ref={gridRef}
          className="vc-asset__grid"
          data-view={view}
          data-testid="asset-grid"
          role="listbox"
          aria-multiselectable={multiple || undefined}
          aria-label="素材列表"
          style={
            {
              gap,
              "--vc-asset-col": `${columnWidth}px`,
            } as React.CSSProperties
          }
          onKeyDown={handleKeyDown}
        >
          {cards.map((card) => (
            <AssetCard
              key={card.item.id}
              card={card}
              slots={slots}
              tabIndex={card.item.id === tabbableId ? 0 : -1}
              onToggle={onToggleCard}
              onActivate={onActivateCard}
              onFocus={onFocusCard}
            />
          ))}
        </div>
        {cards.length === 0 ? (
          <div className="vc-asset__empty" role="status" data-reason={emptyReason ?? "empty"}>
            {slots.empty.length > 0 ? (
              slots.empty
            ) : (
              <p>{emptyReason === "filtered" ? "没有符合条件的素材" : "素材库还是空的"}</p>
            )}
          </div>
        ) : null}
        {slots.footer}
        {slots.overlay}
      </div>
    );
  }
);

AssetLibraryCore.displayName = "AssetLibraryCore";
