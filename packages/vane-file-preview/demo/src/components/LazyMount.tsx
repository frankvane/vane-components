import React, { useEffect, useRef, useState } from "react";

/**
 * 进入视口后才挂载子树。
 *
 * 工坊页要同时摆 17 个真预览器，其中 epub / docx / pptx / xlsx 各自要解一个 zip，
 * 一次性挂满会让首屏黑掉两三秒。这里用 IntersectionObserver 延迟到「快滚到了」
 * 再挂（rootMargin 240px，提前一屏），滚过去之后保持挂载 —— 再来回滚不会重新解析。
 *
 * 不支持 IntersectionObserver 的环境（老浏览器 / 无 DOM 的测试）直接挂载：
 * 宁可慢一点，也不要在那里永远显示占位。
 */
export const LazyMount: React.FC<{ children: React.ReactNode; label?: string }> = ({
  children,
  label = "滚到这里即装载",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (on) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [on]);

  return (
    <div ref={ref} style={{ height: "100%" }}>
      {on ? children : <div className="ws-placeholder">{label}</div>}
    </div>
  );
};
