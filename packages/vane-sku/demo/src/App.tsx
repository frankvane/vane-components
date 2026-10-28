import { BasicDemo } from "./pages/BasicDemo";

export function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 500 }}>规格选择</h1>
      <p style={{ color: "#888", fontSize: 13 }}>
        vane-sku 演示站 —— 每个页面一个主题，页面代码即文档。
      </p>
      <BasicDemo />
    </div>
  );
}
