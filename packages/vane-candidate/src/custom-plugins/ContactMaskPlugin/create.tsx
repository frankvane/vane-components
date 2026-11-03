import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import { maskEmail, maskPhone } from "../../components/CandidatePlugin/domain";
import doc from "./doc.json";

export interface ContactMaskConfig {
  /** 是否脱敏邮箱 */
  maskEmail?: boolean;
  /** 是否脱敏手机号 */
  maskPhone?: boolean;
  /** 免脱敏阶段（如 offer/hired 阶段可见完整联系方式） */
  visibleStages?: string[];
}

/**
 * ContactMask —— 联系方式脱敏。
 * transformData 把邮箱 / 手机号替换为掩码（138****5678 / a***c@example.com），
 * visibleStages 内的阶段豁免（招聘后期需要完整联系方式联系候选人）。
 * 数据管道末位执行（priority 低于排序/筛选），保证排序仍用原始数据。
 */
export const createContactMaskPlugin: CandidatePluginCreator<ContactMaskConfig> = (
  config = {}
) => {
  const maskEmailOn = config.maskEmail ?? true;
  const maskPhoneOn = config.maskPhone ?? true;
  const visibleStages = config.visibleStages ?? [];
  return {
    name: "contact-mask",
    version: "0.1.0",
    description: doc.description,
    priority: 10,
    config: { order: 10 },
    hooks: {
      transformData: (_ctx, data) => {
        const list = (data as Candidate[]) ?? [];
        return list.map((c) => {
          if (visibleStages.includes(c.stage)) return c;
          const next = { ...c };
          if (maskEmailOn) next.email = maskEmail(c.email);
          if (maskPhoneOn) next.phone = maskPhone(c.phone);
          return next;
        }) as typeof data;
      },
    },
  };
};

createContactMaskPlugin.meta = doc as PluginDoc;
