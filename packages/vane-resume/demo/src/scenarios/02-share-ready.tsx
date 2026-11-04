/**
 * 分享前准备：脱敏 + 隐私遮罩 + 二维码 + 分享链接，公开传播前的隐私护栏。
 */
import React, { useMemo } from "react";
import { ResumeCore, withResumePlugins } from "vane-resume";
import {
  createContactDesensitizePlugin,
  createPrivacyMaskPlugin,
  createQrCodePlugin,
  createShareLinkPlugin,
  createAttachmentPreviewPlugin,
  createMultiLangPlugin,
  createAiPolishPlugin,
} from "vane-resume/custom-plugins";
import { SAMPLE_RESUME } from "../data/sample";

export const meta = {
  id: "share-ready",
  title: "分享前准备 · 隐私护栏",
  group: "分享",
  ref: { label: "对标 公开主页", url: "https://vane.dev/" },
  pain: "把简历发给猎头 / 挂在公开主页前，电话邮箱必须脱敏，整页还要能一键打码防截图。",
  plugs: [
    {
      fn: "createMultiLangPlugin",
      cfg: `{ locales: [{ code: "zh", label: "中" }, { code: "en", label: "EN" }], translations: { en: { basics: { name: "Qingyang Lin", title: "Researcher", contacts: [] }, summary: "PhD candidate in Computer Science." } } }`,
      why: "脱敏管线的本地化前置：先定目标语言，润色 / 脱敏在其结果上进行。",
    },
    {
      fn: "createAiPolishPlugin",
      cfg: `{ polish: async (text) => text.replace(/负责/g, "主导") }`,
      why: "contact-desensitize 依赖它（先润色再脱敏），缺失会被整条忽略。",
    },
    { fn: "createContactDesensitizePlugin", cfg: `{}`, why: "电话 / 邮箱 / 地址做可逆脱敏（138****1234）。" },
    { fn: "createPrivacyMaskPlugin", cfg: `{}`, why: "一键进入隐私模式，整页毛玻璃或字段级隐藏。" },
    { fn: "createQrCodePlugin", cfg: `{ content: "https://vane.dev/r/qingyang" }`, why: "把主页 / 联系方式编码成二维码，角标常显。" },
    {
      fn: "createShareLinkPlugin",
      cfg: `{ onBuildUrl: (d) => "https://vane.dev/r/" + encodeURIComponent(d.basics.name) }`,
      why: "生成可分享 URL，弹窗复制；无宿主时提示数据安全。",
    },
    { fn: "createAttachmentPreviewPlugin", cfg: `{}`, why: "附件卡片列出，点击灯箱预览，避免直接暴露下载地址。" },
  ],
  props: [],
  note: "完整管线是「本地化 → 润色 → 脱敏 → 遮罩」：脱敏与隐私遮罩都依赖上游顺序，确保遮蔽的是已润色、已脱敏的内容。",
};

export default function ShareReady() {
  const Resume = useMemo(
    () =>
      withResumePlugins(ResumeCore, [
        // contact-desensitize 声明依赖 ai-polish，ai-polish 又依赖 multi-lang：
        // 缺任一环，plugin-core 会把下游插件整体忽略（脱敏按钮 / 遮罩都不出现），所以一并注册。
        createMultiLangPlugin({
          locales: [
            { code: "zh", label: "中" },
            { code: "en", label: "EN" },
          ],
          translations: {
            en: {
              basics: {
                name: "Qingyang Lin",
                title: "Researcher",
                contacts: [],
                summary: "PhD candidate in Computer Science.",
              },
            },
          },
        }),
        // demo 用本地 mock 润色（与 demos/_factory.tsx 同款替换规则），真实项目注入自己的 polish 服务
        createAiPolishPlugin({
          polish: async (text) =>
            (text || "").replace(/负责/g, "主导").replace(/参与/g, "牵头"),
        }),
        createContactDesensitizePlugin({}),
        createPrivacyMaskPlugin({}),
        createQrCodePlugin({ content: "https://vane.dev/r/qingyang" }),
        createShareLinkPlugin({
          onBuildUrl: (d) =>
            "https://vane.dev/r/" + encodeURIComponent((d as { basics: { name: string } }).basics.name),
        }),
        createAttachmentPreviewPlugin({}),
      ]),
    []
  );
  return <Resume data={SAMPLE_RESUME} containerStyle={{ maxWidth: 600, margin: "0 auto" }} />;
}
