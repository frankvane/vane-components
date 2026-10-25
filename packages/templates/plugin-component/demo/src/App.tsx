import { BasicDemo } from "./pages/BasicDemo";

export function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 500 }}>__TITLE__</h1>
      <p style={{ color: "#888", fontSize: 13 }}>
        __PKG_NAME__ 演示站 —— 每个页面一个主题，页面代码即文档。
      </p>
      <BasicDemo />
    </div>
  );
}
