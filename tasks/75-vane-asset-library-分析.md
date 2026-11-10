# 75 · vane-asset-library 分析

> 分期：P1 分析 / P2 脚手架 / P3 内核与类型 / P4 插件家族(20) / P5 DEMO 外壳 / P6 三页套 / P7 逐项示例 / P8 自测·对比度·几何 / P9 文档 / P10 门禁 / P11 聚合 / P12 发布
> 同族参考：vane-sku（内核薄壳 + 矩阵式派生状态 + 领域上下文扩展）、vane-candidate（多槽位家族 + per-card 槽）、vane-resume（P2 五样齐全的 demo 范式基准）
> 仓库实际路径：`E:/vane-components`（skill 里写的 `E:/react-plugin-component` 是旧路径，已废弃）；远端只有 origin=github（无双远端，P12 只推一个）

## 0. 组件定位

`vane-asset-library` = **素材网格墙**。内核 `AssetLibraryCore` 只做三件事：渲染网格骨架（卡片 = 媒体区 + 标题 + 三个 per-card 槽）、转发生命周期、暴露选择/可见集的 ref。素材的浏览、筛选、排序、分页、选择、拖拽上传、大图预览全部由插件承接。

**已拍板的四条边界**（用户确认）：

| 维度 | 决定 | 不做 |
|---|---|---|
| 形态 | 纯网格墙 + 工具栏 + 页脚，可嵌任意容器 | 不做侧栏文件树、不做常驻详情抽屉、不自带 Modal 外壳（大图预览走 overlay 插件） |
| 素材类型 | `image` / `video` 两类 | 不做音频/文档/字体/压缩包分流渲染 |
| 上传 | 只渲染 dropzone、收集 `File[]` 抛 `onUpload` | 不内置 XHR/fetch、不管进度/重试/断点/并发 |
| 数据 | 受控 `items` 传入 + 纯计算 + 事件回调 | 不内置 loader / 分页请求 / 无限滚动的网络语义 |

一句话判据：**这个包是「素材的表达与选择」引擎，不是「素材的存储与传输」客户端。**

## 1. 入口划分（ADR-6/14：根入口不桶导出插件）

- `src/index.ts`：`AssetLibraryCore` + `withAssetLibraryPlugins`（+ `withPlugins` 别名）+ 领域类型 + 纯函数工具（`filterAssets` / `sortAssets` / `paginateAssets` / `isSelectable`）。**不导出任何插件**。
- `src/entries/core.ts`：仅核心（Core + 装配器 + 类型），体积最小面。
- `src/entries/plugins.ts`：`withAssetLibraryPlugins` + `export * from "../custom-plugins"` + 内核类型。
- `src/components/AssetLibraryPlugin/`：`AssetLibraryCore.tsx`、`withPlugins.tsx`、`domain.ts`（纯函数：过滤/排序/分页/可选性/归一化）、`plugins/{types.ts, slots.tsx}`。
- `src/custom-plugins/<Name>Plugin/{create.tsx, doc.json, index.ts}` ×20。
- `src/styles/{tokens.css, components.css}`（`vc-` 前缀 + `--vane-asset-*` 变量）→ 产出 `dist/style.css` 与 `exports["./style.css"]`。

## 2. 数据模型与领域语义

```ts
export type AssetKind = "image" | "video";
export type AssetStatus = "ready" | "processing" | "failed";

export interface AssetItem {
  id: string;                    // 稳定唯一键，缺失/重复在归一化阶段丢弃并 warn
  kind: AssetKind;
  src: string;                   // 原图/视频地址
  thumbnail?: string;            // 缩略图（缺省回落到 src；视频必须给，否则只有黑底）
  title?: string;                // 缺省用文件名/ID
  width?: number; height?: number;
  duration?: number;             // 秒，仅 video
  size?: number;                 // 字节
  mimeType?: string;
  tags?: string[];
  folderId?: string | null;
  folderName?: string;
  createdAt?: string | number | Date;
  status?: AssetStatus;          // default "ready"
  favorite?: boolean;
  owner?: string;
  meta?: Record<string, unknown>; // 宿主自定义，插件透传
}

export interface AssetFolder { id: string; name: string; count?: number }
```

### 2.1 派生状态（withPlugins 内的唯一真相）

