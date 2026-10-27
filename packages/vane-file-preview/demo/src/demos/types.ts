/**
 * 逐项示例页的契约
 *
 * 一页 = 一个 `NN-slug.tsx` 文件，**自包含**：装配写在模块顶层常量里，
 * 页面拿到 file / variant 直接渲染。这样下通栏「完整源码」展示的就是真正在跑的
 * 那份文件（`?raw` 同源），复制出去能直接跑，不存在「示例代码和实际实现两套」。
 *
 * 与外层骨架的分工：
 *  - 文件负责「装什么、怎么排」（装配 + 特有条交互）；
 *  - 骨架负责「灯光、文件条、读数、日志、代码」（`pages/DemoDetailPage.tsx`）。
 */
import type React from "react";
import type { FileInfo, PreviewStateInfo } from "vane-file-preview";
import type { LogFn } from "../lib/previews";

export interface DemoFileMeta {
  /** catalog 里的插件 id（image / pdf / …）；骨架据此取标题、样本、参数表 */
  plugin: string;
  /** 这一页想额外交代的一句话，显示在控件条右侧（可选） */
  hint?: string;
}

export interface DemoStageProps {
  /** 当前选中的样本（已解析成 FileInfo，带 url/size） */
  file: FileInfo;
  /** 当前装配档位（catalog.variants 的 key） */
  variant: string;
  onLog: LogFn;
  onState: (state: PreviewStateInfo) => void;
}

export interface DemoFileModule {
  meta: DemoFileMeta;
  /**
   * 本文件支持的档位 key。
   * registry 会把它和 catalog 的 `variants` 对齐 —— 漂移在开发期就抛，
   * 而不是等用户点到那个档位看到空白。
   */
  keys: string[];
  default: React.FC<DemoStageProps>;
}
