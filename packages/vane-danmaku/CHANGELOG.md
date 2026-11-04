# vane-danmaku

## 0.1.1

### Patch Changes

- 升级 peer 依赖 `vane-plugin-core` 至 `^0.1.2`，跟随内核稳定性修复（无关重渲染钩子重复执行、卸载清理时序）。组件业务逻辑未变更。

- Updated dependencies []:
  - vane-plugin-core@0.1.2

## 0.1.0

首个发布版本：插件式 React 弹幕组件，Canvas 内核独占渲染与轨道调度，业务语义全部走插件。

### 内核

- 方向分轨：正向（scroll）、反向（reverse）与停留型（top / bottom / pinned）互不侵占，异向直接判冲突。
- 防追尾：屏幕速度与弹幕宽度相关，同轨后车更宽时按追及判定拦下，根治同轨穿插叠字。
- 渐显渐隐（`fadeMs`）与时钟回绕清场，循环播放切换时无残留。
- 安全区 `topInset` / `bottomInset`：弹幕只在控件浮层之间的带状区流动。
- 避让区（`avoidZoneProvider`）：调度优先避开，绘制期再以 `evenodd` 裁剪挖空，人物矩形内不产生任何弹幕像素。
- 饱和策略：无空轨时排队，超过 `WAIT_MAX` 丢弃并计数（`getStats()` 返回 `{ active, dropped }`），绝不硬塞同轨叠字。

### 插件

- 23 个业务语义插件：经 `transformData` 改写弹幕流、写 `renderHint` 交由内核统一消费。
- 全部插件以子路径导出（`vane-danmaku/custom-plugins/<Name>Plugin`），根入口不桶导出，体积可控。

### 依赖

- `vane-plugin-core` 为 peer 依赖，不打包进 dist。
- 不含任何 ML / 媒体处理依赖；防遮挡的骨骼识别跑在消费方自己的循环里。
