import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useSignInSlot } from "./plugins/slots";
import type { SignInCoreProps, SignInCoreRef } from "./plugins/types";

/**
 * SignInCore - 每日签到核心组件（五段式布局壳）。
 *
 * 铁律：核心只做「渲染 + 生命周期转发」，所有可变能力都交给插件。
 *  1. 头部区（renderHeader）：连签数 / 积分 / 等级 / 倒计时
 *  2. 日历区（renderCalendar）：日历条 / 月历网格 / 漏签标记
 *  3. 奖励区（renderRewards）：逐日奖励预告 / 领取 / 里程碑
 *  4. 操作区（renderActions）：签到 CTA / 补签 / 分享 / 提醒 / 邀请
 *  5. 底部区（renderFooter）：规则展开 / 领取记录
 *  6. overlay：内核 renderOverlay 经 withSignInPlugins 的 composeSlots 兜底，落在 children
 */
const SignInCore = forwardRef<SignInCoreRef, SignInCoreProps>(
  function SignInCore(props, ref) {
    const {
      children,
      containerClassName,
      containerStyle,
      containerRefExternal,
    } = props;

    const internalRef = useRef<HTMLDivElement>(null);
    const containerRef = containerRefExternal || internalRef;
    const [, forceTick] = useState(0);
    const forceUpdate = useCallback(() => forceTick((t) => t + 1), []);

    const header = useSignInSlot("renderHeader");
    const calendar = useSignInSlot("renderCalendar");
    const rewards = useSignInSlot("renderRewards");
    const actions = useSignInSlot("renderActions");
    const footer = useSignInSlot("renderFooter");

    useImperativeHandle(
      ref,
      () => ({
        getContainer: () => containerRef.current,
        forceUpdate,
        getSize: () => {
          const el = containerRef.current;
          return el
            ? { width: el.offsetWidth, height: el.offsetHeight }
            : { width: 0, height: 0 };
        },
      }),
      [forceUpdate]
    );

    return (
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        data-testid="si-root"
        className={`vs-signin ${containerClassName || ""}`}
        style={{
          // position/box-sizing 功能性保留；根节点自带底色与字色（ADR-13：内联背景必内联字色）
          position: "relative",
          boxSizing: "border-box",
          background: "#fff",
          color: "#1f2328",
          ...containerStyle,
        }}
      >
        {header.length > 0 && (
          <div
            className="vs-header"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "16px 16px 0",
            }}
          >
            {header}
          </div>
        )}

        {calendar.length > 0 && (
          <div className="vs-calendar" style={{ padding: "12px 16px" }}>
            {calendar}
          </div>
        )}

        {rewards.length > 0 && (
          <div className="vs-rewards" style={{ padding: "0 16px" }}>
            {rewards}
          </div>
        )}

        {actions.length > 0 && (
          <div
            className="vs-actions"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              padding: "12px 16px",
            }}
          >
            {actions}
          </div>
        )}

        {footer.length > 0 && (
          <div className="vs-footer" style={{ padding: "0 16px 16px" }}>
            {footer}
          </div>
        )}

        {/* overlay 钩子链产物（绝对定位层） */}
        {children}
      </div>
    );
  }
);

SignInCore.displayName = "SignInCore";

export { SignInCore };
export default SignInCore;
