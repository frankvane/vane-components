import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { runSelfTestToTitle } from "./lib/selftest";

// 不要 StrictMode：demo 里有装配工厂与事件时序断言，双调用会让它们误报
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// ?selftest=1 → 在真实浏览器里跑一遍断言，结论写进 document.title
// （浏览器截图 / DOM 快照在部分环境不可用，标题是一条稳定可读的回传通道）
if (typeof location !== "undefined" && location.search.includes("selftest=1")) {
  void runSelfTestToTitle();
}
