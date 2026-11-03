/**
 * demo 入口（由 scripts/sync-demo-shell.mjs 从 templates/demo-shell 生成，禁止手改）
 *
 * 只做一件事：加载外壳样式 + 组件样式 + 本包页面样式，然后把 demo.config 交给标准外壳。
 * 顺带固定 CSS 顺序：shell.css → widgets.css → App.css ——
 * widgets.css 承载模板化组件（CodeBlock / PluginDoc）样式，App.css 是各包自由区，
 * 页面级规则最后加载才能覆盖前面的默认值。
 */
import "./shell.css";
import "./widgets.css";
import "./App.css";
import { DemoShell } from "./shell/DemoShell";
import { demoConfig } from "./demo.config";

export default function App() {
  return <DemoShell config={demoConfig} />;
}
