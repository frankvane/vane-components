import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, 
  ResumeData,
  ContactItem,
} from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn, cloneData } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export type ContactType = ContactItem["type"];
export interface ContactDesensitizeConfig {
  mode?: "mask" | "hide" | "show";
  fields?: ContactType[];
  /** 自定义脱敏器（按类型覆盖默认） */
  masks?: Partial<Record<ContactType, (v: string) => string>>;
}

const MASK = "***";

/** 头尾保留、中间全遮；短文本无法保留结构时直接全隐藏 */
const maskKeepEnds = (value: string, head: number, tail: number): string => {
  const chars = Array.from(value);
  if (chars.length <= head + tail) return MASK;
  return `${chars.slice(0, head).join("")}${MASK}${chars.slice(-tail).join("")}`;
};

/**
 * 默认脱敏：按类型归一化处理，无法可靠保留结构时回退为全隐藏。
 * - 手机号先剔除非数字（兼容 +86 / 138-0013-8000 / 空格分隔）；
 * - 邮箱按最后一个 @ 切分，本地部分与域名都遮罩，异常值（多个 @ / 无 @）直接全隐藏；
 * - 地址 / 社交文本过短时直接全隐藏，避免正则不命中导致明文泄漏。
 */
const defaultMask = (type: ContactType, value: string): string => {
  switch (type) {
    case "phone": {
      let digits = value.replace(/\D/g, "");
      if (digits.length > 11 && digits.startsWith("86")) digits = digits.slice(2);
      if (digits.length < 7) return MASK;
      return `${digits.slice(0, 3)}${MASK}${digits.slice(-4)}`;
    }
    case "email": {
      const at = value.lastIndexOf("@");
      if (at <= 0 || at === value.length - 1) return MASK;
      const local = value.slice(0, at);
      const domain = value.slice(at + 1);
      const dot = domain.lastIndexOf(".");
      const tld = dot >= 0 ? domain.slice(dot) : "";
      return `${local.slice(0, 1) || "*"}${MASK}@${domain.slice(0, 1)}${MASK}${tld}`;
    }
    case "address":
    case "social":
    default:
      return maskKeepEnds(value, 2, 2);
  }
};

export const createContactDesensitizePlugin: ResumePluginCreator<ContactDesensitizeConfig> = (config = {}) => {
  const mode = config.mode ?? "mask";
  const fields = config.fields ?? ["phone", "email", "address", "social"];
  const masks = config.masks ?? {};
  const maskOne = (c: ContactItem, hide: boolean): ContactItem => {
    if (!fields.includes(c.type)) return c;
    const value = hide
      ? "***"
      : (masks[c.type] ?? ((v) => defaultMask(c.type, v)))(c.value);
    // 脱敏后必须同时移除 href：mailto:/tel: 里仍带原文，否则点击链路可绕过打码
    return { ...c, value, href: undefined };
  };

  return {
    name: "contact-desensitize",
    version: "0.1.0",
    description: doc.description,
    priority: 48,
    config: { order: 48 },
    // 依赖 ai-polish：脱敏放在翻译 / 润色之后，避免脱敏文本被再次处理
    dependencies: ["ai-polish"],
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (ctx.state.contactMode === undefined) ctx.setState({ contactMode: mode });
      },
      // 管道末位，脱敏放在翻译 / 润色之后
      transformData: (ctx, data) => {
        const m = (ctx.state.contactMode as string) ?? mode;
        if (m === "show") return data;
        const d = cloneData(data as ResumeData);
        if (d.basics?.contacts) {
          d.basics.contacts = d.basics.contacts.map((c) => maskOne(c, m === "hide"));
        }
        return d;
      },
      renderToolbar: (ctx) => {
        const current = (ctx.state.contactMode as string) ?? mode;
        const cycle = () => {
          const next = current === "show" ? "mask" : current === "mask" ? "hide" : "show";
          ctx.setState({ contactMode: next });
        };
        const label = current === "show" ? "联系：明文" : current === "mask" ? "联系：脱敏" : "联系：隐藏";
        return (
          <button key="contact-desensitize" type="button" onClick={cycle} style={toolbarBtn(current !== "show")}>
            {label}
          </button>
        );
      },
    },
  };
};

createContactDesensitizePlugin.meta = doc as PluginDoc;
