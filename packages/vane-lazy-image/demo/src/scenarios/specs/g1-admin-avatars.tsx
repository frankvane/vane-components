// 版式参照：后台用户管理列表 —— 一屏 40 个 24px 小头像，最容易把主线程拖住
// 装配：裁剪 → 内存缓存 → 兜底图
import {
  LazyLoadImageCore,
  createCropPlugin,
  createFallbackImagePlugin,
  createMemoryCachePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 小尺寸也要方的：按中心裁切，避免挤压变形
  createCropPlugin({ enabled: true, focusPoint: { x: 0.5, y: 0.5 } }),
  // 分页来回翻时同一批用户不重复请求
  createMemoryCachePlugin({ maxEntries: 400, ttlMs: 10 * 60 * 1000 }),
  createFallbackImagePlugin({
    fallbackSrc: "https://picsum.photos/seed/vane-admin-fallback/48/48",
  }),
]);

const USERS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: ["王敏", "李书豪", "赵一鸣", "陈澄", "周舟", "孙铭", "吴桐", "郑野"][i],
  dept: ["研发中心", "市场部", "客服中心", "财务部"][i % 4],
  src: `https://picsum.photos/seed/vane-admin-${i + 1}/48/48`,
}));

export default function AdminAvatars() {
  return (
    <div style={STAGE}>
      <div style={TABLE}>
        <div style={HEAD}>
          <span>成员</span>
          <span>部门</span>
          <span>状态</span>
        </div>
        {USERS.map((u) => (
          <div key={u.id} style={ROW}>
            <span style={PERSON}>
              <span style={AVATAR}>
                <Lazy
                  src={u.src}
                  alt={`${u.name} 的头像`}
                  loading="lazy"
                  containerStyle={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}
                  imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </span>
              {u.name}
            </span>
            <span style={DIM}>{u.dept}</span>
            <span style={DIM}>已启用</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const TABLE: CSSProperties = { border: "1px solid #eee", borderRadius: 4, overflow: "hidden" };
const HEAD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr 0.8fr",
  gap: 8,
  padding: "7px 10px",
  background: "#fafafa",
  color: "#8c8c8c",
  fontSize: 10.5,
};
const ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr 0.8fr",
  gap: 8,
  alignItems: "center",
  padding: "6px 10px",
  borderTop: "1px solid #f2f2f2",
  fontSize: 11.5,
  color: "#333",
};
const PERSON: CSSProperties = { display: "flex", alignItems: "center", gap: 7 };
const AVATAR: CSSProperties = { width: 22, height: 22, flex: "0 0 22px" };
const DIM: CSSProperties = { color: "#7b7b7b", fontSize: 11 };
