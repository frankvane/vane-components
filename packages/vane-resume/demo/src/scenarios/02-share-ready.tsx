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
} from "vane-resume/custom-plugins";
import { SAMPLE_RESUME } from "../data/sample";

export const meta = {
  id: "share-ready",
  title: "分享前准备 · 隐私护栏",
  group: "分享",
  ref: { label: "对标 公开主页", url: "https://vane.dev/" },
  pain: "把简历发给猎头 / 挂在公开主页前，电话邮箱必须脱敏，整页还要能一键打码防截图。",
  plugs: [
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
  note: "脱敏与隐私遮罩都依赖数据管道顺序：脱敏在前、遮罩在后，确保遮蔽的是已脱敏的内容。",
};

export default function ShareReady() {
  const Resume = useMemo(
    () =>
      withResumePlugins(ResumeCore, [
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
