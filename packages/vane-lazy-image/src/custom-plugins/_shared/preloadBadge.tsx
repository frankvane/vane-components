import React from "react";

/**
 * 生成一个轮询徽标组件：每隔 400ms 统计 <head> 中 id 以 prefix 开头的 <link> 数量，
 * 用于把「真实但肉眼不可见」的网络层插件（preload / preconnect 注入）在卡片上可视化。
 */
export function createPreloadBadge(prefix: string, label: string): React.FC {
  const Badge: React.FC = () => {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
      const tick = () => {
        try {
          const n = document.querySelectorAll(`link[id^="${prefix}"]`).length;
          setCount(n);
        } catch {
          // ignore
        }
      };
      tick();
      const t = setInterval(tick, 400);
      return () => clearInterval(t);
    }, []);
    return (
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          background: "rgba(33,150,243,0.92)",
          color: "#fff",
          fontSize: 12,
          padding: "4px 8px",
          borderRadius: 6,
          zIndex: 6,
          pointerEvents: "none",
        }}
      >
        {label}：{count}
      </div>
    );
  };
  return Badge;
}
