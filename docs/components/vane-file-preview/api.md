# API

vane-file-preview 的公开 API 分三层：

- **Core**：`FilePreviewCore` 组件 —— 加载状态机 + ref，不渲染任何内容，内容由插件决定。
- **装配器**：`withPlugins(Core, { plugins })` —— 把插件装到 Core 上，产出一个可直接渲染的预览组件。
- **路由 / 契约**：`resolvePreview` 等纯函数，以及 `FileInfo` / `FilePreviewPlugin` / `FilePreviewPluginContext` 等类型。

所有类型从 `vane-file-preview/core` 导出（不含任何插件）；`withPlugins` 与 Core 也在根入口 `vane-file-preview` 中。

---

## `FilePreviewCoreProps`

传给 `FilePreviewCore` / `withPlugins` 产物组件的 props。

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `file` | `FileInfo` | **必填**。要预览的文件（见下方 `FileInfo`） |
| `onBeforeLoad` | `() => Promise<boolean> \| boolean` | 加载前拦截；返回 `false` 则中止加载（状态回到 `idle`，不自动重试） |
| `onLoadStart` | `() => void` | 加载开始回调 |
| `onLoadSuccess` | `() => void` | 加载成功回调 |
| `onLoadError` | `(error: Error) => void` | 加载失败回调 |
| `onStateChange` | `(info: PreviewStateInfo) => void` | **状态变更镜像**。插件上下文里的 `state` 就是 Core 经由它单向推下来的只读投影，插件想改状态必须走 `reportState` |
| `children` | `React.ReactNode` | 自渲染内容（单用 Core、不引插件时使用） |
| `containerStyle` | `React.CSSProperties` | 外层容器样式 |
| `containerClassName` | `string` | 外层容器 class |
| `contentStyle` | `React.CSSProperties` | 内容区样式 |
| `contentClassName` | `string` | 内容区 class |
| `containerRefExternal` | `Ref<HTMLDivElement>` | 把容器 DOM 同步给外部 ref（供插件量尺寸 / 挂监听） |
| `contentRefExternal` | `Ref<HTMLDivElement>` | 把内容区 DOM 同步给外部 ref |

> 换文件（`file.url` 变化）会自动重新走加载流程；状态变化本身**不会**触发副作用（这是有意的，防止无限重试，见源码注释）。

### `FileInfo`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 文件名（用于展示与下载文件名） |
| `size` | `number` | 字节数 |
| `type` | `string` | MIME type（路由的**权威类型**，冲突时压过扩展名） |
| `extension` | `string` | 扩展名（带不带点都接受，路由内部统一剥点比对） |
| `url` | `string` | 文件地址（同源或跨域均可，取决于插件） |
| `lastModified?` | `number` | 最后修改时间（可选，用于缓存键） |
| `previewMode?` | `"online" \| "offline"` | 在线 / 离线预览提示 |
| `docxMode?` | `"mammoth" \| "docx-preview"` | DOCX 走哪个实现；不设置交给 `MammothDocxPlugin`（语义 HTML，更轻） |

---

## `FilePreviewCoreRef`

`withPlugins` 产物的 ref 类型（`React.forwardRef` 透传）。

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `reload` | `() => void` | 状态归零后强制重新走加载流程 |
| `reset` | `() => void` | 只把状态归零，**不**自动重新加载 |
| `getState` | `() => PreviewStateInfo` | 读取当前加载状态 |
| `reportState` | `(patch: PreviewStatePatch) => void` | **插件上报加载结果的唯一写入路径**，转发给 Core 落库（Core 是唯一真源，插件不许自己 `setState`） |

---

## 插件上下文 `FilePreviewPluginContext`

插件钩子里拿到的 `context` 对象。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `props` | `FilePreviewCoreProps` | 宿主传给预览组件的 props（`transformData` / `transformProps` 之后那份） |
| `file` | `FileInfo` | 当前文件 |
| `state` | `PreviewStateInfo` | **只读镜像**的 Core 加载状态 |
| `reportState` | `(patch) => void` | 上报状态（唯一写入路径，转发给 Core） |
| `containerRef` | `Ref<HTMLDivElement>` | 外层容器 DOM（量尺寸 / 挂监听） |
| `contentRef` | `Ref<HTMLDivElement>` | 内容区 DOM |
| `sharedData` | `Map<string, unknown>` | 跨插件共享（不触发渲染） |
| `bus` | `PluginBus` | 插件总线（事件 / 共享数据，结构类型，与内核一致） |
| `deviceInfo` | `DeviceInfo` | 设备信息（类型 / OS / 视口 / 是否触屏 / 是否 Retina） |
| `forceUpdate` | `() => void` | 强制重渲染（事件里改了闭包状态后调用，见下方说明） |
| `getSize` | `() => PreviewDimensions` | 当前容器宽高 |
| `logger` | `PluginLogger` | 分级日志（debug / info / warn / error） |

> **`forceUpdate` 铁律**：钩子里改了闭包状态后必须调 `context.forceUpdate()`。插件正文（`render`）只在宿主渲染时求值，不调用会表现为「点了没反应、滚动才跳」。`coreRef.forceUpdate()` 无效（overlay 的 element 引用没变，React 会 bailout）。

---

## 11 个钩子

钩子面从迁移前的 17 个收敛到 **11 个**（其余 10 个是空转的，全库 0 实现），按「谁驱动」分两组。