```ts
interface AssetLibraryState {
  query: string;                    // 关键词
  kinds: AssetKind[];               // 空数组 = 不限
  tags: string[];                   // OR 语义（命中任一）
  folderId: string | null;          // null = 全部
  sortKey: "name" | "createdAt" | "size" | "duration";
  sortDir: "asc" | "desc";
  view: "grid" | "list";
  page: number;                     // 1-based
  pageSize: number;
  selectedIds: string[];            // 有序：勾选顺序（SelectMark 显示序号依赖它）
  activeId: string | null;          // 键盘焦点（roving tabindex）
}
```

管道固定为 **归一化 → 过滤 → 排序 → 分页 → 可见集**，每段都是 `domain.ts` 里的纯函数，可单独单测：

`normalizeAssets(items)` → `filterAssets(list, {query, kinds, tags, folderId})` → `sortAssets(list, {sortKey, sortDir})` → `paginateAssets(list, {page, pageSize})`。

### 2.2 领域语义（本包的「缺货/禁用」等价物，必须一次说清）

1. **只有 `status === "ready"` 可选**。`processing` / `failed` 的卡片仍渲染、仍可见（否则用户不知道文件没处理完），但不可勾选。
2. **已选项永远可取消**。达到 `maxSelected` 后，未选中的 ready 项进入 blocked 态；已选中的项不受限制。这是 vane-sku「禁用只约束未选中候选」的同构规则——否则用户被锁死。
3. **筛选后「全选」只作用于当前过滤结果**（不含分页外的项），且排除不可选。语义写进 `ctx.selectAllVisible()` 的实现，不做「全库全选」这种歧义入口。
4. **`page` 越界自动夹到最后一页**，空结果夹到 1。宿主传脏值不该看到白屏。
5. **空态分两种原因**：`emptyReason: "empty" | "filtered"`（库本身无素材 vs 筛选无结果）。空态文案与「清空筛选」动作据此分叉，这是最常见的体验翻车点。
6. **排序稳定性**：`undefined` 字段一律排末尾；同值保持入参顺序（`Array.prototype.sort` 在 V8 已稳定，但显式带 index 兜底更保险）。
7. **时间字段归一**：`createdAt` 接受 string/number/Date，统一成毫秒时间戳再比较，脏值当 `undefined`。
8. **受控选择**：传了 `selectedIds` 就以 props 为准（点击只回传 `onSelectionChange`）；不传则内部 state。归一化时剔除不存在于 items 的 id 并保留顺序。

### 2.3 上下文扩展（`AssetLibraryContext extends PluginContext`）

```ts
interface AssetLibraryContext extends PluginContext<AssetLibraryCoreProps, unknown> {
  items: AssetItem[];              // 归一化后的全量（插件读这份，别读 props.items）
  folders: AssetFolder[];
  filtered: AssetItem[];           // 过滤+排序后（不含分页）
  visible: AssetItem[];            // 当前页
  total: number;                   // filtered.length
  emptyReason: "empty" | "filtered" | null;
  // 筛选
  query: string; kinds: AssetKind[]; tags: string[]; folderId: string | null;
  setQuery(q: string): void;
  toggleKind(k: AssetKind): void;
  toggleTag(t: string): void;
  setFolder(id: string | null): void;
  clearFilters(): void;
  // 排序 / 视图 / 分页
  sortKey; sortDir; setSort(key, dir?): void; toggleSortDir(): void;
  view; setView(v): void;
  page; pageSize; pageCount; setPage(n): void; setPageSize(n): void;
  // 选择
  selectedIds: string[];           // 有序
  selectedItems: AssetItem[];      // 按 selectedIds 顺序解析
  isSelected(id: string): boolean;
  toggleSelect(id: string): void;
  selectAllVisible(): void;
  clearSelection(): void;
  maxSelected: number;             // 0 = 不限
  isSelectable(item): boolean;     // status==="ready"
  isBlocked(item): boolean;        // ready 但已达上限且未选中
  activeId; setActiveId(id): void;
}
```

**写状态一律走 `context.setState` + `context.forceUpdate()`**（overlay / footer 只在宿主渲染时求值，`coreRef.forceUpdate()` 对它们无效）。所有 setter 都做「值未变则 no-op」，避免拖控件时空转。

