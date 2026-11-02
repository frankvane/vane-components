# vane-resume 审计报告任务清单（Tasks）

> 对应 Spec：`tasks/55-vane-resume-audit/spec.md`
> 原则：审计阶段只读分析；后续按报告优先级修复 P0/P1（改动集中在 `packages/vane-resume`，未触碰其它包）。

## T1 · 报告骨架与结论（P0）

- [x] T1.1 新建 `tasks/55-vane-resume-audit/report.md`：结论摘要、审计范围、方法与威胁模型。
- [x] T1.2 写架构与数据流：`ResumeCore` → `withResumePlugins` → `usePluginRuntime` → `ResumeSlotProvider` → 插件钩子；附文件链接。
- [x] T1.3 写 P0 三条：公开 HOC 错配、脱敏 href 泄露、URL 协议白名单缺失；每条含证据、影响面、修复建议。

## T2 · P1 问题（P1）

- [x] T2.1 功能类：版本恢复无接收方、二维码不更新、AI 润色跨语言污染、`getSectionOrder` 过期、`onPropsChange` 每渲染触发、插件数组变化不重跑 onMount。
- [x] T2.2 隐私类：视觉遮罩可复制/导出、分享 URL 含 PII、localStorage 明文与全局 key、脱敏正则覆盖不足。
- [x] T2.3 性能/打包类：内容槽 fallback 每渲染重算、PDF canvas 污染与动态导入变量化、iframe 无 sandbox。

## T3 · P2 与最佳实践（P2）

- [x] T3.1 DeliverTrack 监听泄漏/旧状态、弹层可访问性、Timeline 丢高亮、MultiLang 浅合并。
- [x] T3.2 React 性能正向项与改进项；`highlightText` 正则缓存建议。
- [x] T3.3 测试缺口清单与建议新增用例（槽位装配、协议过滤、脱敏 href、版本恢复）。

## T4 · 验证与交付

- [x] T4.1 `pnpm --filter vane-resume typecheck`（exit 0）
- [x] T4.2 `pnpm --filter vane-resume lint`（exit 0，63 warnings / 0 errors）
- [x] T4.3 `pnpm --filter vane-resume test`（31/31 通过，P1 回归 8 条 + P2 回归 8 条，另有版本恢复 1 条与渲染隔离/插件集合变化补强 3 条；既有 SSR useLayoutEffect 警告）
- [x] T4.4 `pnpm --filter vane-resume build`（exit 0，456 modules，约 8.2s；PDF 依赖为静态 import）
- [x] T4.5 复核报告中的 file:line 仍有效；`git status` 确认改动仅限 `packages/vane-resume` 与审计报告。
- [x] T4.6 在回复中给出报告 `computer://` 链接与 P0/P1/P2 摘要。

## 验收标准

- 报告含 ≥3 条 P0（每条可复现/可定位）、≥10 条 P1、P2 清单完整。
- 所有结论都有 `file:line` 证据，不写无证据猜测。
- 不改任何组件源码；验证命令输出如实记录。
