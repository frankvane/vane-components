/**
 * 实时弹幕舞台（演示台共用）
 *
 * 一份组件，三处复用：逐项示例 / 插件工坊预览 / 场景卡。
 * 内部跑一个 rAF 时钟把 currentTime 推进并取模 loop，弹幕随之循环播放；
 * 消费方只需传入「插件实例数组」+「弹幕样本」即可看到真实效果。
 *
 * 约定：传入的 `plugins` 必须是稳定引用（模块级常量或 useMemo 结果），
 * 否则每帧重建组件类型会触发整块重挂载。
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DanmakuCore, withDanmakuPlugins } from "vane-danmaku";
import type { DanmakuItem, DanmakuPlugin, Rect } from "vane-danmaku";

/** 通用样本：覆盖 scroll / top / bottom / reverse + 各插件关心的字段 */
export const SAMPLE_BASIC: DanmakuItem[] = [
  { id: "1", text: "前排围观！", mode: "scroll", time: 0.2, meta: {} },
  { id: "2", text: "这波操作太秀了 :fire:", mode: "scroll", time: 0.9, meta: {} },
  { id: "3", text: "广告 加微信领福利", mode: "scroll", time: 1.6, meta: {} },
  { id: "4", text: "老粉来啦", mode: "scroll", time: 2.3, meta: { userId: "u1" } },
  { id: "5", text: "代刷 等级秒到", mode: "scroll", time: 3.0, meta: {} },
  { id: "6", text: "主播 @主播 今天状态在线", mode: "scroll", time: 3.7, meta: {} },
  { id: "7", text: "欢迎 福利 抽奖进行中", mode: "scroll", time: 4.2, meta: {} },
  { id: "8", text: "管理员的置顶公告", mode: "top", time: 4.6, meta: { isAdmin: true, level: 30 } },
  { id: "9", text: "高赞大佬发言", mode: "scroll", time: 5.0, meta: { level: 25 } },
  { id: "10", text: "火箭 x1", mode: "scroll", time: 5.6, meta: { userId: "u2" } },
  { id: "11", text: "火箭 x1", mode: "scroll", time: 5.9, meta: { userId: "u2" } },
  { id: "12", text: "弹幕护体", mode: "scroll", time: 6.5, meta: {} },
  { id: "13", text: "spam-bot 刷屏刷屏", mode: "scroll", time: 7.0, meta: { userId: "spam-bot" } },
  { id: "14", text: "这画质绝了", mode: "scroll", time: 7.6, meta: {} },
  { id: "15", text: "底部弹幕测试", mode: "bottom", time: 8.1, meta: {} },
  { id: "16", text: "反向弹幕", mode: "reverse", time: 8.6, meta: {} },
  { id: "17", text: "全程高能", mode: "scroll", time: 9.4, meta: {} },
];

/** 礼物连击样本：同一用户连续送同类礼物 → 合并成 xN */
export const SAMPLE_COMBO: DanmakuItem[] = [
  { id: "c1", text: "火箭", mode: "scroll", time: 0.3, meta: { userId: "u2" } },
  { id: "c2", text: "火箭", mode: "scroll", time: 0.7, meta: { userId: "u2" } },
  { id: "c3", text: "火箭", mode: "scroll", time: 1.1, meta: { userId: "u2" } },
  { id: "c4", text: "火箭", mode: "scroll", time: 1.5, meta: { userId: "u2" } },
  { id: "c5", text: "超管来了", mode: "top", time: 2.2, meta: { isAdmin: true, level: 40 } },
  { id: "c6", text: "普通弹幕一条", mode: "scroll", time: 3.0, meta: {} },
];

/** 互动指令样本：/clear 会触发清屏（演示时勾选 CmdParse 才有反应） */
export const SAMPLE_CMDS: DanmakuItem[] = [
  { id: "m1", text: "大家晚上好", mode: "scroll", time: 0.3, meta: {} },
  { id: "m2", text: "/clear", mode: "scroll", time: 1.2, meta: {} },
  { id: "m3", text: "清屏后再来一条", mode: "scroll", time: 2.0, meta: {} },
  { id: "m4", text: "#lottery 抽奖开奖", mode: "scroll", time: 2.8, meta: {} },
  { id: "m5", text: "晚安主播", mode: "scroll", time: 3.6, meta: {} },
];

/** 语种过滤样本：混排 CJK / 拉丁 / 西里尔等 */
export const SAMPLE_LANG: DanmakuItem[] = [
  { id: "l1", text: "主播加油，这把稳了", mode: "scroll", time: 0.3, meta: {} },
  { id: "l2", text: "hello from overseas", mode: "scroll", time: 0.9, meta: {} },
  { id: "l3", text: "Привет всем", mode: "scroll", time: 1.5, meta: {} },
  { id: "l4", text: "가나다라마바", mode: "scroll", time: 2.1, meta: {} },
  { id: "l5", text: "これはテストです", mode: "scroll", time: 2.7, meta: {} },
  { id: "l6", text: "继续支持！", mode: "scroll", time: 3.3, meta: {} },
];

