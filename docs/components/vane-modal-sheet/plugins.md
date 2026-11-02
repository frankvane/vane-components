# 底部弹层 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [AnnouncerPlugin](./AnnouncerPlugin) | 读屏播报：aria-live 区域在档位变化时播报当前进度。 | `labels` = - | 0.1.0 | a11y, screen-reader, feedback |
| [BackdropPlugin](./BackdropPlugin) | 遮罩：透明度随打开进度联动，点击关闭（可配置）。 | `color` = "rgba(0, 0, 0, 0.45)"<br/>`dismissOnClick` = true | 0.1.0 | backdrop, visual |
| [DragHandlePlugin](./DragHandlePlugin) | 拖拽指示条：视觉提示 + 默认拖拽面，按住上下拖动切换吸附档或关闭。 | `color` = "--vane-modal-sheet-handle token (#6b7280)"<br/>`width` = 36 | 0.1.0 | drag, handle, visual |
| [EmptyStatePlugin](./EmptyStatePlugin) | 空态占位：empty 时内容区覆盖占位提示与引导动作。 | `empty` = false<br/>`text` = "暂无内容"<br/>`actionText` = -<br/>`onAction` = - | 0.1.0 | empty, feedback |
| [EscClosePlugin](./EscClosePlugin) | Esc 关闭：键盘 Escape 触发关闭；多层嵌套时只关最顶层（栈序）。 | `topOnly` = true | 0.1.0 | keyboard, close, a11y |
| [FocusTrapPlugin](./FocusTrapPlugin) | 焦点圈定：打开时焦点进入面板并 Tab 循环，关闭时归还焦点（配合内核自带的 role=dialog / aria-modal）。 | `restoreFocus` = true | 0.1.0 | a11y, focus, behavior |
| [FooterPlugin](./FooterPlugin) | 吸底操作区：主/次按钮（44px 触达），适配底部安全区。 | `primaryText` = -<br/>`onPrimary` = -<br/>`secondaryText` = -<br/>`onSecondary` = -<br/>`primaryLoading` = false | 0.1.0 | footer, actions, visual |
| [HapticsPlugin](./HapticsPlugin) | 触感反馈：吸附 / 关闭时 navigator.vibrate 短震，不支持的设备静默跳过。 | `snapMs` = 8<br/>`closeMs` = 12 | 0.1.0 | haptics, mobile, feedback |
| [HeaderPlugin](./HeaderPlugin) | 标题栏：标题 + 关闭按钮，整行兼拖拽面。 | `title` = ""<br/>`closable` = true | 0.1.0 | header, visual |
| [HistoryPlugin](./HistoryPlugin) | Android 返回手势 / 浏览器后退关闭：打开时 pushState，popstate 触发关闭。 | `state` = { vaneModalSheet: "close" } | 0.1.0 | history, android, mobile |
| [KeepMountedPlugin](./KeepMountedPlugin) | 关闭保活：关闭时记住内容区滚动位置，重新打开时恢复阅读进度。 | - | 0.1.0 | state, ux |
| [KeyboardAvoidPlugin](./KeyboardAvoidPlugin) | 虚拟键盘避让：visualViewport 监听，经 setViewportInset 通知内核重算吸附几何。 | `snapToTop` = true | 0.1.0 | keyboard, mobile, behavior |
| [LoadingStatePlugin](./LoadingStatePlugin) | 加载骨架：loading 时内容区覆盖骨架屏并锁定拖拽。 | `loading` = false<br/>`rows` = 3<br/>`shimmerColor` = "#eef1f4" | 0.1.0 | loading, skeleton, feedback |
| [ModalEffectPlugin](./ModalEffectPlugin) | iOS modal effect：背景页随打开进度轻微放大（Apple Maps 弹层感），走 CSS 变量零渲染成本。 | `amount` = 0.06<br/>`hostSelector` = "#root" | 0.1.0 | ios, effect, visual |
| [NestedScrollPlugin](./NestedScrollPlugin) | 内容滚动联动拖拽：内容没滚回顶部时锁定拖拽（disableDrag 场景）。 | - | 0.1.0 | scroll, gesture |
| [ResponsivePlugin](./ResponsivePlugin) | 断点策略：窄屏 bottom sheet，宽屏居中悬浮弹窗（限宽 + 四角圆角 + 悬浮间距）。 | `breakpoint` = 768<br/>`desktopWidth` = 560<br/>`inset` = 24 | 0.1.0 | responsive, layout |
| [SafeAreaPlugin](./SafeAreaPlugin) | 刘海屏 / 手势条适配：面板注入 env(safe-area-inset-*) 底部内边距。 | `extraBottom` = 0 | 0.1.0 | mobile, safe-area, layout |
| [ScrollLockPlugin](./ScrollLockPlugin) | body 滚动锁定：isOpen 时锁定背景滚动，关闭时恢复，防 iOS 滚动穿透。 | `lockTouch` = false | 0.1.0 | scroll, body, behavior |
| [SearchBarPlugin](./SearchBarPlugin) | 搜索框：非受控输入，onSearch 回调 + bus 广播（modal-sheet:search），供列表过滤联动。 | `placeholder` = "搜索"<br/>`defaultValue` = ""<br/>`onSearch` = - | 0.1.0 | search, form, header |
| [SnapDotsPlugin](./SnapDotsPlugin) | 吸附档位指示点：当前档高亮，点击直接吸附到对应档。 | `activeColor` = "--vane-modal-sheet-dot-active token (#1f2329)"<br/>`inactiveColor` = "--vane-modal-sheet-dot token (#7c8288)" | 0.1.0 | snap, indicator, visual |
| [StepFlowPlugin](./StepFlowPlugin) | 分步流程：头部步骤进度指示 + 底部上一步/下一步，适合分步表单与引导。 | `steps` = []<br/>`initialStep` = 0<br/>`onFinish` = - | 0.1.0 | steps, flow, form |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
