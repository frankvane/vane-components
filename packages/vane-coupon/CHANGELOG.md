# vane-coupon

## 0.2.1

### Patch Changes

- 升级 peer 依赖 `vane-plugin-core` 至 `^0.1.2`，跟随内核稳定性修复（无关重渲染钩子重复执行、卸载清理时序）。组件业务逻辑未变更。

- Updated dependencies []:
  - vane-plugin-core@0.1.2

## 0.2.0

### Minor Changes

- 新增可用性判定引擎与 `EligibilityPlugin`。

  - 新增 `eligibility` / `quota` / `stock` / `validity` / `format` 纯函数，覆盖门槛、商品范围、互斥、叠加、限领、库存六类判定。
  - 新增 `vane-coupon/custom-plugins/EligibilityPlugin` 子路径导出。
  - 领取状态机与展示共用同一库存口径，过期时钟在页内自动收敛。
  - Remind / Countdown 的渲染条件与判定结果对齐；包体积预算按实测校准。

### Patch Changes

- Updated dependencies []:
  - vane-plugin-core@0.1.1
