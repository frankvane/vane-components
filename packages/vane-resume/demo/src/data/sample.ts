/**
 * demo 共用的样例简历数据（不进 dist，仅演示站使用）
 *
 * 头像用内联 SVG data URI，避免演示站依赖外部图片资源（内网 / 离线也能跑）。
 */
import type { ResumeData } from "vane-resume";

const svg = (bg: string, letter: string) =>
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
      `<rect width="96" height="96" rx="48" fill="${bg}"/>` +
      `<text x="48" y="62" font-size="44" text-anchor="middle" fill="#fff" font-family="sans-serif">${letter}</text>` +
      `</svg>`
  );

export const AVATAR = svg("#2f6feb", "林");

export const SAMPLE_RESUME: ResumeData = {
  basics: {
    name: "林清扬",
    title: "高级前端工程师 · 组件体系负责人",
    avatar: AVATAR,
    summary:
      "8 年前端经验，主导过 3 个百万级 DAU 产品的组件库与可视化体系建设；擅长把「临时的业务需求」沉淀为可勾选、可组合的插件。",
    location: "上海",
    birthDate: "1992-04",
    contacts: [
      { type: "phone", label: "手机", value: "138-0000-8866" },
      { type: "email", label: "邮箱", value: "qingyang.lin@example.com" },
      { type: "address", label: "所在地", value: "上海 · 徐汇" },
      { type: "social", label: "GitHub", value: "github.com/qingyang", href: "https://github.com/" },
    ],
  },
  work: [
    {
      id: "w1",
      company: "云栖科技",
      role: "高级前端工程师 / 组件体系负责人",
      start: "2021-03",
      end: "至今",
      location: "上海",
      highlights: [
        "从 0 搭建插件化组件库，覆盖 20+ 业务模块，复用率从 31% 提升到 78%。",
        "主导可视化排版引擎，把简历 / 主页 / 数据看板的渲染收敛到同一套插槽契约。",
        "推动 TypeScript 全量迁移，类型覆盖率 92%，线上类型相关事故归零。",
      ],
    },
    {
      id: "w2",
      company: "明远网络",
      role: "前端工程师",
      start: "2018-07",
      end: "2021-02",
      location: "杭州",
      highlights: [
        "负责电商中台可视化搭建平台，拖拽编排日均服务 600+ 运营同学。",
        "优化首屏性能，关键路由 LCP 从 3.4s 降到 1.2s。",
      ],
    },
    {
      id: "w3",
      company: "初芒工作室",
      role: "前端实习生",
      start: "2017-06",
      end: "2018-06",
      location: "南京",
      highlights: ["参与多个 H5 营销活动页开发，独立交付 12 个活动。", "写了第一版组件规范文档。"],
    },
  ],
  education: [
    {
      id: "e1",
      school: "东南大学",
      degree: "硕士",
      major: "计算机科学与技术",
      start: "2015-09",
      end: "2018-06",
    },
    {
      id: "e2",
      school: "南京邮电大学",
      degree: "学士",
      major: "软件工程",
      start: "2011-09",
      end: "2015-06",
    },
  ],
  skills: [
    { category: "语言", items: ["TypeScript", "JavaScript", "HTML", "CSS"] },
    { category: "框架", items: ["React", "Vue", "Node.js"] },
    { category: "工程化", items: ["Vite", "Turborepo", "Monorepo", "Vitest"] },
    { category: "领域", items: ["可视化", "组件体系", "性能优化", "插件化架构"] },
  ],
  projects: [
    {
      id: "p1",
      name: "vane 插件化组件库",
      role: "作者 / 维护者",
      start: "2022-01",
      end: "至今",
      desc: "把业务需求拆成可勾选的插件，核心只负责结构化数据与插槽；20+ 插件按需装配。",
      links: ["https://vane.dev", "https://github.com/"],
    },
    {
      id: "p2",
      name: "可视化排版引擎",
      role: "核心开发",
      desc: "统一简历 / 主页 / 看板的渲染契约，CSS 变量驱动模板切换。",
      links: ["https://vane.dev/engine"],
    },
  ],
  awards: [
    { id: "a1", title: "年度技术之星", issuer: "云栖科技", date: "2023" },
    { id: "a2", title: "开源贡献奖", issuer: "CNCF", date: "2022" },
  ],
  languages: [
    { id: "l1", name: "中文", level: "母语" },
    { id: "l2", name: "English", level: "CET-6 / 可读写" },
  ],
  certificates: [
    { id: "c1", name: "系统架构设计师", issuer: "工信部", date: "2021" },
    { id: "c2", name: "PMP", issuer: "PMI", date: "2020" },
  ],
  attachments: [
    { id: "at1", name: "作品集.pdf", kind: "pdf", url: "https://vane.dev/portfolio.pdf", size: 2_400_000 },
    { id: "at2", name: "架构图.png", kind: "image", url: "https://vane.dev/arch.png" },
    { id: "at3", name: "在线主页", kind: "link", url: "https://vane.dev/u/qingyang" },
  ],
};
