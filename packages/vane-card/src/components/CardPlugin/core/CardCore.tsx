/**
 * CardCore - 卡片核心组件
 *
 * 职责：
 * 1. 管理卡片基础布局和渲染
 * 2. 提供生命周期钩子
 * 3. 管理 DOM 引用
 * 4. 维护基本状态
 *
 * 设计原则：
 * - 保持核心功能简单纯粹
 * - 所有扩展功能通过插件实现
 * - 提供完整的上下文供插件使用
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

// ============ Props 定义 ============

export interface CardCoreProps<T = any> {
  // ===== 数据相关 =====
  /**
   * 卡片唯一标识
   */
  cardId: string;

  /**
   * 卡片数据
   */
  data?: T;

  /**
   * 渲染函数
   */
  renderContent?: (data: T, context: any) => React.ReactNode;

  // ===== 布局配置 =====
  /**
   * 布局方向
   */
  layout?: "vertical" | "horizontal";

  /**
   * 内边距
   */
  padding?:
    | number
    | { top?: number; right?: number; bottom?: number; left?: number };

  // ===== 样式相关 =====
  /**
   * 容器样式
   */
  containerStyle?: React.CSSProperties;

  /**
   * 容器类名
   */
  containerClassName?: string;

  // ===== 生命周期钩子（由插件注入） =====
  onMount?: () => void;
  onUnmount?: () => void;
  onClick?: (event: React.MouseEvent) => void;
  onHover?: (isHovered: boolean) => void;
  onVisibilityChange?: (isVisible: boolean) => void;

  // ===== 扩展功能 =====
  /**
   * 子元素（用于插件渲染覆盖层等）
   */
  children?: React.ReactNode;

  /**
   * 外部容器引用（供 HOC 传入）
   */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;

  /**
   * 是否启用调试模式
   */
  debug?: boolean;
}

// ============ Ref 暴露接口 ============

export interface CardCoreRef {
  /**
   * 获取卡片容器 DOM
   */
  getContainer: () => HTMLDivElement | null;

  /**
   * 强制更新
   */
  forceUpdate: () => void;

  /**
   * 获取卡片尺寸
   */
  getSize: () => { width: number; height: number };
}

// ============ 核心组件实现 ============

const CardCore = forwardRef<CardCoreRef, CardCoreProps>(function CardCore<
  T = any
>(props: CardCoreProps<T>, ref: React.ForwardedRef<CardCoreRef>) {
  const {
    cardId,
    data,
    renderContent,
    layout = "vertical",
    padding = 0,
    containerStyle,
    containerClassName,
    onMount,
    onUnmount,
    onClick,
    onHover,
    onVisibilityChange,
    children,
    containerRefExternal,
    debug = false,
  } = props;

  // ===== Refs =====
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = containerRefExternal || internalContainerRef;
  const isHoveredRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ===== State =====
  const [isVisible, setIsVisible] = useState(false);
  const [, forceUpdateState] = useState({});

  // ===== 计算内边距 =====
  const paddingValues = React.useMemo(() => {
    if (typeof padding === "number") {
      return { top: padding, right: padding, bottom: padding, left: padding };
    }
    return {
      top: padding.top || 0,
      right: padding.right || 0,
      bottom: padding.bottom || 0,
      left: padding.left || 0,
    };
  }, [padding]);

  // ===== 点击处理 =====
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (onClick) {
        onClick(event);
      }
    },
    [onClick]
  );

  // ===== 悬停处理 =====
  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
    if (onHover) {
      onHover(true);
    }
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    if (onHover) {
      onHover(false);
    }
  }, [onHover]);

  // ===== 可见性监听 =====
  useEffect(() => {
    if (!onVisibilityChange || !containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0]?.isIntersecting || false;
        setIsVisible(isIntersecting);
        onVisibilityChange(isIntersecting);
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [onVisibilityChange, containerRef]);

  // ===== 挂载时初始化 =====
  useEffect(() => {
    if (onMount) onMount();
    if (debug) console.log(`[CardCore] mounted: ${cardId}`);

    return () => {
      if (onUnmount) onUnmount();
      if (debug) console.log(`[CardCore] unmounted: ${cardId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== 暴露方法 =====
  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
    forceUpdate: () => forceUpdateState({}),
    getSize: () => {
      const container = containerRef.current;
      if (!container) return { width: 0, height: 0 };
      return {
        width: container.offsetWidth,
        height: container.offsetHeight,
      };
    },
  }));

  // ===== 布局类名 =====
  const layoutClass =
    layout === "horizontal" ? "card-horizontal" : "card-vertical";

  // ===== 渲染 =====
  return (
    <div
      ref={containerRef as React.LegacyRef<HTMLDivElement>}
      data-card-id={cardId}
      className={`card-core ${layoutClass} ${containerClassName || ""}`}
      style={{
        position: "relative",
        boxSizing: "border-box",
        paddingTop: paddingValues.top,
        paddingRight: paddingValues.right,
        paddingBottom: paddingValues.bottom,
        paddingLeft: paddingValues.left,
        ...containerStyle,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 主内容区 */}
      {renderContent && data && renderContent(data, { isVisible })}
      {children}
    </div>
  );
});

export default CardCore;
