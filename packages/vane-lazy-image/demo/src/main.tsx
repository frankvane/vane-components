import { createRoot } from "react-dom/client";
import App from "./App";
import { applyEnvFromStorage } from "./components/env-sim";
import "./App.css";

// 环境模拟必须在 React 挂载前生效：部分插件在 mount 时读取 navigator 环境
applyEnvFromStorage();

createRoot(document.getElementById("root")!).render(<App />);
