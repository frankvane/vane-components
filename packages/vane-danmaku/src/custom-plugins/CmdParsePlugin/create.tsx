import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface CmdParseConfig {
  /** 指令前缀，默认 ["/", "#"] */
  prefixes?: string[];
  /** 已知指令名 -> bus 事件 type（命中后从渲染流移除并发事件） */
  commands?: Record<string, string>;
  /** 命中指令回调（type, payload, item）；与 bus 广播并存，消费方可据此清屏/抽奖等 */
  onCommand?: (type: string, payload: string, item: DanmakuData["items"][number]) => void;
}

/**
 * CmdParsePlugin —— 互动指令解析（数据面拦截）。
 * 形如 `/clear`、`#lottery` 的弹幕在 transformData 阶段被识别：从渲染流移除，
 * 经 ctx.bus.emit("danmaku:command", { type, payload, item }) 触发业务动作
 * （消费方监听清空屏幕 / 抽奖弹层等）。非已知指令则当普通弹幕保留。
 */
export function createCmdParsePlugin(
  config: CmdParseConfig = {}
): DanmakuPlugin {
  const prefixes = config.prefixes ?? ["/", "#"];
  const commands = config.commands ?? { clear: "clear", lottery: "lottery" };
  // transformData 会随播放时钟推进多次执行；指令是「一次性副作用」，
  // 必须按 id 去重，否则同一句 /clear 会被广播多次、抽奖被重复触发。
  const handled = new Set<string>();

  return {
    name: "cmd-parse",
    version: "0.1.0",
    description: doc.description,
    priority: 13,
    enabled: true,
    hooks: {
      transformData: (
        context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const kept = [];
        for (const it of data.items) {
          const head = it.text.trim();
          const prefix = prefixes.find((p) => head.startsWith(p));
          if (!prefix) {
            kept.push(it);
            continue;
          }
          const rest = head.slice(prefix.length);
          const name = rest.split(/\s+/)[0].toLowerCase();
          const type = commands[name];
          if (!type) {
            kept.push(it);
            continue;
          }
          const payload = rest.slice(name.length).trim();
          if (handled.has(it.id)) continue; // 已触发过：保持不渲染，但不再重复发事件
          handled.add(it.id);
          context.bus.emit("danmaku:command", { type, payload, item: it });
          config.onCommand?.(type, payload, it);
          // 命中指令：不 push → 不渲染
        }
        return { ...data, items: kept };
      },
    },
  };
}

createCmdParsePlugin.meta = doc as PluginDoc;
