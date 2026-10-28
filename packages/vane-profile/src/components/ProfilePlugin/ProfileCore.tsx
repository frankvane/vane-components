import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useProfileContext, useProfileSlot } from "./plugins/slots";
import type { ProfileCoreProps, ProfileCoreRef } from "./plugins/types";

/**
 * ProfileCore - 个人主页核心组件（三段式布局壳）。
 *
 * 铁律：核心只做「三段式布局 + 生命周期转发」，所有可变能力都交给插件。
 *  1. 头图区（BannerSlot / VerifyBadge 浮层）
 *  2. 数据行 + 关注回显（StatRow / FollowEcho）
 *  3. 页签栏（TabSync）+ 内容容器（children，随 activeTab 联动重渲染）
 *
 * 领域槽由 Core 经 useProfileSlot 直接消费；内容区子组件经 useProfileContext
 * 订阅 activeTab，实现「页签切换 → 内容区重渲染」。
 */
const ProfileCore = forwardRef<ProfileCoreRef, ProfileCoreProps>(
  function ProfileCore(props, ref) {
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

    // 领域槽：结构化段落
    const bannerArea = useProfileSlot("renderBannerArea");
    const bioArea = useProfileSlot("renderBioArea");
    const statRow = useProfileSlot("renderStatRow");
    const tabBar = useProfileSlot("renderTabBar");
    const badgeArea = useProfileSlot("renderBadgeArea");
    const followArea = useProfileSlot("renderFollowArea");
    const contentSlot = useProfileSlot("renderContentArea");

    // 当前激活页签（供 ref 读取，并订阅 context 变化）
    const ctx = useProfileContext();
    const activeTabRef = useRef<string | null>(ctx?.activeTab ?? null);
    activeTabRef.current = ctx?.activeTab ?? null;

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
        getActiveTab: () => activeTabRef.current,
      }),
      [forceUpdate]
    );

    return (
      <div
        ref={containerRef}
        className={`vp-profile ${containerClassName || ""}`}
        style={{
          // position/box-sizing 是功能性的（领域槽浮层靠它定位），不引 style.css 也保留内联
          position: "relative",
          boxSizing: "border-box",
          ...containerStyle,
        }}
      >
        {/* 头图区：封面 / 渐变 + 认证徽标浮层（右上角） */}
        <div className="vp-banner-area" style={{ position: "relative" }}>
          {bannerArea}
          {badgeArea.length > 0 && (
            <div
              className="vp-badge-area"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {badgeArea}
            </div>
          )}
        </div>

        {/* 简介区：昵称 / 签名 / 社交 / 标签（renderBioArea，排在头图与数据行之间）
            用 flex 列 + 固定 gap，保证多个 bio 插件（BioSlot / SocialLinks / TagList …）
            之间间距一致，不会因各自无外边距而紧凑挤在一起 */}
        {bioArea.length > 0 && (
          <div
            className="vp-bio-area"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "12px 16px 0",
            }}
          >
            {bioArea}
          </div>
        )}

        {/* 数据行 + 关注回显 */}
        <div
          className="vp-meta-area"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 16px",
          }}
        >
          <div className="vp-stat-row">{statRow}</div>
          <div
            className="vp-follow-area"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {followArea}
          </div>
        </div>

        {/* 页签栏 */}
        {tabBar.length > 0 && (
          <div className="vp-tab-bar" style={{ padding: "0 16px" }}>
            {tabBar}
          </div>
        )}

        {/* 内容区：插件贡献（renderContentArea，随 activeTab 联动）优先；
            无内容插件时回退到 children（如 TabSync 驱动的文本区） */}
        <div className="vp-content-area" style={{ padding: "16px" }}>
          {contentSlot.length > 0 ? contentSlot : children}
        </div>
      </div>
    );
  }
);

ProfileCore.displayName = "ProfileCore";

export default ProfileCore;
