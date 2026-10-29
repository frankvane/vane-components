import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 不要 StrictMode：demo 里有装配工厂与事件时序断言，双调用会让它们误报
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
