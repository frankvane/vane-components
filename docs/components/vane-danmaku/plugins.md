# 弹幕 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [CmdParsePlugin](./CmdParsePlugin) | 互动指令：/clear、#lottery 等弹幕在 transformData 阶段被识别、从渲染流移除，并经 bus 事件触发业务动作。 | `prefixes` = ["/", "#"]<br/>`commands` = { clear, lottery } | 0.1.0 | command, interaction, data |
| [FanBadgePlugin](./FanBadgePlugin) | 粉丝牌：按 userId 富化 meta.fanBadge，canvas 内核据此绘制牌底块 + 白字。插件只写数据，绝不直绘。 | `badges` = {}<br/>`defaultColor` = "#ff7a29" | 0.1.0 | badge, enrich, data |
| [PinnedTopPlugin](./PinnedTopPlugin) | 高赞置顶：高等级弹幕标记 pinned + ring，内核钉在顶部带、居中停留并加高赞环高亮，不随风滚动。 | `minLevel` = 18 | 0.1.0 | pin, highlight, data |
| [SafeZonePlugin](./SafeZonePlugin) | 防遮挡：把避让区来源写入运行时 shared，内核每帧让轨道避开人物区。默认静态安全区（顶/底条带），可选接 MediaPipe（消费方注入 provider）。发布包不捆绑 ML。 | `provider` = undefined<br/>`reservedBands` = { top: 0.18, bottom: 0.12 } | 0.1.0 | occlusion, track, strategy |
| [SensitiveFilterPlugin](./SensitiveFilterPlugin) | 敏感词过滤：命中词按 mode 打码或删除；打码条保留并标记 masked，避免弹幕流闪烁。 | `words` = []<br/>`mask` = "*"<br/>`mode` = "mask" | 0.1.0 | filter, safety, data |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
