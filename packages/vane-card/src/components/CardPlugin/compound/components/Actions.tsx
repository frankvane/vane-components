import React from "react";
import { useProductCard } from "../ProductCard";

export type ActionsProps = {
  className?: string;
  style?: React.CSSProperties;
};

export const Actions: React.FC<ActionsProps> = ({ className, style }) => {
  const { productId, state, setState } = useProductCard();

  const qty = productId ? state.cart[productId] ?? 0 : 0;
  const inWishlist = productId ? state.wishlist[productId] ?? false : false;

  const addToCart = () => {
    if (!productId) return;
    setState((s) => ({
      ...s,
      cart: { ...s.cart, [productId]: (s.cart[productId] ?? 0) + 1 },
    }));
  };

  const toggleWishlist = () => {
    if (!productId) return;
    setState((s) => ({
      ...s,
      wishlist: { ...s.wishlist, [productId]: !inWishlist },
    }));
  };

  return (
    <div className={`vc-actions ${className ?? ""}`.trim()} style={style}>
      <button type="button" className="vc-btn" onClick={addToCart}>
        加入购物车 ({qty})
      </button>
      <button type="button" className="vc-btn" onClick={toggleWishlist}>
        {inWishlist ? "取消心愿" : "加入心愿"}
      </button>
    </div>
  );
};