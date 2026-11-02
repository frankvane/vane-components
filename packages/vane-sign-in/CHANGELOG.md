# vane-sign-in

## 0.1.1

### Patch Changes

- 修复 14 项 P1/P2 缺陷并补回归用例。

  - 签到 pending 状态机防双击并发。
  - 本地日期键统一处理，跨时区不再差一天。
  - 补签、连签状态、奖励领取与倒计时相位对齐。
  - token 与工具模块收敛；新增 6 组回归用例（跨天 / 并发 / 补签 / 槽位性能）。

- Updated dependencies []:
  - vane-plugin-core@0.1.1
