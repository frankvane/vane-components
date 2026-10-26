import { createRoot } from "react-dom/client";
import App from "./App";
import { applyEnvFromStorage } from "./components/env-sim";
import "./App.css";

// 环境模拟必须在 React 挂载前生效：部分插件在 mount 时读取 navigator 环境
applyEnvFromStorage();

// Resource Timing 默认只保留 250 条，dev 下 Vite 要加载几百个模块，缓冲区早被挤满，
// 图片请求的条目会被淘汰 → 观察台「传输 / 解码」读不到字节数与 HTTP 状态码。
// 生产构建只有几个资源，所以这个差异只在开发模式下暴露。
try {
  performance.setResourceTimingBufferSize(1000);
} catch {
  /* 老浏览器不支持则忽略 */
}

createRoot(document.getElementById("root")!).render(<App />);
