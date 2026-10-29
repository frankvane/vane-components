import React, { useState } from "react";
import { useProductCard } from "../ProductCard";
import { usePluginSlot } from "../../plugins/slots";

export type CouponInfo = {
  id: string;
  title: string;
  description?: string;
  discount: number; // 折扣金额或百分比
  discountType: "amount" | "percentage"; // 折扣类型
  minAmount?: number; // 最低消费金额
  code?: string; // 优惠码
  expiry?: string; // 过期时间
  isApplied?: boolean; // 是否已应用
};

export type CouponBarProps = {
  className?: string;
  style?: React.CSSProperties;
  coupons?: CouponInfo[]; // 可用优惠券列表
  showExpiry?: boolean; // 是否显示过期时间
  showCode?: boolean; // 是否显示优惠码
  maxVisible?: number; // 最多显示几个优惠券
  layout?: "horizontal" | "vertical"; // 布局方式
  size?: "small" | "medium" | "large"; // 尺寸
  theme?: "default" | "primary" | "success" | "warning"; // 主题色
  onCouponClick?: (coupon: CouponInfo) => void; // 点击优惠券回调
  onCouponApply?: (coupon: CouponInfo) => void; // 应用优惠券回调
  currency?: string; // 货币符号
};

export const CouponBar: React.FC<CouponBarProps> = ({
  className = "",
  style,
  coupons = [],
  showExpiry = true,
  showCode = false,
  maxVisible = 3,
  layout = "horizontal",
  size = "medium",
  theme = "default",
  onCouponClick,
  onCouponApply,
  currency = "¥",
}) => {
  const { data, state } = useProductCard();
  const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null);
  const priceAreaNodes = usePluginSlot("priceArea");

  // 如果没有优惠券，不显示
  if (!coupons || coupons.length === 0) {
    return null;
  }

  // 获取当前商品价格，用于判断优惠券是否可用
  const currentPrice = Number(data?.price ?? 0);
  const quantity = state.quantity ?? 1;
  const totalAmount = currentPrice * quantity;

  // 过滤可用的优惠券
  const availableCoupons = coupons.filter(coupon => {
    if (coupon.minAmount && totalAmount < coupon.minAmount) {
      return false;
    }
    return true;
  });

  // 限制显示数量
  const visibleCoupons = availableCoupons.slice(0, maxVisible);

  // 格式化折扣显示
  const formatDiscount = (coupon: CouponInfo) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discount}折`;
    } else {
      return `${currency}${coupon.discount}`;
    }
  };

  // 格式化过期时间
  const formatExpiry = (expiry: string) => {
    const date = new Date(expiry);
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // 获取主题颜色
  const getThemeColors = () => {
    const themes = {
      default: { bg: "#f8f9fa", border: "#dee2e6", text: "#495057", accent: "#0056b3" },
      primary: { bg: "#e3f2fd", border: "#2196f3", text: "#1565c0", accent: "#1565c0" },
      success: { bg: "#e8f5e8", border: "#2e7d32", text: "#2e7d32", accent: "#2e7d32" },
      warning: { bg: "#fff3e0", border: "#b35c00", text: "#b35c00", accent: "#b35c00" },
    };
    return themes[theme];
  };

  const themeColors = getThemeColors();

  // 主题色是"用户可传"的动态值 → 以 CSS 变量下发；形状与间距回 class（见 components.css）
  const containerStyle = {
    "--vc-coupon-bg": themeColors.bg,
    "--vc-coupon-border": themeColors.border,
    "--vc-coupon-text": themeColors.text,
    "--vc-coupon-accent": themeColors.accent,
    "--vc-coupon-applied-bg": `${themeColors.accent}15`,
    ...style,
  } as React.CSSProperties;

  const handleCouponClick = (coupon: CouponInfo) => {
    if (expandedCoupon === coupon.id) {
      setExpandedCoupon(null);
    } else {
      setExpandedCoupon(coupon.id);
    }
    onCouponClick?.(coupon);
  };

  const handleApplyCoupon = (e: React.MouseEvent, coupon: CouponInfo) => {
    e.stopPropagation();
    onCouponApply?.(coupon);
  };

  return (
    <div
      className={`vc-coupon-bar vc-coupon-bar--${layout} vc-coupon-bar--${size} ${className}`.trim()}
      style={containerStyle}
    >
      {visibleCoupons.map((coupon) => {
        const isExpanded = expandedCoupon === coupon.id;
        const isUnavailable = Boolean(coupon.minAmount && totalAmount < coupon.minAmount);

        return (
          <div key={coupon.id} className="vc-coupon__wrap">
            <div
              className={`vc-coupon ${isUnavailable ? "is-unavailable" : ""} ${
                coupon.isApplied ? "is-applied" : ""
              }`
                .replace(/\s+/g, " ")
                .trim()}
              onClick={() => handleCouponClick(coupon)}
              title={coupon.description || coupon.title}
            >
              <div className="vc-coupon__main">
                <span className="vc-coupon__discount">{formatDiscount(coupon)}</span>
                <span className="vc-coupon__title">{coupon.title}</span>
                {coupon.minAmount && (
                  <span className="vc-coupon__min">
                    满{currency}
                    {coupon.minAmount}
                  </span>
                )}
              </div>

              <div className="vc-coupon__side">
                {showExpiry && coupon.expiry && (
                  <span className="vc-coupon__expiry">至{formatExpiry(coupon.expiry)}</span>
                )}
                {!coupon.isApplied && !isUnavailable && (
                  <button
                    type="button"
                    className="vc-coupon__apply"
                    onClick={(e) => handleApplyCoupon(e, coupon)}
                  >
                    领取
                  </button>
                )}
                {coupon.isApplied && <span className="vc-coupon__applied">已应用</span>}
              </div>
            </div>

            {/* 展开的详细信息 */}
            {isExpanded && (
              <div className="vc-coupon__detail">
                {coupon.description && (
                  <div className="vc-coupon__detail-line">{coupon.description}</div>
                )}
                {showCode && coupon.code && (
                  <div className="vc-coupon__detail-line">
                    优惠码: <code className="vc-coupon__code">{coupon.code}</code>
                  </div>
                )}
                {coupon.minAmount && (
                  <div
                    className={`vc-coupon__reach ${
                      totalAmount >= coupon.minAmount ? "is-ok" : ""
                    }`.trim()}
                  >
                    最低消费: {currency}
                    {coupon.minAmount}
                    {totalAmount >= coupon.minAmount
                      ? " ✓"
                      : ` (还差${currency}${coupon.minAmount - totalAmount})`}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 显示更多优惠券的提示 */}
      {availableCoupons.length > maxVisible && (
        <div className="vc-coupon-more">+{availableCoupons.length - maxVisible}个</div>
      )}
      {priceAreaNodes.length > 0 && (
        <div className="vc-price__area" data-slot="price-area">
          {priceAreaNodes.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};