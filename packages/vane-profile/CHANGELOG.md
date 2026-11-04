# vane-profile

## 0.2.1

### Patch Changes

- 升级 peer 依赖 `vane-plugin-core` 至 `^0.1.2`，跟随内核稳定性修复（无关重渲染钩子重复执行、卸载清理时序）。组件业务逻辑未变更。

- Updated dependencies []:
  - vane-plugin-core@0.1.2

## 0.2.0

### Minor Changes

- 新增受控页签与安全链接白名单。

  - 页签支持受控 `activeTab` / `onActiveTabChange`，可由外部驱动切换。
  - 关注按钮乐观更新补齐 pending 与错误回滚。
  - 新增 safe-url 白名单（社交链接 / 官网 / 头图 / 封面），拦截 `javascript:` 等危险协议。
  - 头像加载失败降级；内容区不再吞掉内核槽与 children；`transformData` 契约真正接线。
  - 槽位预分组 memo、key 去 index、移除渲染期写 ref。

### Patch Changes

- Updated dependencies []:
  - vane-plugin-core@0.1.1
