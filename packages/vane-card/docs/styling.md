# 样式与主题（D4-B）

vane-card 的样式是**可选增强**：组件不靠 class 才有结构。

```ts
// 推荐：引入样式表（这一步可有可无，见下文「不引会怎样」）
import "vane-card/style.css";
```

## 不引 `style.css` 会怎样

组件照常渲染、照常交互，只是没有这套视觉：

- **结构在 DOM 里**：`<table>`、`<button>`、`<ul>/<li>`、`<label>+<select>` 等语义标签原样保留，
  读屏软件、键盘 Tab、表单提交都不受影响；
- **功能属性仍内联**：卡片容器的 `position: relative` / `box-sizing` / `padding` 留在内联样式里
  （overlay 插件靠它定位，padding 参与盒模型计算），所以绝对定位的浮层不会跑到别的祖先上去；
- **无障碍开关仍然生效**：`<A11yToolbar>` 的五个开关对应的 `:root[data-a11y-*]` 规则是
  **运行时注入**的（见 `A11yToolbar.tsx` 的 `ensureA11yStyles`），不依赖样式表；
- **缺的是**：间距、字号、颜色、圆角、边框、状态色（售罄红 / 低库存橙 / 在售绿）等纯外观。

`demo/no-style.html` 就是这一形态的对照页，与 `demo/index.html` 用同一份数据渲染。

## 两层文件

| 文件 | 内容 | 何时改 |
| --- | --- | --- |
| `src/styles/tokens.css` | `--vc-*` CSS 变量（颜色、圆角、间距、字号），全部挂在 `:root` | 换肤、调品牌色 |
| `src/styles/components.css` | `vc-` 前缀 class（38 个复合组件 + 卡片容器 + 各插槽区） | 改某个组件的排布 |

构建时由 `@vane/build-config` 的 `cssCopyPlugin` 合并输出为 `dist/style.css`
（`package.json` 的 `exports["./style.css"]` 指向它）。

## 换肤

优先级从低到高：

1. `:root` 默认值
2. 容器上加 `data-vc-theme="dark"`（整套暗色令牌）
3. 行内覆盖单个变量

```tsx
// 暗色：整块区域切到暗色令牌
<div data-vc-theme="dark">
  <ProductCard productId="p1" data={data}>…</ProductCard>
</div>

// 单点覆盖：只改强调色，不动其它
<ProductCard productId="p1" containerStyle={{ "--vc-accent": "#7c3aed" } as React.CSSProperties}>
  …
</ProductCard>
```

常用变量：`--vc-fg` `--vc-fg-dim` `--vc-fg-muted` `--vc-bg` `--vc-bg-subtle`
`--vc-border` `--vc-accent` `--vc-price` `--vc-danger` `--vc-success` `--vc-warning`
`--vc-radius` `--vc-gap` `--vc-fs-xs..lg`。完整清单见 `tokens.css`。

## 内联样式的归位规则

C4.3 把 127 处内联 `style` 逐条分了类，判断标准只有一条：

- **结构性**（`display` / `flex` / `gap` / `padding` / 字号 / 边框 / 圆角 / 固定色）→ 进 `components.css`
- **动态值**（用户传入的 `color`、数据驱动的色值、计算出的宽度、天数比例）→ 留在内联
- **主题相关但动态**（`theme` 属性）→ 传成 CSS 变量，例如 `CouponBar` 把主题色写成
  `--vc-coupon-accent`，这样宿主换主题时组件内部还能跟着变

文本属性（`className`）合并方式统一为 `${"vc-xxx"} ${className}`，宿主传入的类名永远在最后。

## class 命名

`vc-<component>[__<element>][--<modifier>]`，状态用 `.is-*`：

```
vc-stock  vc-stock--low  vc-stock--small
vc-summary  vc-summary__row  vc-summary__row--total
vc-option.is-selected
```

`test/styles.test.ts` 会静态对账源码与样式表：**源码里出现的 class 必须有定义，
CSS 里定义的 class 必须有人用**——这样 class 拼错会在 CI 变红，而不是悄悄掉样式。
新增组件时若忘了写样式（或删组件时忘了删样式），这条测试会拦住。