### 领域钩子（文件预览独有，由 `withPlugins` 直接调用）

| 钩子 | 签名 | 职责 |
| --- | --- | --- |
| `canHandle` | `(file: FileInfo) => boolean` | **路由**：这个插件认不认这个文件。声明了即互斥，命中 = 最高置信度 |
| `render` | `(ctx) => React.ReactNode` | **正文**：赢家渲染什么 |
| `renderToolbar` | `(ctx) => React.ReactNode` | **工具栏**，由 `withPlugins` 桥接到内核 `renderHeader`，落在 Core 内容区顶部 |
| `onLoadStart` | `(ctx) => void` | 加载开始 |
| `onLoadSuccess` | `(ctx) => void` | 加载成功 |
| `onLoadError` | `(ctx, error: Error) => void` | 加载失败 |

### 内核钩子（重声明为领域 context，语义不变，由内核驱动）

| 钩子 | 签名 | 职责 |
| --- | --- | --- |
| `onMount` | `(ctx) => void \| (() => void)` | 生命周期；返回值作为清理函数执行 |
| `onUnmount` | `(ctx) => void` | 卸载 |
| `renderOverlay` | `(ctx) => React.ReactNode` | 叠加层，由内核插槽驱动 |
| `transformData` | `(ctx, data: FileInfo) => FileInfo` | 数据改写，由内核驱动 |
| `onError` | `(ctx, error: Error, errorInfo?) => void` | 错误，由内核沙箱与边界驱动 |

### 逃生口（不是钩子，是插件定义上的方法）

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `priorityOf` | `(file: FileInfo) => number` | 按文件算优先级，覆盖声明式 `priority`。**只有 `OfficePreviewPlugin` 需要**（`preferDocxOnline` 时把 .docx 提到 9，其它类型仍是 7） |

> 声明式 `priority` 表达不了「按文件算」，写死 9 又会抢走 Xlsx 的 `XlsxPreviewPlugin`。其余 15 个常量优先级的插件都用声明式 `priority`。

---

## `resolvePreview` 契约

单赢家路由：给定插件列表与一个文件，选出唯一该渲染它的插件。

```ts
resolvePreview(plugins: FilePreviewPlugin[], file: FileInfo): FilePreviewPlugin | null
```

**排序键（依次比较）**：

1. `priority` 降序 —— 插件的显式意图，最高优先
2. `matchStrength` 降序 —— priority 平手时，MIME 命中压过「只有扩展名像」
3. 声明顺序 —— 调用方把「更想要的」写在前面，不用猜隐式规则

一个都不认时返回 `null`，由装配层落到 `unsupported` 状态。

### `matchStrength` 三级置信度

| 值 | 含义 |
| --- | --- |
| `2` | 声明了 `canHandle` 且返回 true，或 `supportedTypes`（MIME）命中 |
| `1` | 只靠 `supportedExtensions`（扩展名）命中 |
| `0` | 不认 |

区分 1 和 2 是因为**同一个扩展名可属于多种媒体**：`.ogg` 既是 `audio/ogg`（Vorbis）也是 `video/ogg`（Theora）；`.ts` 既是 TypeScript 也是 MPEG-TS。浏览器给的 MIME 是权威类型，扩展名只是文件名的一部分，冲突时 MIME 该赢。

### 配套纯函数（均从 `vane-file-preview/core` 导出）

| 函数 | 说明 |
| --- | --- |
| `accepts(plugin, file)` | `matchStrength > 0` 的布尔形态 |
| `matchMimeType(fileType, pattern)` | MIME 匹配，支持 `image/*` 通配与 `*/*`（兜底） |
| `matchExtension(extension, pattern)` | 扩展名匹配，剥点后按**段边界**比对（防 `.rar` 命中 `.r`） |
| `priorityOf(plugin, file)` | 读取优先级：`hooks.priorityOf` → `plugin.priority` → `0` |
| `unsupportedMessage(file)` | `unsupported` 状态的提示文案 |

> 这些函数无 React 依赖，可脱离 DOM 单测。路由的正确性由 `test/routing-all.test.ts` 保障（30 种真实文件 × 17 插件，正序 + 反转赢家必须一致）。

---

## `withPlugins` 装配

```ts
withPlugins(
  FilePreviewCore,
  {
    plugins: FilePreviewPlugin[],
    enableDebug?: boolean, // 开发期打印路由 / 钩子调用轨迹
  }
)
// 数组写法等价：withPlugins(FilePreviewCore, [插件…])
```

返回一个 `React.ForwardRefExoticComponent`，可像普通组件一样渲染并接收 `ref`（`FilePreviewCoreRef`）。

**约束**：

- 装配必须写在**模块顶层**（不是组件函数体内），否则每次渲染生成新组件类型，整棵子树被卸载重建。
- 插件数组是**全量**的：`withPlugins` 不会自动注入任何内置插件。根入口的 6 个轻量插件也要显式写进数组，或从一个汇总入口（`vane-file-preview/plugins` 或 `vane-file-preview/custom-plugins`）引入后列出。
- `render` / `renderToolbar` 里**不许有 hooks**。它们是普通函数，装配层直接 `winner.hooks.render(ctx)` 调用；在里面 `useState` 会把 hook 注册到 `withPlugins` 上，赢家一换就抛 “Rendered fewer hooks than expected”。需要状态的正文 / 工具栏各自包成组件。
