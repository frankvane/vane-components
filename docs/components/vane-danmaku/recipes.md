# 弹幕 · 组合配方

配方 = 一组插件的预设组合，用来降低「面对 20 个插件不知道选谁」的成本。

```tsx
import { DanmakuCore, withDanmakuPlugins } from "vane-danmaku";
import { createSensitiveFilterPlugin } from "vane-danmaku/custom-plugins/SensitiveFilterPlugin";
import { createSafeZonePlugin } from "vane-danmaku/custom-plugins/SafeZonePlugin";

/** 配方：直播弹幕（敏感词 + 防遮挡） */
export const Live = withDanmakuPlugins(DanmakuCore, [
  createSensitiveFilterPlugin({ words: ["广告", "代刷"], mode: "mask" }),
  createSafeZonePlugin({ reservedBands: { top: 0.2, bottom: 0.14 } }),
]);
```

## 推荐做法

- 常用组合沉淀为配方导出在包内（建议 3-5 个起步，不设上限），让用户免于每次自己拼；
- 配方是「快捷方式」不是「白名单」——任何插件都可以单独引入；
- 配方本身也是一个「插件」，可被 `pnpm docs:plugins` 收录。

## 防遮挡：接 MediaPipe（消费方职责，发布包不捆绑 ML）

`SafeZonePlugin` 只定义契约，不依赖任何 ML。真正的「别挡人」由消费方用 `provider` 注入实时避让区：

```tsx
import { DanmakuCore, withDanmakuPlugins } from "vane-danmaku";
import { createSafeZonePlugin } from "vane-danmaku/custom-plugins/SafeZonePlugin";
// 消费方自行安装：npm i @mediapipe/tasks-vision

// 1) 在 Worker / 独立管线跑 MediaPipe，低频产出避让区矩形
let latestZones = [];
function startPersonDetector(video: HTMLVideoElement) {
  // MediaPipe Selfie Segmentation 拿 person mask → 腐蚀/降采样成几个 Rect；
  // 或 BlazePose 33 点 → 可见关键点凸包。两者都比「骨骼点直接当遮挡区」正确。
  // 结果写入 latestZones，不要阻塞 60fps 渲染。
}

// 2) 把 provider 传给 SafeZonePlugin：内核每帧读取最新已知避让区
const Enhanced = withDanmakuPlugins(DanmakuCore, [
  createSafeZonePlugin({ provider: () => latestZones }),
]);

// 3) 默认静态安全区（零 ML）也够用：弹幕只走顶/底条带，中间留空防遮挡
const Basic = withDanmakuPlugins(DanmakuCore, [
  createSafeZonePlugin({ reservedBands: { top: 0.2, bottom: 0.14 } }),
]);
```

**为什么不用骨骼捕捉当遮挡区**：骨骼点（BlazePose 33  landmark）是散点，弹幕调度要的是「这块矩形里有人」。直接拿点会漏掉四肢之间的空隙；正确原语是 Selfie Segmentation 的人物掩膜（逐像素），或 Pose 点重建凸包。且 ML 必须跑在 60fps 之外（Worker / 低频），内核每帧只消费「上一帧已知避让区」——人不会瞬移，几帧延迟可接受。
