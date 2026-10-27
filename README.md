# vane-components

插件式（plugin-first）React 组件库家族 monorepo。所有组件共享同一套内核 `vane-plugin-core`、同一套工程配置、同一套文档化模式，目标是：**新增一个插件式组件 = 复制模板 + 改名字，30 分钟内可开发、可发布。**

## 仓库结构

```
vane-components/
├── packages/
│   ├── plugin-core/          # vane-plugin-core 共用内核（发布）
│   ├── templates/            # 组件脚手架模板（不发布、不进 workspace）
│   ├── vane-lazy-image/      # 图片懒加载（迁移中）
│   ├── vane-card/            # 电商卡片（迁移中）
│   ├── vane-waterfall/       # 瀑布流布局（迁移中）
│   └── vane-file-preview/    # 文件预览（迁移中）
├── internal/                 # 内部共享配置（不发布）
│   ├── build-config/         # Vite lib / demo 配置工厂 + 入口自动发现
│   ├── tsconfig/             # 分层 tsconfig
│   ├── eslint-config/        # 统一 lint 规则
│   └── vitest-config/        # 统一测试配置
├── docs/                     # VitePress 文档站（唯一文档源）
│   ├── guide/                # 架构规范 / 开发 SOP / 发布流程
│   └── components/           # 每个组件的文档（结构统一）
└── scripts/                  # 脚手架、文档生成、发布校验
```

## 快速开始

```bash
pnpm install
pnpm build          # 构建所有包（turbo 按依赖顺序）
pnpm test           # 运行单测
pnpm verify         # lint + typecheck + test + 包卫生检查
pnpm docs:dev       # 启动文档站
pnpm new vane-xxx   # 从模板创建一个新的插件式组件
```

## 三条铁律

1. **react / react-dom 只出现在 `peerDependencies`**，绝不进 `dependencies`（否则消费方出现多实例 React）。
2. **插件系统只有一份实现**：`vane-plugin-core`。各组件包只写"领域钩子类型 + 领域插件"，不复制 Bus / Manager / withPlugins。
3. **文档只有一处源**：`docs/components/<包名>/`。npm README 与文档站都由 `docs:sync` / `docs:plugins` 生成，禁止手写两份。

## 文档

- [架构规范（Vane Plugin Spec）](docs/guide/architecture.md)
- [工程与命名约定](docs/guide/conventions.md)
- [从零开发一个新组件（SOP）](docs/guide/new-component.md)
- [编写一个插件（SOP）](docs/guide/new-plugin.md)
- [发布流程](docs/guide/releasing.md)

## License

MIT
