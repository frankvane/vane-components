import React from "react";
import { __NAME__Core, withPlugins } from "__PKG_NAME__";
import { createExamplePlugin } from "__PKG_NAME__/custom-plugins/ExamplePlugin";
import type { DemoMeta } from "./types";

/**
 * 00 · 最小可用
 *
 * 内核起步，只叠一个示例插件 —— 先把「装配 → 渲染」这条链跑通，
 * 再按需往 withPlugins 的数组里加插件。
 *
 * 注意 import 是「消费者视角」包名（demo/vite.config.ts 的 alias 指回 src），
 * 页面里展示的源码可以原样复制到真实项目。
 */
export const meta: DemoMeta = {
  slug: "basic",
  title: "最小可用",
  group: "basic",
  intro: "内核 + 一个插件跑通装配链路；加插件就是往 withPlugins 数组里加一项。",
};

const Enhanced = withPlugins(__NAME__Core, [createExamplePlugin({ text: "ExamplePlugin" })]);

const items = Array.from({ length: 6 }, (_, i) => ({ id: String(i), label: `item ${i}` }));

export default function Stage() {
  return (
    <Enhanced
      items={items}
      renderItem={(item) => (
        <div key={item.id} style={{ padding: 12, borderBottom: "1px solid var(--rule)" }}>
          {item.label}
        </div>
      )}
      containerStyle={{ maxWidth: 480 }}
    />
  );
}
