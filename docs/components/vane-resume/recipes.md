# 结构化简历 · 组合配方

配方 = 一组插件的预设组合，用来降低「面对 20 个插件不知道选谁」的成本。

```tsx
import { ResumeCore, withPlugins } from "vane-resume";
import { createTemplateSwitchPlugin } from "vane-resume/custom-plugins/TemplateSwitchPlugin";

/** 配方：最简增强 */
export const Basic = withPlugins(ResumeCore, [
  createTemplateSwitchPlugin(),
]);
```

## 推荐做法

- 常用组合沉淀为配方导出在包内（建议 3-5 个起步，不设上限），让用户免于每次自己拼；
- 配方是「快捷方式」不是「白名单」——任何插件都可以单独引入；
- 配方本身也是一个「插件」，可被 `pnpm docs:plugins` 收录；
- 低频/重型插件用动态导入：`ExportPdf` 依赖 `html2canvas` + `jsPDF`，按需运行时加载：

```tsx
const { createExportPdfPlugin } = await import("vane-resume/custom-plugins/ExportPdfPlugin");
```
