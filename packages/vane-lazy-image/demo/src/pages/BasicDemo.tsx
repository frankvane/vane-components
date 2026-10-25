import { LazyLoadImageCore } from "@/components/LazyLoadImagePlugin/LazyLoadImageCore";

export function BasicDemo() {
  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 500 }}>基础用法（无插件）</h2>
      <div style={{ width: 320, height: 200, border: "1px solid #eee" }}>
        <LazyLoadImageCore
          src="https://picsum.photos/seed/vane-basic/640/400"
          alt="示例图片"
        />
      </div>
      <p style={{ color: "#999", fontSize: 12 }}>
        Core 单独使用：IntersectionObserver 视口检测 + ObserverPool 共享实例。
      </p>
    </div>
  );
}
