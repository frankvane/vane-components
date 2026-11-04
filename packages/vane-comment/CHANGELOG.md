# vane-comment

## 0.2.2

### Patch Changes

- 升级 peer 依赖 `vane-plugin-core` 至 `^0.1.2`，跟随内核稳定性修复（无关重渲染钩子重复执行、卸载清理时序）。组件业务逻辑未变更。

- Updated dependencies []:
  - vane-plugin-core@0.1.2

## 0.2.1

### Patch Changes

- 修复 10 项 P1/P2 缺陷并补回归用例。

  - 楼中楼嵌套深度限制与环检测。
  - 富文本编辑器受控行为与光标位置修正。
  - 排序与筛选使用稳定键，切换时不再错位。
  - 槽位按插件分组渲染；包体积预算按实测校准。

- Updated dependencies []:
  - vane-plugin-core@0.1.1