### 2.4 Core props / ref

```ts
interface AssetLibraryCoreProps {
  items: AssetItem[];
  folders?: AssetFolder[];
  // 受控选择（可选）
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  maxSelected?: number;
  multiple?: boolean;             // default true；false 时点击即单选替换
  onSelectionChange?(ids: string[], items: AssetItem[]): void;
  onItemActivate?(item: AssetItem): void;   // 双击 / Enter
  onUpload?(files: File[]): void;
  columnWidth?: number;           // 网格基准列宽，default 176
  gap?: number;
  view?: "grid" | "list";
  page?: number; pageSize?: number;
  // 装配注入（Core 只读）
  slots?: AssetSlots;
  activeId?: string | null;
  onActivateCard?(id: string): void;
  onToggleCard?(id: string): void;
  containerClassName?: string; containerStyle?: React.CSSProperties;
  onMount?(): void; onUnmount?(): void; debug?: boolean;
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;
}
interface AssetLibraryCoreRef {
  getContainer(): HTMLDivElement | null;
  forceUpdate(): void;
  getSize(): { width: number; height: number };
  getSelection(): string[];
  getVisibleIds(): string[];
}
```

Core 只渲染：dropzone 槽 → toolbar 槽 → 网格（卡片：媒体区 + per-card overlay 槽 + actions 槽 + 标题 + meta 槽）→ empty 槽（无可见项时）→ footer 槽 → overlay 槽。**≤150 行**（含注释后的硬上限，样式全部来自 `components.css` class）。

## 3. 领域槽与插件清单（20 个，按槽位分 priority 区间）

| 槽 | 语义 | 插件（priority） |
|---|---|---|
| `renderDropzone` | 顶部拖拽区（装饰累积） | Dropzone(5) |
| `renderToolbar` | 工具栏（装饰累积） | Search(10) KindFilter(11) TagFilter(12) FolderFilter(13) Sort(14) ViewSwitch(15) Count(16) SelectAll(17) |
| `renderCardOverlay` | 单个卡片媒体区覆盖层，签名 `(ctx, item, index)` | SelectMark(20) KindBadge(21) Duration(22) Status(23) Favorite(24) |
| `renderCardActions` | 单卡片右上操作钮 | CardActions(25) |
| `renderCardMeta` | 标题下方附加信息行 | MetaLine(26) |
| `renderFooter` | 页脚（装饰累积） | BulkBar(30) Pagination(31) |
| `renderEmpty` | 空态（单值，最高 priority 胜出） | EmptyState(40) |
| `renderOverlay` | 浮层（装饰累积） | LightBox(45) |
| `transformData`（内核钩子） | 数据管道扩展点 | 预留（宿主自定义） |

20 个插件（`name` 全局唯一 kebab）：
`dropzone` `search` `kind-filter` `tag-filter` `folder-filter` `sort` `view-switch` `count` `select-all` `select-mark` `kind-badge` `duration` `status-badge` `favorite` `card-actions` `meta-line` `bulk-bar` `pagination` `empty-state` `lightbox`

**per-card 槽的调用成本**：20 个插件里 7 个是 per-card，240 项 × 7 次组件调用 = 1680 次/渲染。约束：每张卡片的槽渲染必须 `useCallback` 且不依赖会每次变的对象；`withPlugins` 的 `renderPluginSlot` 结果按 `(slot, items 引用, state 关键字段)` 记忆化，禁止每次渲染重建全部卡片节点数组。

## 4. Core 依赖派系

**peer 外部化派**（同 vane-resume / vane-profile / vane-candidate）：

- `vane-plugin-core` 放 `peerDependencies: "^0.1.2"`，构建期外部化，不进 dist。
- `react` / `react-dom` 仅 peer。
- **零运行时第三方依赖**。时长格式化、体积格式化、日期格式化、拖拽事件全部手写（每个 20–30 行），不引 `date-fns` / `filesize` / `react-dropzone`。这是本包体积能守住的唯一前提。

## 5. 体积预算（首次 build 后据实校准，超标只能真减或写 `sizeBudgetNote`）

