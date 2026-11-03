# 底部弹层 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [AnnouncerPlugin](#announcerplugin) | 读屏播报：aria-live 区域在档位变化时播报当前进度。 | `labels` = - | 0.1.0 | a11y, screen-reader, feedback |
| [BackdropPlugin](#backdropplugin) | 遮罩：透明度随打开进度联动，点击关闭（可配置）。 | `color` = "rgba(0, 0, 0, 0.45)"<br/>`dismissOnClick` = true | 0.1.0 | backdrop, visual |
| [DragHandlePlugin](#draghandleplugin) | 拖拽指示条：视觉提示 + 默认拖拽面，按住沿抽伸轴拖动切换吸附档或关闭。把手始终贴面板朝内容一侧的内边缘：底部在顶部、顶部在底部，左侧在右缘、右侧在左缘。 | `color` = "--vane-modal-sheet-handle token (#6b7280)"<br/>`width` = 36 | 0.1.0 | drag, handle, visual |
| [EmptyStatePlugin](#emptystateplugin) | 空态占位：empty 时内容区覆盖占位提示与引导动作。 | `empty` = false<br/>`text` = "暂无内容"<br/>`actionText` = -<br/>`onAction` = - | 0.1.0 | empty, feedback |
| [EscClosePlugin](#esccloseplugin) | Esc 关闭：键盘 Escape 触发关闭；多层嵌套时只关最顶层（栈序）。 | `topOnly` = true | 0.1.0 | keyboard, close, a11y |
| [FocusTrapPlugin](#focustrapplugin) | 焦点圈定：打开时焦点进入面板并 Tab 循环，关闭时归还焦点（配合内核自带的 role=dialog / aria-modal）。 | `restoreFocus` = true | 0.1.0 | a11y, focus, behavior |
| [FooterPlugin](#footerplugin) | 吸底操作区：主/次按钮（44px 触达），适配底部安全区。 | `primaryText` = -<br/>`onPrimary` = -<br/>`secondaryText` = -<br/>`onSecondary` = -<br/>`primaryLoading` = false | 0.1.0 | footer, actions, visual |
| [HapticsPlugin](#hapticsplugin) | 触感反馈：吸附 / 关闭时 navigator.vibrate 短震，不支持的设备静默跳过。 | `snapMs` = 8<br/>`closeMs` = 12 | 0.1.0 | haptics, mobile, feedback |
| [HeaderPlugin](#headerplugin) | 标题栏：标题 + 关闭按钮，整行兼拖拽面。 | `title` = ""<br/>`closable` = true<br/>`titleId` = "" | 0.1.0 | header, visual |
| [HistoryPlugin](#historyplugin) | Android 返回手势 / 浏览器后退关闭：打开时 pushState，popstate 触发关闭。 | `state` = { vaneModalSheet: "close" } | 0.1.0 | history, android, mobile |
| [KeepMountedPlugin](#keepmountedplugin) | 关闭保活：关闭时记住内容区滚动位置，重新打开时恢复阅读进度。 | - | 0.1.0 | state, ux |
| [KeyboardAvoidPlugin](#keyboardavoidplugin) | 虚拟键盘避让：visualViewport 监听，经 setViewportInset 通知内核重算吸附几何。 | `snapToTop` = true | 0.1.0 | keyboard, mobile, behavior |
| [LoadingStatePlugin](#loadingstateplugin) | 加载骨架：loading 时内容区覆盖骨架屏并锁定拖拽。 | `loading` = false<br/>`rows` = 3<br/>`shimmerColor` = "#eef1f4" | 0.1.0 | loading, skeleton, feedback |
| [ModalEffectPlugin](#modaleffectplugin) | iOS modal effect：背景页随打开进度轻微放大（Apple Maps 弹层感），走 CSS 变量零渲染成本。 | `amount` = 0.06<br/>`hostSelector` = "#root" | 0.1.0 | ios, effect, visual |
| [NestedScrollPlugin](#nestedscrollplugin) | 内容滚动联动拖拽：内容没滚回顶部时锁定拖拽（disableDrag 场景）。 | - | 0.1.0 | scroll, gesture |
| [ResponsivePlugin](#responsiveplugin) | 断点策略：窄屏 bottom sheet，宽屏居中悬浮弹窗（限宽 + 四角圆角 + 悬浮间距）；横向抽屉（left/right）由 placement 决定几何，本插件自动跳过。 | `breakpoint` = 768<br/>`desktopWidth` = 560<br/>`inset` = 24 | 0.1.0 | responsive, layout |
| [SafeAreaPlugin](#safeareaplugin) | 刘海屏 / 手势条适配：面板注入 env(safe-area-inset-*) 底部内边距。 | `extraBottom` = 0 | 0.1.0 | mobile, safe-area, layout |
| [ScrollLockPlugin](#scrolllockplugin) | body 滚动锁定：isOpen 时锁定背景滚动，关闭时恢复，防 iOS 滚动穿透。 | `lockTouch` = false | 0.1.0 | scroll, body, behavior |
| [SearchBarPlugin](#searchbarplugin) | 搜索框：非受控输入，onSearch 回调 + bus 广播（modal-sheet:search），供列表过滤联动。 | `placeholder` = "搜索"<br/>`defaultValue` = ""<br/>`onSearch` = - | 0.1.0 | search, form, header |
| [SnapDotsPlugin](#snapdotsplugin) | 吸附档位指示点：当前档高亮，点击直接吸附到对应档。 | `activeColor` = "--vane-modal-sheet-dot-active token (#1f2329)"<br/>`inactiveColor` = "--vane-modal-sheet-dot token (#7c8288)" | 0.1.0 | snap, indicator, visual |
| [StepFlowPlugin](#stepflowplugin) | 分步流程：头部步骤进度指示 + 底部上一步/下一步，适合分步表单与引导。 | `steps` = []<br/>`initialStep` = 0<br/>`onFinish` = - | 0.1.0 | steps, flow, form |

## 插件能力明细

### AnnouncerPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `labels` | `string[]` | `-` | 各档播报文案，缺省播报已展开百分比 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onSnap` | 吸附到某一档位后（含打开补间结束） | 拿到目标档位 index，做联动（切换内容、上报展开高度） |
| `renderOverlay` | 每次渲染，覆盖在面板内容之上 | 面板内浮层（提示、下拉、加载遮罩） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### BackdropPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `color` | `string` | `rgba(0, 0, 0, 0.45)` | 遮罩颜色（含透明度） |
| `dismissOnClick` | `boolean` | `true` | 点击遮罩是否关闭 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBackdrop` | 每次渲染，遮罩层专用槽位 | 自定义遮罩样式或再加一层内容（模糊、点击关闭提示） |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `close` | `ctx.close(): void` | 关闭面板：走关闭补间，动画结束后触发 onClose |

### DragHandlePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `color` | `string` | `--vane-modal-sheet-handle token (#6b7280)` | 指示条颜色 |
| `width` | `number` | `36` | 指示条宽度 px |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHandle` | 每次渲染，拖拽把手槽位 | 把手的视觉与拖拽提示 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getDragProps` | `ctx.getDragProps(): ModalSheetDragProps` | 取拖拽把手所需的 props（事件处理器与样式），透传给把手元素 |

### EmptyStatePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `empty` | `boolean` | `false` | 内容是否为空 |
| `text` | `string` | `暂无内容` | 占位文案 |
| `actionText` | `string` | `-` | 引导按钮文案 |
| `onAction` | `function` | `-` | 引导按钮点击 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |
| `renderOverlay` | 每次渲染，覆盖在面板内容之上 | 面板内浮层（提示、下拉、加载遮罩） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### EscClosePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `topOnly` | `boolean` | `true` | 只在自己是最高层 sheet 时才响应 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `close` | `ctx.close(): void` | 关闭面板：走关闭补间，动画结束后触发 onClose |

### FocusTrapPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `restoreFocus` | `boolean` | `true` | 关闭时归还焦点 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getPanel` | `ctx.getPanel(): HTMLDivElement \| null` | 取面板 DOM 节点，用于测量或聚焦，可能为 null |

### FooterPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `primaryText` | `string \| () => string` | `-` | 主按钮文案（必填）；传函数时每次渲染求值，可随选中数等状态变化 |
| `onPrimary` | `function` | `-` | 主按钮点击 |
| `secondaryText` | `string` | `-` | 次按钮文案（不传则不渲染） |
| `onSecondary` | `function` | `-` | 次按钮点击 |
| `primaryLoading` | `boolean` | `false` | 主按钮加载态 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，面板底部槽位 | 操作按钮、二次确认、安全区占位 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### HapticsPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `snapMs` | `number` | `8` | 吸附时震动时长 ms |
| `closeMs` | `number` | `12` | 关闭时震动时长 ms |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onClose` | 关闭补间动画完成后（受控关闭也会触发） | 关闭后的清理与上报 |
| `onSnap` | 吸附到某一档位后（含打开补间结束） | 拿到目标档位 index，做联动（切换内容、上报展开高度） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### HeaderPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `` | 标题文本，为空则只渲染关闭按钮 |
| `closable` | `boolean` | `true` | 是否显示关闭按钮 |
| `titleId` | `string` | `` | 标题元素 id；配合 Core 的 ariaLabelledby 关联对话框名称 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，面板顶部槽位 | 面板标题、关闭按钮、步骤指示 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `close` | `ctx.close(): void` | 关闭面板：走关闭补间，动画结束后触发 onClose |
| `getDragProps` | `ctx.getDragProps(): ModalSheetDragProps` | 取拖拽把手所需的 props（事件处理器与样式），透传给把手元素 |

### HistoryPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `state` | `unknown` | `{ vaneModalSheet: "close" }` | 推入 history 的状态标记 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |
| `onClose` | 关闭补间动画完成后（受控关闭也会触发） | 关闭后的清理与上报 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `close` | `ctx.close(): void` | 关闭面板：走关闭补间，动画结束后触发 onClose |

### KeepMountedPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |
| `onClose` | 关闭补间动画完成后（受控关闭也会触发） | 关闭后的清理与上报 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getPanel` | `ctx.getPanel(): HTMLDivElement \| null` | 取面板 DOM 节点，用于测量或聚焦，可能为 null |

### KeyboardAvoidPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `snapToTop` | `boolean` | `true` | 键盘弹出时自动吸附到最高档 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setViewportInset` | `ctx.setViewportInset(px: number): void` | 设置面板与视口的安全内边距（避开刘海 / 底部手势区） |
| `snapTo` | `ctx.snapTo(index: number): void` | 吸附到指定档位（带补间动画，结束后触发 onSnap） |

### LoadingStatePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `loading` | `boolean` | `false` | 是否处于加载态 |
| `rows` | `number` | `3` | 骨架行数 |
| `shimmerColor` | `string` | `#eef1f4` | 骨架高亮色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |
| `transformProps` | 渲染前链式改写真面板 props | 按 config 覆盖高度档位、遮罩、圆角等 |
| `renderOverlay` | 每次渲染，覆盖在面板内容之上 | 面板内浮层（提示、下拉、加载遮罩） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ModalEffectPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `amount` | `number` | `0.06` | 背景最大缩大量 0-1 |
| `hostSelector` | `string` | `#root` | 被缩放的宿主节点选择器 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### NestedScrollPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getPanel` | `ctx.getPanel(): HTMLDivElement \| null` | 取面板 DOM 节点，用于测量或聚焦，可能为 null |

### ResponsivePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `breakpoint` | `number` | `768` | 桌面态断点 px |
| `desktopWidth` | `number` | `560` | 桌面态面板最大宽度 |
| `inset` | `number` | `24` | 桌面态悬浮间距 px |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `transformProps` | 渲染前链式改写真面板 props | 按 config 覆盖高度档位、遮罩、圆角等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SafeAreaPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `extraBottom` | `number` | `0` | 额外底部 padding px |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformProps` | 渲染前链式改写真面板 props | 按 config 覆盖高度档位、遮罩、圆角等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ScrollLockPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `lockTouch` | `boolean` | `false` | 是否锁定背景触摸滚动（touchmove 拦截） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SearchBarPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `placeholder` | `string` | `搜索` | 占位文本 |
| `defaultValue` | `string` | `` | 初始值 |
| `onSearch` | `function` | `-` | 输入回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，面板顶部槽位 | 面板标题、关闭按钮、步骤指示 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SnapDotsPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `activeColor` | `string` | `--vane-modal-sheet-dot-active token (#1f2329)` | 激活档颜色 |
| `inactiveColor` | `string` | `--vane-modal-sheet-dot token (#7c8288)` | 非激活档颜色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onSnap` | 吸附到某一档位后（含打开补间结束） | 拿到目标档位 index，做联动（切换内容、上报展开高度） |
| `renderHandle` | 每次渲染，拖拽把手槽位 | 把手的视觉与拖拽提示 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getDragProps` | `ctx.getDragProps(): ModalSheetDragProps` | 取拖拽把手所需的 props（事件处理器与样式），透传给把手元素 |
| `snapTo` | `ctx.snapTo(index: number): void` | 吸附到指定档位（带补间动画，结束后触发 onSnap） |

### StepFlowPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `steps` | `string[]` | `[]` | 各步骤标题（决定总步数） |
| `initialStep` | `number` | `0` | 起始步骤索引 |
| `onFinish` | `function` | `-` | 最后一步点击完成时触发 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，面板顶部槽位 | 面板标题、关闭按钮、步骤指示 |
| `renderFooter` | 每次渲染，面板底部槽位 | 操作按钮、二次确认、安全区占位 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
