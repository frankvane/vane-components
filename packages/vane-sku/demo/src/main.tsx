import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { runSelfTestToTitle } from "./lib/selftest";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ?selftest=1 → 在真实浏览器里跑一遍断言，结论写进 document.title
// （浏览器截图 / DOM 快照在部分环境不可用，标题是一条稳定可读的回传通道）
if (typeof location !== "undefined" && location.search.includes("selftest=1")) {
  void runSelfTestToTitle();
}
