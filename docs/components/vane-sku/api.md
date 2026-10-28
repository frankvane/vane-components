# 规格选择 · API

## `SkuCore`

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `SkuItem[]` | `[]` | 数据集合 |
| `renderItem` | `(item, index) => ReactNode` | - | 单项渲染函数 |
| `containerClassName` | `string` | - | 容器类名 |
| `containerStyle` | `React.CSSProperties` | - | 容器样式 |
| `onMount` / `onUnmount` | `() => void` | - | 挂载/卸载回调（会被插件钩子转发） |
| `debug` | `boolean` | `false` | 打印插件注册与钩子日志 |

### Ref

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取根 DOM |
| `forceUpdate()` | 强制刷新 |
| `getSize()` | 取容器尺寸 |

## `withPlugins(Core, plugins)`

把插件装配到核心组件上。两种写法等价：

```tsx
withPlugins(SkuCore, [createExamplePlugin()]);
withPlugins(SkuCore, { plugins: [createExamplePlugin()], enableDebug: true });
```

## 插件接口

```ts
interface Plugin<TProps = any> {
  name: string;                 // 唯一标识，kebab-case
  hooks: PluginHooks<TProps>;   // 通用钩子 + 领域钩子
  dependencies?: string[];      // 依赖的插件（先注册依赖）
  priority?: number;            // 越大越先执行
  sandbox?: boolean;            // 默认 true，错误隔离
  timeout?: number;             // 异步钩子超时，默认 3000ms
  config?: Record<string, any>; // 渲染排序用 config.order / config.slotPosition
}
```

通用钩子：`onMount` / `onUnmount` / `onPropsChange` / `onError` / `transformProps` / `transformData` / `renderOverlay` / `renderHeader` / `renderFooter`。
领域钩子见 `plugins/types.ts`（如 `filterItem`）。

钩子返回语义：`false` 中断链；其他非 `undefined/true` 的值短路返回。

## 上下文

```ts
interface PluginContext<TProps = any> {
  props: TProps;
  data?: any;
  bus: PluginBus;               // emit/on/once/off + getData/setData
  refs: { container, getContainer };
  state: Record<string, unknown>;
  setState(patch): void;
  shared: Map<string, unknown>;
  deviceInfo: DeviceInfo;
  forceUpdate(): void;
  getSize(): { width, height };
  logger: PluginLogger;
}
```

## 自定义插件

```ts
import type { Plugin } from "vane-sku";

export const createMyPlugin = (config = {}) => ({
  name: "my-plugin",
  config,
  hooks: {
    onMount: (ctx) => {
      return () => {
        /* cleanup */
      };
    },
    renderOverlay: (ctx) => <div className="my-overlay" />,
  },
});
```
