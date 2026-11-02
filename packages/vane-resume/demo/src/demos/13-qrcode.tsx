import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "qrcode",
  title: "二维码",
  group: "plugin",
  plugin: "QrCodePlugin",
  intro: "把联系方式 / 链接编码成二维码，作常显角标或弹窗展示（qrcode 库按需加载）。",
  why: "线下物料、招聘海报扫一扫直达主页，比贴长链接友好。",
  plugs: [
    {
      fn: "createQrCodePlugin",
      cfg: `content: "https://vane.dev/r/qingyang"`,
      why: "renderOverlay 在右上角常显二维码，点击放大；内容可传字符串或函数。",
    },
  ],
  props: [],
};

export default makeStage("QrCodePlugin");