| 字段 | 预算 | 依据 |
|---|---|---|
| `sizeBudgetKb`（根入口） | 10 | Core + withPlugins + domain + slots，peer 外部化 |
| `coreSizeBudgetKb` | 8 | `dist/entries/core.js` 闭包 |
| `subpathBudgets` | 每个 2.5；LightBox / CardActions / TagFilter 3.5 | 薄壳为主，doc.json 元数据占大头 |
| `fullSizeBudgetKb` | 70 | dist 全量并集 |

初值是估计，P10 按实测重写并附 note；**禁止静默调大**。

## 6. demo 场景

- 逐项示例 20 页：`demo/src/demos/NN-<slug>.tsx`（slug = 插件目录名去 `Plugin` 转 kebab），前缀定导航顺序。
- 三页套：总览（HomePage，数字全部从 `DEMOS`/`PLUGINS`/`SCENARIOS` 实时算）+ 插件工坊（PluginsPage，数据源 `data/plugins.ts`）+ 场景示例（ScenariosPage，≥3 个真装配场景）。
- 场景（6 个）：
  1. **媒体库工作台** — 搜索 + 类型 + 标签 + 排序 + 多选 + 批量删除 + 分页（全插件组装）
  2. **素材选择器** — `maxSelected=1` + 单选语义 + 已选摘要
  3. **上传工作流** — dropzone + `processing` 占位 + `failed` 不可选 + 重试回调
  4. **视频墙** — 时长角标 + 静帧 + hover 操作
  5. **大库分页** — 240 项 / 24 页，验证分页与计数一致性
  6. **空库 vs 筛选无结果** — 两种 `emptyReason` 的文案分叉
- 样例数据：`demo/src/data/samples.ts` 导出 `SAMPLE_ASSETS`（48 项，含 12 个视频、processing/failed 各 2 个、4 个分组、20+ 标签）+ `bulkAssets(n)` 生成器（大库场景用）。图片一律用内联 SVG data-URI 占位（离线可跑、不依赖外网、截图稳定），**不要用 picsum/placeholder.com**（断网/限速会让 demo 与体检脚本一起挂）。

## 7. 无障碍与对比度（ADR-13）

- 网格容器 `role="listbox"` + `aria-multiselectable`（`multiple` 时），卡片 `role="option"` + `aria-selected`；`roving tabindex`：只有 activeId 那张卡 `tabIndex=0`。
- 卡片 `aria-label` = `title`（视频补时长）；不可选卡片 `aria-disabled`。
- 键盘：`←/→` ±1、`↑/↓` ±列数（列数由实测容器宽度算）、`Home/End` 首尾、`Space` 勾选、`Enter` 激活（`onItemActivate`）。**方向键逻辑放 core**（它是网格几何的一部分），不做成插件——插件拿不到列数就不该假装能导航。
- 焦点环用 `:focus-visible` + 2px outline，不用 `outline:none`。
- 配色：容器自带 `color` + `background`（深色壳里不能白底白字）；token 全部落 `:root`；**禁用态用实色灰（≥3:1），不叠 `opacity`**——体检脚本会把祖先 opacity 逐层乘进来，`opacity:.6` 直接掉到 2.85:1。
- 品牌色 `#ff7a29`（橙，同全家桶），demo `App.css` 只改四行 token + 品牌文案。

## 8. 已知风险与对策

| 风险 | 对策 |
|---|---|
| per-card 槽 × 240 项 → 渲染抖动 | 槽结果记忆化 + 卡片组件 `memo` + 只给变化项新 props；P8 用 240 项场景实测 |
| 视频卡片在 happy-dom 无 `duration` 元数据 | 时长只读 `item.duration`，**不在组件里 load metadata**（那是宿主的活）；缺失就不显示角标 |
| 图片 `onError` → 布局塌陷 | 媒体区固定 `aspect-ratio`，失败显示占位块（`data-broken`），尺寸不依赖图片加载 |
| 拖拽事件在 window 上泄漏 | dropzone 只在自身节点监听 + `dragover` 必 `preventDefault`；`onUnmount` 清理 |
| 受控/非受控选择并存 → 状态打架 | 单一写入口 `commitSelection`，受控时写 state 只用于渲染回显，真相仍是 props |
| doc.json 的 `example` 缺失 | 每个插件都写 `example`（单字符串）+ `examples`（可选项）；A4 只对「有 examples 无 example」报 INFO |
