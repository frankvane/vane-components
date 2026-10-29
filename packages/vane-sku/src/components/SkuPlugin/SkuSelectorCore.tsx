import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  SkuAttribute,
  SkuSelectorCoreProps,
  SkuSelectorCoreRef,
  SkuSelection,
} from "./plugins/types";

/**
 * 规格选择核心组件（B5）。
 *
 * core 只渲染两块本体：① 规格按钮组（含禁用态）② 选中摘要。
 * 价格浮层 / 限购提示条 / 加购按钮等长尾一律走插槽（before/overlay/after/footer），
 * 由插件或宿主注入 —— core 因此保持薄而稳定（SOP①）。
 *
 * 铁律：核心只做「渲染 + 转发生命周期」，可变需求交给插件。
 */
export const SkuSelectorCore = forwardRef<
  SkuSelectorCoreRef,
  SkuSelectorCoreProps
>((props, ref) => {
  const {
    attributes,
    selection = {},
    disabledMap = {},
    variant = null,
    onSelectOption,
    slots,
    children,
    containerClassName,
    containerStyle,
    onMount,
    onUnmount,
    debug,
    containerRefExternal,
  } = props;

  const localRef = useRef<HTMLDivElement | null>(null);
  const containerRef = containerRefExternal ?? localRef;
  const [, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      getContainer: () => containerRef.current,
      forceUpdate: () => setTick((t) => t + 1),
      getSize: () => ({
        width: containerRef.current?.offsetWidth ?? 0,
        height: containerRef.current?.offsetHeight ?? 0,
      }),
      getSelection: () => selection,
      getVariant: () => variant,
    }),
    [selection, variant]
  );

  useEffect(() => {
    if (debug) console.debug("[SkuSelectorCore] mounted");
    setMounted(true);
    onMount?.();
    return () => onUnmount?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelOf = (attr: SkuAttribute, optionId: string) =>
    attr.options.find((o) => o.id === optionId)?.label ?? optionId;

  const selectedEntries = attributes
    .map((a) => ({ attr: a, optionId: selection[a.name] }))
    .filter((e): e is { attr: SkuAttribute; optionId: string } =>
      Boolean(e.optionId)
    );

  return (
    <div
      // 断言：React 18/19 的 RefObject<T> 在 current 是否含 null 上定义不同，
      // 这里 containerRef 恒为 RefObject<HTMLDivElement | null>，与 DOM ref 兼容。
      ref={containerRef as React.Ref<HTMLDivElement>}
      className={containerClassName}
      style={{ position: "relative", ...containerStyle }}
    >
      {slots?.before}

      <div data-testid="sku-groups">
        {attributes.map((attr) => (
          <div
            key={attr.name}
            data-testid={`sku-attr-${attr.name}`}
            style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}
          >
            <span style={{ fontSize: 12, color: "#4a5056", minWidth: 48 }}>
              {attr.name}
            </span>
            {attr.options.map((opt) => {
              const selected = selection[attr.name] === opt.id;
              const disabled = disabledMap[attr.name]?.has(opt.id) ?? false;
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`sku-opt-${attr.name}-${opt.id}`}
                  data-selected={selected ? "true" : "false"}
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => onSelectOption?.(attr.name, opt.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: selected ? "2px solid #2b7de9" : "1px solid #d0d4da",
                    background: disabled ? "#f2f3f5" : selected ? "#e8f0fe" : "#fff",
                    // 禁用态靠「灰底 + 灰字 + not-allowed」表达，不再叠 opacity：
                    // #9aa0a6 再乘 0.6 落到 1.63:1，白卡上等于看不见（WCAG 要 ≥3:1）
                    color: disabled ? "#6f757b" : "#1f2328",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: 12,
                  }}
                >
                  {opt.image ? (
                    <img
                      src={opt.image}
                      alt=""
                      style={{ width: 16, height: 16, objectFit: "cover", borderRadius: 3 }}
                    />
                  ) : null}
                  {opt.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div data-testid="sku-summary" style={{ fontSize: 12, color: "#3c4147", marginTop: 4 }}>
        {selectedEntries.length ? (
          <span>
            已选：
            {selectedEntries
              .map((e) => `${e.attr.name}:${labelOf(e.attr, e.optionId)}`)
              .join(" / ")}
            {variant ? (
              <span data-testid="sku-summary-variant">
                （SKU：{variant.sku}
                {typeof variant.price === "number" ? ` · ¥${variant.price}` : ""}
                {typeof variant.stock === "number" ? ` · 库存 ${variant.stock}` : ""}）
              </span>
            ) : (
              <span data-testid="sku-summary-novariant">（无可售组合）</span>
            )}
          </span>
        ) : (
          <span>请选择规格</span>
        )}
      </div>

      {slots?.overlay}
      {slots?.after}
      {slots?.footer}
      {children}

      {/* 供 demo/体检脚本读取的挂载标记 */}
      {mounted ? <span data-testid="sku-mounted" hidden /> : null}
    </div>
  );
});

SkuSelectorCore.displayName = "SkuSelectorCore";

export type { SkuSelection };
