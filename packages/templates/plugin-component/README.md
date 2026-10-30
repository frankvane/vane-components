# 插件式组件模板（plugin-component）

这是**新建一个 vane 插件式组件的唯一起点**。由 `pnpm new <name>` 自动复制并替换占位符，不建议手工从零搭建。

## 占位符

| 占位符 | 示例 | 含义 |
| --- | --- | --- |
| `__PKG_NAME__` | `vane-table` | npm 包名（kebab-case） |
| `__NAME__` | `Table` | 组件名（PascalCase） |
| `__NAME_KEBAB__` | `table` | 目录/子路径名（kebab-case） |
| `__TITLE__` | `数据表格` | 中文标题 |
| `__DESC__` | 一句话描述 | 包描述 |
| `__UMD_NAME__` | `VaneTable` | UMD 全局变量 |

## 模板里有什么

```
plugin-component/
├── package.json.tpl        # 发布配置模板（exports 由 sync-exports 生成）
├── vite.config.ts          # 库构建（引用 @vane/build-config）
├── vitest.config.ts        # 单测配置
├── tsconfig.json
├── eslint.config.js
├── src/
│   ├── index.ts            # 主入口
│   ├── entries/            # ./core、./plugins 子路径入口
│   ├── components/__NAME__Plugin/
│   │   ├── __NAME__Core.tsx      # 核心组件（刻意保持薄）
│   │   └── plugins/types.ts      # 领域钩子类型
│   └── custom-plugins/
│       └── ExamplePlugin/        # 插件三件套：create.tsx + doc.json + index.ts
├── demo/                   # 演示站（不发布）
└── docs/                   # 文档种子：建包时直接写到仓库级 docs/components/<pkg>/，不留在包内
```

新增组件时只需要改三处：`__NAME__Core.tsx`（领域核心）、`plugins/types.ts`（领域钩子）、`custom-plugins/*`（插件）。
