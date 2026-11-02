import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { runSelfTestToTitle } from "./lib/selftest";

// 不要 StrictMode：demo 里有装配工厂与事件时序断言，双调用会让它们误报
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// ?selftest=1 → 在真实浏览器里跑一遍断言，结论写进 document.title
// （拖拽 / 补间 / progress 联动整条 DOM 链路，靠截图验不出来）
if (typeof location !== "undefined" && location.search.includes("selftest=1")) {
  runSelfTestToTitle().catch((e) => {
    document.title = `SELFTEST ERROR ${e?.message ?? String(e)}`;
    throw e;
  });
}
