# vane-resume 审计验收清单（Checklist）

> 对应 Spec：`tasks/55-vane-resume-audit/spec.md`
> 判定依据：`tasks/55-vane-resume-audit/report.md` 正文与命令输出

- [x] 报告包含「结论摘要、架构与数据流、P0、P1、P2、安全审查、React/性能、测试缺口、验证记录、结论建议」十个章节
- [x] P0 至少 3 条，且每条都有 `file:line` 证据、影响面与修复建议
- [x] P0-1 说明 `withPlugins` 与 `withResumePlugins` 的公开 API 错配，及其导致领域槽失效的具体链路
- [x] P0-2 说明脱敏插件只改写 `value` 而保留原始 `href`，导致打码值可经链接还原
- [x] P0-3 说明简历 URL 未做协议白名单，并记录 React 18 对 `javascript:` 仅告警不阻断的事实
- [x] P1 至少 10 条，覆盖功能、隐私、性能与打包四类
- [x] P2 清单包含可访问性、状态一致性、文档与测试缺口
- [x] 安全审查章节覆盖 URL 协议、PII 留存、脱敏完整性、iframe sandbox、XSS
- [x] React / 性能章节区分「正向项」与「改进项」，并指出 context / memo / 闭包问题
- [x] 测试缺口章节给出可执行的新增用例建议（槽位装配、协议过滤、脱敏 href、版本恢复）
- [x] 验证记录如实记录 typecheck / lint / test / build 输出（test 记录 SSR 警告）
- [x] 报告未声称「测试通过即功能正确」，明确门禁绿色不等于插件装配可用
- [x] 全流程未修改 `packages/vane-resume` 源码、demo、README 与 docs
- [x] 仅新增 `tasks/55-vane-resume-audit/{spec,tasks,checklist,report}.md`
- [x] 报告中 `withResumePlugins` 使用计数与实际检索结果一致（8 个文件 / 21 处标识符出现）
