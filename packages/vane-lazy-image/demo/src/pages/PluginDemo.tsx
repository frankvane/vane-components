import { withPlugins } from "@/components/LazyLoadImagePlugin/withPlugins";
import { LazyLoadImageCore } from "@/components/LazyLoadImagePlugin/LazyLoadImageCore";
import { createBlurUpPlugin } from "@/custom-plugins/BlurUpPlugin";

const BlurUpImage = withPlugins(LazyLoadImageCore, [
  createBlurUpPlugin({ startBlur: 16, durationMs: 600 }),
]);

export function PluginDemo() {
  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 500 }}>插件装配（BlurUp）</h2>
      <div style={{ width: 320, height: 200, border: "1px solid #eee" }}>
        <BlurUpImage src="https://picsum.photos/seed/vane-blur/640/400" alt="模糊占位示例" />
      </div>
      <p style={{ color: "#999", fontSize: 12 }}>
        withPlugins(Core, [createBlurUpPlugin()])：加载期 blur，加载成功过渡到清晰。
      </p>
    </div>
  );
}
