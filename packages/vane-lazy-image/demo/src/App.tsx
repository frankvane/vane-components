import { BasicDemo } from "./pages/BasicDemo";
import { PluginDemo } from "./pages/PluginDemo";

export function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 960 }}>
      <h1 style={{ fontSize: 20, fontWeight: 500 }}>vane-lazy-image</h1>
      <p style={{ color: "#888", fontSize: 13 }}>
        演示站 —— 每个页面一个主题，页面代码即文档。
      </p>
      <nav style={{ display: "flex", gap: 12, margin: "16px 0", fontSize: 13 }}>
        <a href="#basic">基础用法</a>
        <a href="#plugins">插件装配</a>
      </nav>
      <section id="basic">
        <BasicDemo />
      </section>
      <section id="plugins">
        <PluginDemo />
      </section>
    </div>
  );
}
