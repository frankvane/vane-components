import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// 消费方的写法是 `import "vane-card/style.css"`；demo 直接吃源码，
// 所以这里走相对路径（tokens 必须先于 components —— 变量在 :root 上定义）
import "../../src/styles/tokens.css";
import "../../src/styles/components.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
