/**
 * demo 入口（由 scripts/sync-demo-shell.mjs 从 templates/demo-shell 生成，禁止手改）
 *
 * 只做一件事：加载外壳样式 + 本包页面样式，然后把 demo.config 交给标准外壳。
 * 顺带固定 CSS 顺序：shell.css 在前、App.css 在后 —— 页面级规则才能覆盖外壳默认值。
 */
import "./shell.css";
import "./App.css";
import { DemoShell } from "./shell/DemoShell";
import { demoConfig } from "./demo.config";

export default function App() {
  return <DemoShell config={demoConfig} />;
}