/** 直播内容治理样本：敏感词 / 硬屏蔽词 / 刷屏机器人 / 广告 */
export const SAMPLE_MODERATION: DanmakuItem[] = [
  { id: "d1", text: "正常弹幕一条", mode: "scroll", time: 0.3, meta: {} },
  { id: "d2", text: "广告 加微信领福利", mode: "scroll", time: 0.8, meta: {} },
  { id: "d3", text: "竞品 别看这家", mode: "scroll", time: 1.3, meta: {} },
  { id: "d4", text: "代刷 等级秒到", mode: "scroll", time: 1.8, meta: {} },
  { id: "d5", text: "spam 刷屏刷屏刷屏", mode: "scroll", time: 2.3, meta: { userId: "bot" } },
  { id: "d6", text: "spam 又来刷了", mode: "scroll", time: 2.6, meta: { userId: "bot" } },
  { id: "d7", text: "正常观众发言", mode: "scroll", time: 3.2, meta: {} },
  { id: "d8", text: "违规 政治敏感", mode: "scroll", time: 3.8, meta: {} },
];

/** 互动玩法样本：粉丝牌 / @提及 / 礼物连击 / 指令 */
export const SAMPLE_INTERACTION: DanmakuItem[] = [
  { id: "i1", text: "老粉报到！", mode: "scroll", time: 0.3, meta: { userId: "u1" } },
  { id: "i2", text: "@主播 求连麦", mode: "scroll", time: 0.9, meta: {} },
  { id: "i3", text: "火箭", mode: "scroll", time: 1.4, meta: { userId: "u2" } },
  { id: "i4", text: "火箭", mode: "scroll", time: 1.7, meta: { userId: "u2" } },
  { id: "i5", text: "#lottery 我要抽奖", mode: "scroll", time: 2.3, meta: {} },
  { id: "i6", text: "新粉来咯", mode: "scroll", time: 3.0, meta: { userId: "u9" } },
];

export interface LiveDanmakuProps {
  /** 稳定引用的插件实例数组（模块级常量或 useMemo） */
  plugins: DanmakuPlugin[];
  items: DanmakuItem[];
  /** 循环时长（秒），默认 12 */
  loop?: number;
  height?: number;
  /** 舞台背景（模拟视频画面） */
  background?: React.CSSProperties["background"];
  /** 实时避让区 provider（防遮挡演示注入） */
  avoidZoneProvider?: () => Rect[];
  opacity?: number;
  trackHeight?: number;
  /** 是否显示边框网格（默认 false） */
  showGrid?: boolean;
  /** 顶部安全区（px）：控件浮层占用，弹幕不渲染到这里 */
  topInset?: number;
  /** 底部安全区（px）：控件浮层占用，弹幕不渲染到这里 */
  bottomInset?: number;
}

/**
 * 实时弹幕舞台：跑时钟 + 装配 Core。
 * `plugins` 用 useMemo 缓存组件类型，避免每帧重建导致整块重挂载。
 */
export function LiveDanmaku({
  plugins,
  items,
  loop = 12,
  height = 320,
  background,
  avoidZoneProvider,
  opacity = 1,
  trackHeight = 30,
  showGrid,
  topInset = 0,
  bottomInset = 0,
}: LiveDanmakuProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const startRef = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      const elapsed = (t - startRef.current) / 1000;
      setCurrentTime(elapsed % loop);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loop]);

  const Enhanced = useMemo(
    () => withDanmakuPlugins(DanmakuCore, plugins),
    [plugins]
  );

  return (
    <div
      data-danmaku-root
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: 8,
        overflow: "hidden",
        background:
          background ??
          "linear-gradient(135deg, #1b2a4a 0%, #0d1424 60%, #2a1730 100%)",
        boxShadow: "inset 0 0 80px rgba(0,0,0,0.45)",
      }}
    >
      {showGrid ? (
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* 轨道分隔线 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0 1px, transparent 1px ${trackHeight}px)`,
            }}
          />
          {/* 顶部固定带 / 底部固定带 预留区（滚动弹幕不入侵，防叠字） */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(1, Math.floor((height / trackHeight) * 0.25)) * trackHeight,
              background: "rgba(255,122,41,0.10)",
              borderBottom: "1px solid rgba(255,122,41,0.35)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height:
                height - Math.floor((height / trackHeight) * 0.75) * trackHeight,
              background: "rgba(127,208,192,0.10)",
              borderTop: "1px solid rgba(127,208,192,0.35)",
            }}
          />
        </div>
      ) : null}
      <Enhanced
        items={items}
        currentTime={currentTime}
        playing
        opacity={opacity}
        trackHeight={trackHeight}
        avoidZoneProvider={avoidZoneProvider}
        topInset={topInset}
        bottomInset={bottomInset}
        containerStyle={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
