import type {
  DanmakuData,
  DanmakuItem,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface GiftComboConfig {
  /** 连击识别：文案以 `基础词 xN` 结尾（N 为整数），默认 /^(.*?)\s*x(\d+)$/ */
  pattern?: string;
}

const DEFAULT_PATTERN = /^(.*?)\s*x(\d+)$/;

/**
 * GiftComboPlugin —— 礼物连击聚合（数据面）。
 * 同用户、相同「基础词」且紧邻出现（按数组顺序）的 `xN` 弹幕合并为一条，
 * 累加连击数写入 meta.combo；内核末尾绘制 `xN` 角标。非连击文案原样保留。
 */
export function createGiftComboPlugin(
  config: GiftComboConfig = {}
): DanmakuPlugin {
  const re = config.pattern ? new RegExp(config.pattern) : DEFAULT_PATTERN;

  return {
    name: "gift-combo",
    version: "0.1.0",
    description: doc.description,
    priority: 21,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const out = [];
        let last: {
          uid: string;
          base: string;
          count: number;
          item: DanmakuItem;
        } | null = null;
        for (const it of data.items) {
          const m = it.text.match(re);
          if (m && it.meta.userId) {
            const base = m[1];
            const n = parseInt(m[2], 10);
            if (last && last.uid === it.meta.userId && last.base === base) {
              last.count += n;
              // 就地更新 last.item（它即 out 中已 push 的同一引用），避免重新赋值丢失输出
              last.item.text = `${base} x${last.count}`;
              last.item.meta = { ...last.item.meta, combo: last.count };
              continue;
            }
            const merged: DanmakuItem = {
              ...it,
              text: `${base} x${n}`,
              meta: { ...it.meta, combo: n },
            };
            last = { uid: it.meta.userId, base, count: n, item: merged };
            out.push(merged);
            continue;
          }
          last = null;
          out.push(it);
        }
        return { ...data, items: out };
      },
    },
  };
}

createGiftComboPlugin.meta = doc as PluginDoc;
