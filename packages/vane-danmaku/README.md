<p align="center">
  <a href="https://www.npmjs.com/package/vane-danmaku"><img src="https://img.shields.io/npm/v/vane-danmaku.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-danmaku"><img src="https://img.shields.io/npm/dm/vane-danmaku.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>
# 弹幕

> 插件式 React 弹幕组件（canvas 渲染内核 + 业务语义插件）
>
> 三层架构：`DanmakuCore` 独占 canvas 渲染与轨道调度；数据面插件经 `transformData` 操作弹幕流；UI 面插件经 DOM 槽渲染控制层。

## 特性

- **Canvas 内核**：`DanmakuCore` 用 `<canvas>` + `requestAnimationFrame` 绘制飞行弹幕，扛高并发，性能远超 DOM 节点方案。
- **插件化业务语义**：敏感词过滤 / 粉丝牌 / 高赞置顶 / 互动指令 / 防遮挡等全部是插件，按需组合。
- **数据面 ≠ 渲染面**：插件绝不直绘 canvas，只写 `DanmakuItem.renderHint`，由内核渲染器消费。
- **防遮挡零 ML**：默认静态安全区（顶/底条带）；可选接入 MediaPipe（消费方注入避让区），发布包不捆绑任何 ML 依赖。
- TypeScript 类型完备，Tree-shaking 友好，与 `vane-plugin-core` 共用同一套插件规范。

## 安装

```bash
npm install vane-danmaku
```

## 30 秒上手

```tsx
import { DanmakuCore, withDanmakuPlugins } from "vane-danmaku";
import { createSensitiveFilterPlugin } from "vane-danmaku/custom-plugins/SensitiveFilterPlugin";
import { createFanBadgePlugin } from "vane-danmaku/custom-plugins/FanBadgePlugin";
import { createPinnedTopPlugin } from "vane-danmaku/custom-plugins/PinnedTopPlugin";
import { createCmdParsePlugin } from "vane-danmaku/custom-plugins/CmdParsePlugin";
import { createSafeZonePlugin } from "vane-danmaku/custom-plugins/SafeZonePlugin";

const Enhanced = withDanmakuPlugins(DanmakuCore, [
  createSensitiveFilterPlugin({ words: ["广告", "代刷"] }),
  createFanBadgePlugin({ badges: { u1: { name: "老粉", level: 6, color: "#ff7a29" } } }),
  createPinnedTopPlugin({ minLevel: 20 }),
  createCmdParsePlugin(),
  createSafeZonePlugin({ reservedBands: { top: 0.2, bottom: 0.14 } }),
]);

<Enhanced items={items} currentTime={playhead} playing containerStyle={{ width: 720, height: 360 }} />;
```

`currentTime` 是当前播放时间（秒），驱动哪些弹幕可见；`items` 是 `DanmakuItem[]`。

## 包体积

| 导入方式 | Gzip |
| --- | --- |
| 仅核心 `vane-danmaku/core` | ~0.4 KB |
| 核心 + 5 个插件 | ~10 KB |

## 文档

- [API](../../docs/components/vane-danmaku/api.md)
- [插件目录](../../docs/components/vane-danmaku/plugins.md)
- [组合配方](../../docs/components/vane-danmaku/recipes.md)

## License

MIT
