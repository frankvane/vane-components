import { defineConfig } from "vitepress";
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * 组件侧边栏自动生成：扫 docs/components 下各组件的 index.md，
 * 新增组件不需要手动改导航（配合 pnpm new 使用）。
 */
const componentsDir = path.resolve(__dirname, "../components");
const components = existsSync(componentsDir)
  ? readdirSync(componentsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
  : [];

const componentSidebar = components.map((name) => ({
  text: name,
  collapsed: true,
  items: [
    { text: "概述", link: `/components/${name}/` },
    { text: "API", link: `/components/${name}/api` },
    { text: "插件目录", link: `/components/${name}/plugins` },
    { text: "组合配方", link: `/components/${name}/recipes` },
  ],
}));

export default defineConfig({
  title: "vane-components",
  description: "插件式 React 组件库家族",
  lang: "zh-CN",
  base: "/",
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/architecture" },
      { text: "组件", link: components.length ? `/components/${components[0]}/` : "/guide/architecture" },
    ],
    sidebar: [
      {
        text: "指南",
        items: [
          { text: "架构规范（Vane Plugin Spec）", link: "/guide/architecture" },
          { text: "工程与命名约定", link: "/guide/conventions" },
          { text: "从零开发一个新组件", link: "/guide/new-component" },
          { text: "编写一个插件", link: "/guide/new-plugin" },
          { text: "文档化模式", link: "/guide/documentation" },
          { text: "内核 API", link: "/guide/plugin-core-api" },
          { text: "关键决策记录", link: "/guide/decisions" },
          { text: "发布流程", link: "/guide/releasing" },
        ],
      },
      {
        text: "组件",
        items: componentSidebar.map((c) => ({ text: c.text, link: c.items[0].link })),
      },
      {
        text: "组件详情",
        collapsed: true,
        items: componentSidebar.flatMap((c) =>
          c.items.map((i) => ({ text: `${c.text} · ${i.text}`, link: i.link }))
        ),
      },
    ],
  },
});
