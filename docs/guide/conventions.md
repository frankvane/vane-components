# 工程与命名约定

## 目录约定

```
packages/vane-xxx/
├── package.json          # exports 由 pnpm sync:exports 生成，勿手改
├── vite.config.ts        # 引用 @vane/build-config 的 createLibConfig
├── vitest.config.ts      # 引用 @vane/vitest-config
├── tsconfig.json         # extends @vane/tsconfig/lib
├── eslint.config.js      # 引用 @vane/eslint-config
├── src/
│   ├── index.ts          # 主入口：Core + withPlugins + 常用插件
│   ├── entries/          # 子路径入口：core.ts / plugins.ts
│   ├── components/XxxPlugin/
│   │   ├── XxxCore.tsx   # 核心组件（薄）
│   │   ├── plugins/types.ts  # 领域钩子类型（每个包唯一需要自己写的类型层）
│   │   └── compound/     # 可选：复合组件
│   ├── custom-plugins/<Name>Plugin/
│   │   ├── doc.json      # 机器可读文档（必须）
│   │   ├── create.ts     # 工厂 create<Name>Plugin（必须）
│   │   └── index.ts      # 桶导出（必须）
│   └── styles/*.css      # 可选，自动复制到 dist/style.css
├── demo/                 # 演示站，不发布
├── test/                 # vitest，与 src 同构
└── docs/                 # 模板自带副本；真正维护在仓库级 docs/components/<pkg>/
```

**源码路径 == 发布子路径**，这是 exports 永远可预测的原因：

| 源码 | 发布子路径 | 产物 |
| --- | --- | --- |
| `src/index.ts` | `.` | `dist/index.js` |
| `src/entries/core.ts` | `./entries/core` | `dist/entries/core.js` |
| `src/<目录>/index.ts` | `./<目录>` | `dist/<目录>/index.js` |
| `src/custom-plugins/X/index.ts` | `./custom-plugins/X` | `dist/custom-plugins/X/index.js` |

> `components/` 是组件内部目录，不发布为入口。d.ts 与 JS 走同一套相对路径，仅差扩展名。

## 依赖声明（最容易出错的一条）

| 依赖 | 放哪 |
| --- | --- |
| `react` / `react-dom` | **只放 `peerDependencies`** |
| `vane-plugin-core` | `peerDependencies`（保证全站单实例） |
| 运行时第三方库（如 `localforage`） | `dependencies`，并加进 vite `external` |
| 演示站用的库（react-markdown、react-router-dom 等） | **只放 `devDependencies`** |

> 旧仓库把 react 写进 `dependencies`、把 demo 依赖写进 `dependencies`，导致消费方重复安装 React。新结构由 `pnpm check` 强制拦这条。

## 命名

| 对象 | 规则 | 示例 |
| --- | --- | --- |
| npm 包 | `vane-<kebab>` 或 `@vane/<kebab>` | `vane-table`、`vane-plugin-core` |
| 核心组件 | `XxxCore` | `TableCore` |
| 插件目录 | `<Name>Plugin` | `FadeInPlugin` |
| 插件工厂 | `create<Name>Plugin` | `createFadeInPlugin` |
| 插件 `name` 字段 | kebab-case | `fade-in` |
| 领域钩子 | 动词开头 | `filterItem`、`calculateItemPosition` |
| CSS 变量 | `--vane-<component>-<token>` | `--vane-table-row-hover` |
| 事件 | `域:动作` | `sku:change`、`price:change` |

## TypeScript

- `strict: true`，但 `no-explicit-any` 在插件系统内允许（降级 warn）——插件钩子签名天生需要 `any`；
- 公共 API 必须有显式返回类型；
- `import type` 与 `import` 分开写，保证 `isolatedModules` 安全。

## 提交与分支

- 分支：`feat/<包名>-<主题>`、`fix/<包名>-<主题>`；
- 提交：约定式提交，`feat(vane-table): 新增列固定插件`；
- 发版一律走 changesets，不允许手动改 version。
