# 规格选择

> 插件式 React SKU 规格选择引擎：组合矩阵 / 禁用推导 / 价格联动 / 限购校验
>
> 插件式组件：`SkuCore` 负责核心渲染，其余能力全部通过插件按需组合。

## 特性

- 插件化架构，核心稳定、能力可无限扩展
- Tree-shaking 友好：只打包你用到的插件
- TypeScript 类型完备
- 与 `vane-plugin-core` 共用同一套插件规范

## 安装

```bash
npm install vane-sku
```

## 30 秒上手

```tsx
import { SkuCore, withPlugins } from "vane-sku";
import { createExamplePlugin } from "vane-sku/custom-plugins/ExamplePlugin";

const Enhanced = withPlugins(SkuCore, [
  createExamplePlugin({ text: "Hello" }),
]);

<Enhanced items={items} renderItem={(item) => <div>{item.label}</div>} />;
```

## 包体积

| 导入方式 | Gzip |
| --- | --- |
| 仅核心 `vane-sku/core` | ~x KB |
| 核心 + 2 个插件 | ~x KB |

## 文档

- [API](api.md)
- [插件目录](plugins.md)
- [组合配方](recipes.md)

## License

MIT
