<p align="center">
  <a href="https://www.npmjs.com/package/vane-resume"><img src="https://img.shields.io/npm/v/vane-resume.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-resume"><img src="https://img.shields.io/npm/dm/vane-resume.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>

# 结构化简历

> 插件式 React 简历系统
>
> 插件式组件：`ResumeCore` 负责核心渲染，其余能力全部通过插件按需组合。

## 特性

- 插件化架构，核心稳定、能力可无限扩展
- Tree-shaking 友好：只打包你用到的插件
- TypeScript 类型完备
- 与 `vane-plugin-core` 共用同一套插件规范

## 安装

```bash
npm install vane-resume
```

## 30 秒上手

```tsx
import { ResumeCore, withPlugins } from "vane-resume";
import { createTemplateSwitchPlugin } from "vane-resume/custom-plugins/TemplateSwitchPlugin";

const Enhanced = withPlugins(ResumeCore, [
  createTemplateSwitchPlugin(),
]);

<Enhanced data={resumeData} />;
```

## 包体积

| 导入方式 | Gzip |
| --- | --- |
| 核心 + 装配（含 ResumeCore） | ~9.1 KB |
| 插件按子路径逐个按需引入 | 每个 1–3 KB |

## 文档

- [API](../../docs/components/vane-resume/api.md)
- [插件目录](../../docs/components/vane-resume/plugins.md)
- [组合配方](../../docs/components/vane-resume/recipes.md)

## License

MIT
