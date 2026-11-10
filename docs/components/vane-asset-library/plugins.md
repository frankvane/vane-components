# 素材库 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [BulkBar](#bulkbar) | 批量操作条：已选数量 + 批量下载 / 删除 / 清空，动作名统一带 bulk: 前缀。 | `actions` = 批量下载/批量删除<br/>`label` = 已选 {n} 项 | 0.1.0 | batch, footer |
| [CardActions](#cardactions) | 卡片操作：预览 / 下载 / 删除，预览走内置浮层，其余动作交回宿主（onAssetAction）。 | `actions` = 预览/下载/删除 | 0.1.0 | action, overlay |
| [Count](#count) | 结果计数：过滤后总数、当前页 / 总页数与已选数量，分页时明确标注「本页 n 条」。 | `showTotal` = true<br/>`showVisible` = true<br/>`showSelected` = true<br/>`separator` = · | 0.1.0 | count, status |
| [Dropzone](#dropzone) | 拖拽上传占位：接收拖入或点击选择的文件，按 accept 过滤后交回宿主，组件不发起任何请求。 | `accept` = ["image/*","video/*"]<br/>`label` = 拖拽素材到此处<br/>`multiple` = true | 0.1.0 | upload, dropzone, dnd |
| [Duration](#duration) | 视频时长角标：只读 item.duration，不在组件里加载媒体元数据。 | `fallback` = false | 0.1.0 | overlay, video, duration |
| [EmptyState](#emptystate) | 空态：区分「库为空」与「筛选无结果」，后者给一键清空筛选，避免用户误以为素材被删。 | `emptyText` = 素材库还是空的<br/>`emptyHint` = 拖拽图片或视频到上方区域即可开始<br/>`filteredText` = 没有符合当前条件的素材<br/>`clearLabel` = 清空筛选条件 | 0.1.0 | empty, a11y |
| [Favorite](#favorite) | 收藏星标：点击抛 onAssetAction("favorite")，亮灭取决于宿主回写的 item.favorite。 | `action` = favorite<br/>`activeColor` = #f5a524 | 0.1.0 | overlay, favorite, action |
| [FolderFilter](#folderfilter) | 分组筛选：按宿主传入的 folders 平铺切换（不做文件树），chip 上显示该组真实数量。 | `allLabel` = 全部分组<br/>`hideEmpty` = false | 0.1.0 | filter, folder, group |
| [KindBadge](#kindbadge) | 类型角标：默认只给视频显示 VID，用来区分「静帧缩略图」与「真图片」。 | `labels` = PIC/VID<br/>`showFor` = ["video"] | 0.1.0 | overlay, kind |
| [KindFilter](#kindfilter) | 按素材类型筛选（图片 / 视频），chip 上带各类型总数；「全部」只清类型，不动关键词与标签。 | `kinds` = 图片/视频<br/>`allLabel` = 全部 | 0.1.0 | filter, kind |
| [LightBox](#lightbox) | 大图 / 视频预览浮层：Esc 或点遮罩关闭，左右方向键在当前筛选结果里切换。 | `arrows` = true<br/>`restoreFocus` = true | 0.1.0 | preview, overlay, keyboard |
| [MetaLine](#metaline) | 卡片元信息行：体积 / 分辨率 / 分组 / 标签 / 日期，缺字段就少一段，绝不编造。 | `show` = ["size","dimension"]<br/>`maxTags` = 2 | 0.1.0 | overlay, meta |
| [Pagination](#pagination) | 分页器：页码窗口 5 个 + 每页条数；pageCount 由纯函数算，越界自动夹紧。 | `pageSizes` = [12,24,48]<br/>`window` = 5 | 0.1.0 | pagination, footer |
| [Search](#search) | 关键词搜索：按标题 / 文件名 / 标签 / 分组 / MIME 过滤，200ms 防抖并使用 ⌘K 聚焦。 | `placeholder` = 搜索名称 / 标签 / 分组<br/>`debounce` = 200<br/>`hotkey` = true<br/>`width` = 200 | 0.1.0 | search, filter, debounce |
| [SelectAll](#selectall) | 全选本页 / 取消选择：只作用于当前页可见且就绪的素材，达上限时按钮如实禁用。 | `selectLabel` = 全选本页<br/>`clearLabel` = 取消选择 | 0.1.0 | select, batch |
| [SelectMark](#selectmark) | 卡片选择标记：左上角勾选圈，多选时显示选择序号；点标记不会触发卡片其它行为。 | `showIndex` = true | 0.1.0 | select, overlay |
| [Sort](#sort) | 排序：名称 / 时间 / 体积 / 时长，点同一字段反转方向，缺值恒沉底。 | `options` = 时间/名称/体积/时长 | 0.1.0 | sort |
| [StatusBadge](#statusbadge) | 素材状态遮罩：processing / failed 时在卡片中央标注，说明为什么这张卡点不动。 | `labels` = 转码中/处理失败 | 0.1.0 | overlay, status, a11y |
| [TagFilter](#tagfilter) | 标签面筛选：从素材汇总标签并按出现次数排序，支持多选（OR），已选标签永不被截断。 | `max` = 8<br/>`sort` = "count" | 0.1.0 | filter, tag, facet |
| [ViewSwitch](#viewswitch) | 网格 / 列表视图切换；布局由 CSS 的 data-view 选择器负责，插件不复制渲染逻辑。 | `views` = ["grid","list"]<br/>`labels` = 网格/列表 | 0.1.0 | view, layout |

## 插件能力明细

### BulkBar

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `actions` | `BulkAction[]` | `批量下载/批量删除` | 批量动作项 |
| `label` | `string` | `已选 {n} 项` | 已选文案，{n} 会替换成数量 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染 | 批量操作条：已选数量 + 批量下载 / 删除 / 清空，动作…… |

**方法 Methods**

—（本插件不调用上下文方法）

### CardActions

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `actions` | `CardAction[]` | `预览/下载/删除` | 操作项，preview 为内置动作 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardActions` | 每次渲染，逐张卡片调用 | 卡片操作：预览 / 下载 / 删除，预览走内置浮层，其余动作…… |

**方法 Methods**

—（本插件不调用上下文方法）

### Count

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showTotal` | `boolean` | `true` | 显示过滤后总数 |
| `showVisible` | `boolean` | `true` | 多页时显示当前页信息 |
| `showSelected` | `boolean` | `true` | 显示已选数量 |
| `separator` | `string` | `·` | 分隔符 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染 | 结果计数：过滤后总数、当前页 / 总页数与已选数量，分页时明…… |

**方法 Methods**

—（本插件不调用上下文方法）

### Dropzone

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `accept` | `string[]` | `["image/*","video/*"]` | 允许的文件类型，支持 image/* 前缀与 .png 扩展名 |
| `label` | `string` | `拖拽素材到此处` | 主文案 |
| `multiple` | `boolean` | `true` | 是否允许一次多选 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderDropzone` | 每次渲染 | 拖拽上传占位：接收拖入或点击选择的文件，按 accept 过…… |

**方法 Methods**

—（本插件不调用上下文方法）

### Duration

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fallback` | `boolean` | `false` | 无时长时是否显示 --:-- |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardOverlay` | 每次渲染，逐张卡片调用 | 视频时长角标：只读 item.duration，不在组件里加…… |

**方法 Methods**

—（本插件不调用上下文方法）

### EmptyState

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `emptyText` | `string` | `素材库还是空的` | 无素材文案 |
| `emptyHint` | `string` | `拖拽图片或视频到上方区域即可开始` | 无素材补充说明 |
| `filteredText` | `string` | `没有符合当前条件的素材` | 筛选无结果文案 |
| `clearLabel` | `string` | `清空筛选条件` | 清空按钮文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderEmpty` | 每次渲染 | 空态：区分「库为空」与「筛选无结果」，后者给一键清空筛选，避…… |

**方法 Methods**

—（本插件不调用上下文方法）

### Favorite

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `action` | `string` | `favorite` | 回调动作名 |
| `activeColor` | `string` | `#f5a524` | 已收藏颜色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardOverlay` | 每次渲染，逐张卡片调用 | 收藏星标：点击抛 onAssetAction("favori…… |

**方法 Methods**

—（本插件不调用上下文方法）

### FolderFilter

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `allLabel` | `string` | `全部分组` | 「全部」chip 文案 |
| `hideEmpty` | `boolean` | `false` | 是否隐藏 0 项的分组 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染 | 分组筛选：按宿主传入的 folders 平铺切换（不做文件树…… |

**方法 Methods**

—（本插件不调用上下文方法）

### KindBadge

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `labels` | `Partial<Record<AssetKind,string>>` | `PIC/VID` | 角标文案 |
| `showFor` | `AssetKind[]` | `["video"]` | 在哪些类型上显示 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardOverlay` | 每次渲染，逐张卡片调用 | 类型角标：默认只给视频显示 VID，用来区分「静帧缩略图」与…… |

**方法 Methods**

—（本插件不调用上下文方法）

### KindFilter

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `kinds` | `Array<{kind,label}>` | `图片/视频` | 参与筛选的类型与文案 |
| `allLabel` | `string` | `全部` | 「全部」chip 文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染 | 按素材类型筛选（图片 / 视频），chip 上带各类型总数；…… |

**方法 Methods**

—（本插件不调用上下文方法）

### LightBox

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `arrows` | `boolean` | `true` | 支持 ← → 在筛选结果里切换 |
| `restoreFocus` | `boolean` | `true` | 关闭后恢复焦点（由宿主焦点管理兜底） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onAssetActivate` | 双击卡片 / 按 Enter | 打开当前素材的预览浮层（宿主若自己接了 onItemActivate 不冲突，两者都执行） |
| `renderOverlay` | previewId 非空时 | 渲染 dialog 浮层：Esc 或点遮罩关闭，← → 在筛选结果里切换 |

**方法 Methods**

—（本插件不调用上下文方法）

### MetaLine

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `show` | `MetaField[]` | `["size","dimension"]` | 展示哪些字段 |
| `maxTags` | `number` | `2` | 标签最多显示几个 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardMeta` | 每次渲染，逐张卡片调用 | 卡片元信息行：体积 / 分辨率 / 分组 / 标签 / 日期…… |

**方法 Methods**

—（本插件不调用上下文方法）

### Pagination

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pageSizes` | `number[]` | `[12,24,48]` | 可选每页条数，[] 隐藏下拉 |
| `window` | `number` | `5` | 页码窗口大小 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染 | 分页器：页码窗口 5 个 + 每页条数；pageCount …… |

**方法 Methods**

—（本插件不调用上下文方法）

### Search

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `placeholder` | `string` | `搜索名称 / 标签 / 分组` | 占位文案 |
| `debounce` | `number` | `200` | 写回筛选条件的防抖毫秒 |
| `hotkey` | `boolean` | `true` | ⌘K / Ctrl+K 聚焦输入框 |
| `width` | `number` | `200` | 输入框宽度（px） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染 | 关键词搜索：按标题 / 文件名 / 标签 / 分组 / MI…… |

**方法 Methods**

—（本插件不调用上下文方法）

### SelectAll

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `selectLabel` | `string` | `全选本页` | 全选按钮文案 |
| `clearLabel` | `string` | `取消选择` | 清空按钮文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染 | 全选本页 / 取消选择：只作用于当前页可见且就绪的素材，达上…… |

**方法 Methods**

—（本插件不调用上下文方法）

### SelectMark

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showIndex` | `boolean` | `true` | 多选时显示第几个被选中 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardOverlay` | 每次渲染，逐张卡片调用 | 卡片选择标记：左上角勾选圈，多选时显示选择序号；点标记不会触…… |

**方法 Methods**

—（本插件不调用上下文方法）

### Sort

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `options` | `SortOption[]` | `时间/名称/体积/时长` | 可选排序项 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染 | 排序：名称 / 时间 / 体积 / 时长，点同一字段反转方向…… |

**方法 Methods**

—（本插件不调用上下文方法）

### StatusBadge

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `labels` | `Partial<Record<AssetStatus,string>>` | `转码中/处理失败` | 状态文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardOverlay` | 每次渲染，逐张卡片调用 | 素材状态遮罩：processing / failed 时在卡…… |

**方法 Methods**

—（本插件不调用上下文方法）

### TagFilter

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `max` | `number` | `8` | 最多展示几个标签，0 = 不限 |
| `sort` | `"count" \| "name"` | `count` | 标签排序方式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染 | 标签面筛选：从素材汇总标签并按出现次数排序，支持多选（OR）…… |

**方法 Methods**

—（本插件不调用上下文方法）

### ViewSwitch

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `views` | `AssetView[]` | `["grid","list"]` | 可切换的视图 |
| `labels` | `Partial<Record<AssetView,string>>` | `网格/列表` | 视图文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染 | 网格 / 列表视图切换；布局由 CSS 的 data-vie…… |

**方法 Methods**

—（本插件不调用上下文方法）

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
