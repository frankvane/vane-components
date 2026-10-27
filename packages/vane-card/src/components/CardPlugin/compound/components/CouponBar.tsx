import React, { useState } from "react";
import { useProductCard } from "../ProductCard";
import { usePluginSlot } from "../../plugins/SlotsContext";

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
      default: { bg: "#f8f9fa", border: "#dee2e6", text: "#495057", accent: "#007bff" },
      primary: { bg: "#e3f2fd", border: "#2196f3", text: "#1976d2", accent: "#1976d2" },
      success: { bg: "#e8f5e8", border: "#4caf50", text: "#2e7d32", accent: "#2e7d32" },
      warning: { bg: "#fff3e0", border: "#ff9800", text: "#f57c00", accent: "#f57c00" },
    };
    return themes[theme];
  };

  // 获取尺寸样式
  const getSizeStyles = () => {
    const sizes = {
      small: { fontSize: "12px", padding: "6px 8px", gap: "6px" },
      medium: { fontSize: "13px", padding: "8px 12px", gap: "8px" },
      large: { fontSize: "14px", padding: "10px 16px", gap: "10px" },
    };
    return sizes[size];
  };

  const themeColors = getThemeColors();
  const sizeStyles = getSizeStyles();

  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: layout === "vertical" ? "column" : "row",
    gap: sizeStyles.gap,
    ...style,
  };

  const couponStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: themeColors.bg,
    border: `1px solid ${themeColors.border}`,
    borderRadius: "6px",
    padding: sizeStyles.padding,
    fontSize: sizeStyles.fontSize,
    color: themeColors.text,
    cursor: "pointer",
    transition: "all 0.2s ease",
    minWidth: layout === "horizontal" ? "120px" : "auto",
    position: "relative",
  };

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
    <div className={`coupon-bar coupon-bar--${layout} coupon-bar--${size} ${className}`} style={containerStyles}>
      {visibleCoupons.map((coupon) => {
        const isExpanded = expandedCoupon === coupon.id;
        const isUnavailable = coupon.minAmount && totalAmount < coupon.minAmount;
        
        return (
          <div key={coupon.id} style={{ position: "relative" }}>
            <div
              style={{
                ...couponStyles,
                opacity: isUnavailable ? 0.6 : 1,
                borderColor: coupon.isApplied ? themeColors.accent : themeColors.border,
                backgroundColor: coupon.isApplied ? `${themeColors.accent}15` : themeColors.bg,
              }}
              onClick={() => handleCouponClick(coupon)}
              title={coupon.description || coupon.title}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                <span style={{ fontWeight: 600, color: themeColors.accent }}>
                  {formatDiscount(coupon)}
                </span>
                <span style={{ fontSize: "0.9em" }}>{coupon.title}</span>
                {coupon.minAmount && (
                  <span style={{ fontSize: "0.8em", color: "#999" }}>
                    满{currency}{coupon.minAmount}
                  </span>
                )}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {showExpiry && coupon.expiry && (
                  <span style={{ fontSize: "0.8em", color: "#999" }}>
                    至{formatExpiry(coupon.expiry)}
                  </span>
                )}
                {!coupon.isApplied && !isUnavailable && (
                  <button
                    style={{
                      background: themeColors.accent,
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "0.8em",
                      cursor: "pointer",
                    }}
                    onClick={(e) => handleApplyCoupon(e, coupon)}
                  >
                    领取
                  </button>
                )}
                {coupon.isApplied && (
                  <span style={{ fontSize: "0.8em", color: themeColors.accent }}>
                    已应用
                  </span>
                )}
              </div>
            </div>

            {/* 展开的详细信息 */}
            {isExpanded && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#fff",
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  color: "#666",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  marginTop: "2px",
                }}
              >
                {coupon.description && (
                  <div style={{ marginBottom: "4px" }}>{coupon.description}</div>
                )}
                {showCode && coupon.code && (
                  <div style={{ marginBottom: "4px" }}>
                    优惠码: <code style={{ background: "#f5f5f5", padding: "1px 4px" }}>{coupon.code}</code>
                  </div>
                )}
                {coupon.minAmount && (
                  <div style={{ color: totalAmount >= coupon.minAmount ? "#28a745" : "#dc3545" }}>
                    最低消费: {currency}{coupon.minAmount} 
                    {totalAmount >= coupon.minAmount ? " ✓" : ` (还差${currency}${coupon.minAmount - totalAmount})`}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 显示更多优惠券的提示 */}
      {availableCoupons.length > maxVisible && (
        <div
          style={{
            ...couponStyles,
            backgroundColor: "transparent",
            border: `1px dashed ${themeColors.border}`,
            justifyContent: "center",
            color: "#999",
            minWidth: "80px",
          }}
        >
          +{availableCoupons.length - maxVisible}个
        </div>
      )}
      {priceAreaNodes.length > 0 && (
        <div className="vc-price__area" data-slot="price-area" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {priceAreaNodes.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};