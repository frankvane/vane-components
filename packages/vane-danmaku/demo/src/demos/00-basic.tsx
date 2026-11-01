import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DanmakuCore, withDanmakuPlugins } from "vane-danmaku";
import type { DanmakuItem } from "vane-danmaku";
import { createSensitiveFilterPlugin } from "vane-danmaku/custom-plugins/SensitiveFilterPlugin";
import { createFanBadgePlugin } from "vane-danmaku/custom-plugins/FanBadgePlugin";
import { createPinnedTopPlugin } from "vane-danmaku/custom-plugins/PinnedTopPlugin";
import { createKeywordHighlightPlugin } from "vane-danmaku/custom-plugins/KeywordHighlightPlugin";
import { createKeywordBlockPlugin } from "vane-danmaku/custom-plugins/KeywordBlockPlugin";
import { createUserMutePlugin } from "vane-danmaku/custom-plugins/UserMutePlugin";
import { createEmojiRenderPlugin } from "vane-danmaku/custom-plugins/EmojiRenderPlugin";
import { createAtMentionPlugin } from "vane-danmaku/custom-plugins/AtMentionPlugin";
import { createGiftComboPlugin } from "vane-danmaku/custom-plugins/GiftComboPlugin";
import { createLangFilterPlugin } from "vane-danmaku/custom-plugins/LangFilterPlugin";
import { createColorPolicyPlugin } from "vane-danmaku/custom-plugins/ColorPolicyPlugin";
import { createStylePresetPlugin } from "vane-danmaku/custom-plugins/StylePresetPlugin";
import { createDedupPlugin } from "vane-danmaku/custom-plugins/DedupPlugin";
import { createCmdParsePlugin } from "vane-danmaku/custom-plugins/CmdParsePlugin";
import { createSpeedControlPlugin } from "vane-danmaku/custom-plugins/SpeedControlPlugin";
import { createSafeZonePlugin } from "vane-danmaku/custom-plugins/SafeZonePlugin";
import { createSettingsPanelPlugin } from "vane-danmaku/custom-plugins/SettingsPanelPlugin";
import { createFilterTogglePlugin } from "vane-danmaku/custom-plugins/FilterTogglePlugin";
import { createCommandInputPlugin } from "vane-danmaku/custom-plugins/CommandInputPlugin";
import { createStatsBarPlugin } from "vane-danmaku/custom-plugins/StatsBarPlugin";
import type { DemoMeta } from "./types";

/**
 * 00 · 综合演示（23 插件全家桶 + 可交互控制层）
 *
 * 数据面插件在 transformData 阶段改写弹幕流，UI 面插件经 DOM 槽渲染控制层并经
 * 回调 / bus 广播与消费方联动：设置面板调不透明度/速度/轨道高度，过滤开关增删对应
 * 数据面插件，指令输入框发送弹幕或触发 /clear，统计条展示实时数据。
 */
export const meta: DemoMeta = {
  slug: "basic",
  title: "综合演示",
  group: "basic",
  intro:
    "canvas 内核 + 23 个业务语义插件：敏感词/粉丝牌/高赞置顶/关键词高亮/屏蔽/静音/表情/@提及/礼物连击/语种/配色/样式/去重/限速/指令/防遮挡，外加 4 个 UI 控制插件。",
};

const SAMPLE: DanmakuItem[] = [
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

const LOOP = 12;

type Settings = { opacity: number; speed: number; trackHeight: number };

export default function Stage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [items, setItems] = useState<DanmakuItem[]>(SAMPLE);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<Settings>({
    opacity: 1,
    speed: 1,
    trackHeight: 28,
  });
  const startRef = useRef(performance.now());
  const timeRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      const elapsed = (t - startRef.current) / 1000;
      const ct = elapsed % LOOP;
      timeRef.current = ct;
      setCurrentTime(ct);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onSettings = useCallback((s: Settings) => setSettings(s), []);
  const onFilter = useCallback((key: string, enabled: boolean) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (enabled) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const onSend = useCallback((text: string) => {
    setItems((prev) => [
      ...prev,
      {
        id: `me-${Date.now()}`,
        text,
        mode: "scroll",
        time: timeRef.current,
        meta: { userId: "me", level: 5 },
      },
    ]);
  }, []);
  const onClear = useCallback(() => setItems([]), []);

  const Enhanced = useMemo(() => {
    const list = [];
    if (!disabled.has("sensitive"))
      list.push(createSensitiveFilterPlugin({ words: ["广告", "代刷"], mode: "mask" }));
    list.push(
      createFanBadgePlugin({
        badges: { u1: { name: "老粉", level: 6, color: "#ff7a29" } },
      })
    );
    list.push(createPinnedTopPlugin({ minLevel: 20 }));
    list.push(createKeywordHighlightPlugin({ keywords: ["福利", "抽奖", "高能"] }));
    if (!disabled.has("keyword"))
      list.push(createKeywordBlockPlugin({ words: ["竞品", "违规"] }));
    if (!disabled.has("mute"))
      list.push(createUserMutePlugin({ users: ["spam-bot"] }));
    list.push(createEmojiRenderPlugin());
    list.push(createAtMentionPlugin());
    list.push(createGiftComboPlugin());
    if (!disabled.has("lang"))
      list.push(createLangFilterPlugin({ allow: ["cjk", "latin"] }));
    list.push(createColorPolicyPlugin());
    list.push(createStylePresetPlugin());
    if (!disabled.has("dedup")) list.push(createDedupPlugin({ window: 5 }));
    list.push(
      createCmdParsePlugin({
        onCommand: (type) => {
          if (type === "clear") onClear();
        },
      })
    );
    list.push(createSpeedControlPlugin({ factor: settings.speed }));
    list.push(createSafeZonePlugin({ reservedBands: { top: 0.2, bottom: 0.14 } }));
    // UI 控制层
    list.push(createSettingsPanelPlugin({ onChange: onSettings }));
    list.push(createFilterTogglePlugin({ onToggle: onFilter }));
    list.push(createCommandInputPlugin({ onSend }));
    list.push(createStatsBarPlugin());
    return withDanmakuPlugins(DanmakuCore, list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, settings.speed]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 760,
        height: 420,
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #1b2a4a 0%, #0d1424 60%, #2a1730 100%)",
        boxShadow: "inset 0 0 80px rgba(0,0,0,0.45)",
      }}
    >
      <Enhanced
        items={items}
        currentTime={currentTime}
        playing
        opacity={settings.opacity}
        trackHeight={settings.trackHeight}
        containerStyle={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
