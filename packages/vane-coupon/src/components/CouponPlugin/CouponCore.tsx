import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { CouponCoreProps, CouponCoreRef } from "./plugins/types";

/**
 * 优惠券核心组件。
 *
 * core 只渲染票券本体两块：① 面额区（面额 + 门槛）② 信息区（标题）。
 * 角标 / 规则 / 有效期 / 领取按钮等长尾一律走插槽（before/after/footer/overlay），
 * 由插件或宿主注入 —— core 因此保持薄而稳定。
 *
 * 铁律：核心只做「渲染 + 转发生命周期」，可变需求交给插件。
 */
export const CouponCore = forwardRef<CouponCoreRef, CouponCoreProps>(
  (props, ref) => {
    const {
      coupon,
      slots,
      phase,
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
        getPhase: () => phase,
      }),
      [phase]
    );

    useEffect(() => {
      if (debug) console.debug("[CouponCore] mounted");
      setMounted(true);
      onMount?.();
      return () => onUnmount?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isDiscount = coupon.amountType === "discount";
    const thresholdText =
      coupon.thresholdText ??
      (coupon.threshold && coupon.threshold > 0
        ? `满${coupon.threshold}可用`
        : "无门槛");

    return (
      <div
        // 断言：React 18/19 的 RefObject<T> 在 current 是否含 null 上定义不同，
        // 这里 containerRef 恒为 RefObject<HTMLDivElement | null>，与 DOM ref 兼容。
        ref={containerRef as React.Ref<HTMLDivElement>}
        className={
          containerClassName
            ? `vc-coupon ${containerClassName}`
            : "vc-coupon"
        }
        data-testid="coupon-root"
        data-phase={phase ?? ""}
        style={{ position: "relative", boxSizing: "border-box", ...containerStyle }}
      >
        {slots?.before}

        <div className="vc-coupon__body" data-testid="coupon-body">
          <div className="vc-coupon__face">
            <div className="vc-coupon__amount" data-testid="coupon-amount">
              {isDiscount ? (
                <>
                  <span className="vc-coupon__amount-value">{coupon.amount}</span>
                  <span className="vc-coupon__amount-unit">折</span>
                </>
              ) : (
                <>
                  <span className="vc-coupon__amount-currency">¥</span>
                  <span className="vc-coupon__amount-value">{coupon.amount}</span>
                </>
              )}
            </div>
            <div className="vc-coupon__threshold" data-testid="coupon-threshold">
              {thresholdText}
            </div>
          </div>
          <div className="vc-coupon__info">
            <div className="vc-coupon__title" data-testid="coupon-title">
              {coupon.title}
            </div>
          </div>
        </div>

        {slots?.after}
        {slots?.footer}
        {slots?.overlay}
        {children}

        {/* 供 demo/体检脚本读取的挂载标记 */}
        {mounted ? <span data-testid="coupon-mounted" hidden /> : null}
      </div>
    );
  }
);

CouponCore.displayName = "CouponCore";
