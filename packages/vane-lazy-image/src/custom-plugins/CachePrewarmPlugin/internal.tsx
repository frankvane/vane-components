/**
 * CachePrewarmPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import { useEffect, useState } from "react";

export function CacheBadge({
  src,
  prewarmed,
}: {
  src: string;
  /** 由工厂维护的模块级集合，透传进来避免两文件共享可变模块状态 */
  prewarmed: ReadonlySet<string>;
}) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const tick = () => setDone(prewarmed.has(src));
    tick();
    const t = setInterval(tick, 400);
    return () => clearInterval(t);
  }, [src, prewarmed]);
  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        background: done ? "#2e7d32" : "#b35c00",
        color: "#fff",
        fontSize: 12,
        padding: "4px 8px",
        borderRadius: 6,
        zIndex: 6,
        pointerEvents: "none",
      }}
    >
      {done ? "已预热 ✓" : "预热中…"}
    </div>
  );
}
