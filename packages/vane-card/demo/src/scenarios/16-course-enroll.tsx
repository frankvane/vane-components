/**
 * 场景 16 · 在线课程：试看是第一屏
 *
 * 课程不是「看参数下单」的品类，用户要先确认「讲得对不对我的胃口」。
 * 所以视频试看必须放在最前，班期选择次之，价格最后 —— 顺序错了，
 * 转化会在「这课讲什么」这一步就断掉。
 *
 * 班期是 SKU（10 月班 / 11 月班），但和服饰不同的是：班期之间**不能换货**，
 * 选错了只能退。所以这里把「开班日期」写进选项文案，而不是只写「第 8 期」。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createCouponPlugin,
  createInventoryPlugin,
  createPriceCalculatorPlugin,
  createSKUPlugin,
  createVideoPlugin,
} from "vane-card/custom-plugins";
import demoVideo from "../assets/demo.mp4?url";
import { COURSE, skuVariantsOf } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "course-enroll",
  title: "课程：试看 + 班期",
  group: "内容",
  industry: "在线课程",
  ref: { label: "课程详情（试看 + 班期 + 早鸟价）", url: "https://github.com/frankvane/vane-components" },
  pain: "课程页最常见的错误是先摆价格和「立即报名」，而用户此刻只想知道「这课讲什么、讲得好不好」。",
  plugs: [
    { fn: "createVideoPlugin", cfg: "src: demoVideo, controls: true", why: "试看放在最前，是转化的第一道门" },
    { fn: "createSKUPlugin", cfg: "attributes: attrs, variants: variants", why: "班期是 SKU，选错只能退不能换" },
    { fn: "createPriceCalculatorPlugin", cfg: "showOriginalPrice: true, showSavings: true", why: "早鸟券的作用要落在「省了多少」上，而不是改原价" },
    { fn: "createInventoryPlugin", cfg: "lowStockThreshold: 15", why: "小班课名额少，「剩 16 席」是真实决策信息" },
    { fn: "createCouponPlugin", cfg: "coupons: coupons", why: "早鸟价用券表达，别改原价（会破坏历史订单对账）" },
  ],
  props: ["padding={16}"],
  note: "早鸟优惠用券而不是直接改 price：「原价 899 / 早鸟 499」这种叙事一旦落到原价字段上，退款和对账就全乱了。",
};

const COUPONS = [
  // 早鸟与拼团都是「减多少」，用券表达，不动 price 字段
  { code: "早鸟立减 400", discount: 400, minAmount: 0 },
  { code: "拼团再减 100", discount: 100, minAmount: 499 },
];

const Card = withPlugins(CardCore, {
  plugins: [
    createVideoPlugin({ src: demoVideo, controls: true, muted: true }),
    createSKUPlugin({ attributes: COURSE.attributes, variants: skuVariantsOf(COURSE) }),
    createPriceCalculatorPlugin({ showOriginalPrice: true }),
    createInventoryPlugin({ lowStockThreshold: 15 }),
    createCouponPlugin({ coupons: COUPONS }),
  ],
});

export default function CourseEnroll() {
  return (
    <Card cardId="scn-course" data={COURSE} padding={16}>
      <div className="scn-content">
        <div className="scn-content__title">{COURSE.title}</div>
        <div className="scn-content__sub">12 周 / 24 节 · 直播 + 回放永久 · 作业逐份批改</div>
      </div>
    </Card>
  );
}
