/**
 * 插件工坊 · 生成当前勾选组合的完整可运行源码
 *
 * 为什么是「生成」而不是手写一份：工坊的组件是运行时按勾选拼出来的，没有对应
 * 磁盘文件可以 `?raw`。硬手写一份就会和真实装配漂移 —— 所以这里不抄代码，
 * 只从 `data/plugins.ts` 的同一份 registry 推导：
 *   - import 路径 / 工厂名   ← PluginInfo.dir / factory
 *   - 工厂参数              ← PluginInfo.args（就是喂给 make() 的那一份）
 *   - 装配顺序              ← priority 升序（与内核执行顺序一致）
 *   - 演示数据              ← 调用方传入的 ActivityData（序列化成字面量，复制后自含）
 *
 * 生成结果复制到项目里、`npm install vane-activity` 后即可原样运行。
 */
import type { ActivityData } from "vane-activity";
import type { PluginInfo } from "../data/plugins";

/** 把数据序列化成带缩进的 JS 字面量（key 能省引号就省，读起来更像手写代码） */
function literal(value: unknown, depth = 0): string {
  const pad = "  ".repeat(depth + 1);
  const close = "  ".repeat(depth);

  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return JSON.stringify(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((v) => pad + literal(v, depth + 1)).join(",\n")},\n${close}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => v !== undefined
  );
  if (entries.length === 0) return "{}";
  const body = entries.map(([k, v]) => {
    const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
    return `${pad}${key}: ${literal(v, depth + 1)}`;
  });
  return `{\n${body.join(",\n")},\n${close}}`;
}

/** 工厂实参：零参直接空括号，有参才写对象字面量 */
function callOf(plugin: PluginInfo): string {
  const keys = Object.keys(plugin.args);
  if (keys.length === 0) return `${plugin.factory}()`;
  return `${plugin.factory}(${literal(plugin.args).replace(/\n/g, "\n  ")})`;
}

export interface GenSourceOptions {
  /** 已勾选的插件（顺序无所谓，内部按 priority 升序排） */
  plugins: PluginInfo[];
  /** 演示数据；序列化进源码，保证复制后不需再找第二个文件 */
  data: ActivityData;
}

export function genWorkshopSource({ plugins, data }: GenSourceOptions): string {
  const ordered = [...plugins].sort((a, b) => a.priority - b.priority);
  const imports = ordered
    .map(
      (p) =>
        `import { ${p.factory} } from "vane-activity/custom-plugins/${p.dir}";`
    )
    .join("\n");

  const calls = ordered.map((p) => `  ${callOf(p)},`).join("\n");
  const pluginList = ordered.length === 0 ? "[]" : `[\n${calls}\n]`;

  const combo =
    ordered.length === 0
      ? "裸内核（一个插件都没装）"
      : `${ordered.map((p) => p.dir).join(" + ")}（${ordered.length} 个）`;

  return `/**
 * 插件工坊 · 勾选组合的完整源码（复制即可运行）
 *
 * 组合：${combo}
 * 装配顺序按 priority 升序，与勾选的先后无关。
 * 依赖：npm install vane-activity react react-dom
 */
import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
${imports ? `${imports}\n` : ""}
// 演示数据：改这里即改界面（进度 = 任务完成度加权平均）
const data: ActivityData = ${literal(data)};

// 装配：内核只提供语义骨架 + 生命周期，行为全在插件里
const Activity = withPlugins(ActivityCore, ${pluginList});

export default function App() {
  return (
    <Activity
      data={data}
      onTaskAction={(id) => console.log("task action", id)}
      onClaim={(id) => console.log("claim", id)}
    />
  );
}
`;
}
