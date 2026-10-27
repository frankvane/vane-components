import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// 消费方的写法是 `import "vane-card/style.css"`；demo 直接吃源码，
// 所以这里走相对路径（tokens 必须先于 components —— 变量在 :root 上定义）
import "../../src/styles/tokens.css";
import "../../src/styles/components.css";
// 站点外壳（侧栏 / 版式 / 场景卡）与组件库样式分开：前者不进 dist
import "./App.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
