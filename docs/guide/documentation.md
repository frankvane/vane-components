# 文档化模式

## 核心原则

> 文档只有一处源。README、文档站、插件目录表，全部由脚本从同一个源生成。

```
docs/components/<pkg>/
├── index.md    概述 / 特性 / 安装 / 30 秒上手 / 体积     ← 唯一定义内容的地方
├── api.md      Core props / ref / 插件接口 / 上下文
├── plugins.md  插件目录表（AUTO 标记之间由脚本生成）
└── recipes.md  预设配方
        │
        ├── pnpm docs:sync   → packages/<pkg>/README.md（npm 首屏）
        └── pnpm docs:plugins → plugins.md 表格 + 文档站导航
```

**禁止直接手改 `packages/<pkg>/README.md`**——它会被下次同步覆盖。

## 插件文档是数据，不是散文

每个插件必须带 `doc.json`：

| 字段 | 用途 |
| --- | --- |
| `name` | 表格与导航显示名 |
| `description` | 表格说明列 |
| `since` | 引入版本 |
| `tags` | 分组筛选 |
| `config[]` | 配置项表（name/type/default/description） |
| `example` | 用法片段 |
| `conflicts[]` | 互斥插件提示 |

`pnpm docs:plugins` 会扫描所有 `src/custom-plugins/*/doc.json`，重写 `plugins.md` 中 `AUTO-GENERATED:BEGIN/END` 之间的内容。好处：

- 新增插件忘记写文档 → CI 直接能看到表格缺行；
- README 与文档站的插件目录永远一致；
- demo 侧边导航也可以用同一份数据生成。

## npm README 首屏模板（强制）

消费方在 npm 页面第一屏必须看到，顺序固定：

1. 徽章（version / downloads / demo）
2. 一句话定位
3. **安装**：`npm install <pkg>`
4. **30 秒上手**：最小可运行示例（≤ 15 行）
5. 核心 API 表
6. 插件/能力目录表
7. 包体积
8. License + 链接

> 旧仓库把「clone 仓库跑 demo」放在安装位置，消费方第一公里就断了。这条由 `pnpm check` 强制（README 必须包含 `npm install <pkg>`）。

## API 文档怎么写

`api.md` 只写**稳定的公共 API**，且每张表必须包含：属性 / 类型 / 默认值 / 说明 四列。内部实现细节不写进 api.md，写进源码 JSDoc。

## 演示站即文档

`demo/src/pages/` 下一个页面一个主题，页面代码就是可复制示例。演示站不发布（`files: ["dist"]`），只作为在线文档：

- 每个 preset 配方一个页面；
- 每个插件一个最小示例；
- 页面顶部用 `<p>` 说明这个页面演示什么、关键配置是什么。
