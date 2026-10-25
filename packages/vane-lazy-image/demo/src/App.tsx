import { BasicDemo } from "./pages/BasicDemo";
import { PluginDemo } from "./pages/PluginDemo";
import { PresetsDemo } from "./pages/PresetsDemo";
import { PluginWorkshop } from "./pages/PluginWorkshop";

const NAV = [
  { id: "basic", label: "基础用法" },
  { id: "plugins", label: "插件装配" },
  { id: "presets", label: "组合配方" },
  { id: "workshop", label: "插件工坊" },
];

export function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 1080 }}>
      <h1 style={{ fontSize: 20, fontWeight: 500 }}>vane-lazy-image</h1>
      <p style={{ color: "#888", fontSize: 13 }}>
        演示站 —— 每个页面一个主题，页面代码即文档。60 个插件、8 大领域、5 个配方。
      </p>
      <nav style={{ display: "flex", gap: 16, margin: "16px 0", fontSize: 13 }}>
        {NAV.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            {item.label}
          </a>
        ))}
        <span style={{ color: "#ccc" }}>|</span>
        <a href="https://www.npmjs.com/package/vane-lazy-image" target="_blank" rel="noreferrer">
          npm
        </a>
      </nav>
      <section id="basic">
        <BasicDemo />
      </section>
      <section id="plugins">
        <PluginDemo />
      </section>
      <section id="presets">
        <PresetsDemo />
      </section>
      <section id="workshop">
        <PluginWorkshop />
      </section>
    </div>
  );
}
