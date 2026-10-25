import { LazyLoadImageCore } from "@/components/LazyLoadImagePlugin/LazyLoadImageCore";
import { withPlugins } from "@/components/LazyLoadImagePlugin/withPlugins";
import { socialFeedPreset } from "@/presets/social-feed";
import { productGalleryPreset } from "@/presets/product-gallery";
import { contentLongReadPreset } from "@/presets/content-long-read";
import { performanceFirstPreset } from "@/presets/performance-first";
import { offlineFirstPreset } from "@/presets/offline-first";

interface PresetSection {
  id: string;
  title: string;
  scene: string;
  importPath: string;
  call: string;
  image: ReturnType<typeof withPlugins>;
}

const SocialFeedImage = withPlugins(LazyLoadImageCore, socialFeedPreset());
const ProductGalleryImage = withPlugins(LazyLoadImageCore, productGalleryPreset());
const ContentLongReadImage = withPlugins(LazyLoadImageCore, contentLongReadPreset());
const PerformanceFirstImage = withPlugins(LazyLoadImageCore, performanceFirstPreset());
const OfflineFirstImage = withPlugins(
  LazyLoadImageCore,
  offlineFirstPreset({ fallbackSrc: "https://picsum.photos/seed/vane-fallback/64/40" })
);

const sections: PresetSection[] = [
  {
    id: "social-feed",
    title: "社交信息流 · social-feed",
    scene: "信息流缩略图快速滚动：视觉过渡 + 弱网重试 + 内存缓存 + 视口去抖。",
    importPath: "vane-lazy-image/presets/social-feed",
    call: "socialFeedPreset()",
    image: SocialFeedImage,
  },
  {
    id: "product-gallery",
    title: "商品画廊 · product-gallery",
    scene: "电商商品图：比例占位防 CLS + 双层占位 + 灯箱 + 悬停放大 + 说明。",
    importPath: "vane-lazy-image/presets/product-gallery",
    call: "productGalleryPreset()",
    image: ProductGalleryImage,
  },
  {
    id: "content-long-read",
    title: "长文阅读 · content-long-read",
    scene: "正文配图：布局稳定 + 滚动空闲加载 + SEO + 无障碍。",
    importPath: "vane-lazy-image/presets/content-long-read",
    call: "contentLongReadPreset()",
    image: ContentLongReadImage,
  },
  {
    id: "performance-first",
    title: "性能优先 · performance-first",
    scene: "首屏敏感页面：fetch 流式加载 + IDB 缓存 + 并发控制 + 预连接 + 空闲解码。",
    importPath: "vane-lazy-image/presets/performance-first",
    call: "performanceFirstPreset()",
    image: PerformanceFirstImage,
  },
  {
    id: "offline-first",
    title: "离线优先 · offline-first",
    scene: "弱网/离线环境：IDB 持久缓存 + 预热 + 离线提示 + 重试 + 兜底图。",
    importPath: "vane-lazy-image/presets/offline-first",
    call: "offlineFirstPreset({ fallbackSrc: \"/fallback.png\" })",
    image: OfflineFirstImage,
  },
];

export function PresetsDemo() {
  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 500 }}>组合配方（presets）</h2>
      <p style={{ color: "#999", fontSize: 12 }}>
        配方 = 一组插件的预设组合，是快捷方式不是白名单——任何插件都可单独引入或混入配方。
      </p>
      {sections.map((s, i) => (
        <section key={s.id} id={s.id} style={{ margin: "20px 0" }}>
          <h3 style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</h3>
          <p style={{ color: "#888", fontSize: 12, margin: "4px 0" }}>{s.scene}</p>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 320, height: 200, border: "1px solid #eee", flexShrink: 0 }}>
              <s.image
                src={`https://picsum.photos/seed/vane-${s.id}/${640 + i * 80}/${400 + i * 40}`}
                alt={`${s.title} 示例`}
              />
            </div>
            <pre
              style={{
                background: "#f7f7f8",
                border: "1px solid #eee",
                padding: 12,
                fontSize: 11,
                lineHeight: 1.5,
                flex: 1,
                margin: 0,
              }}
            >
              {`import { ${s.call.replace(/\(.*$/, "")} } from "${s.importPath}";

const Image = withPlugins(LazyLoadImageCore, [
  ${s.call},
]);`}
            </pre>
          </div>
        </section>
      ))}
    </div>
  );
}
