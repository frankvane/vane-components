/**
 * `vane-file-preview/custom-plugins/JsonPreviewPlugin`
 *
 * JSON 树视图：折叠 / 展开、关键字搜索 + 路径复制、导出为格式化后的 JSON。
 *
 * ## 迁移时改掉的三件事
 *
 * 1. **主题从 10 套收敛到 2 套（浅色 / 深色）+ auto。**
 *    迁移前 `@uiw/react-json-view/basic|dark|githubDark|githubLight|gruvbox|light|
 *    monokai|nord|vscode` 九个主题子路径**全部静态 import**。这不是「多几个配色」的问题：
 *    每个子路径都是独立模块，external 写包名时一条都匹配不到，九个主题连带各自的
 *    类型判定组件全被内联。而且实际能用的场景只有「跟系统深浅色」，九选一对用户是负担。
 *    现在读系统偏好、跟随系统变化，配置里只留 `theme: "light" | "dark" | "auto"`。
 * 2. **`jszip` 同款的静态依赖问题**：`@uiw/react-json-view` 改成动态 import，
 *    没装就渲染 `MissingDependency` 面板。
 * 3. **删掉 12 处 `console.log`**。迁移前打开一个 JSON 文件会在控制台打十几行
 *    「📄 开始解析」「📄 响应头」「🔍 搜索结果」，还带文件内容前 200 字符 ——
 *    既是噪音，也把文件内容写进了日志。
 *
 * ## `maxFileSize` 是**前置**拦截
 *
 * 5MB 的 JSON 解析出来是几百 MB 的对象树，渲染器会直接把标签页卡死。
 * 所以在 fetch 之前就按 `file.size` 拦，而不是等 `JSON.parse` 完再判断。
 * `file.size` 为 0（调用方没给）时放行 —— 拦不住也比误拦强。
 */

import React from "react";

import {
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { JsonBody } from "./internal";

type JsonThemeName = "auto" | "light" | "dark";

export interface JsonPreviewPluginConfig {
  /** 超过这个字节数直接拒绝渲染。默认 5MB */
  maxFileSize?: number;
  /** 顶部搜索框。默认 true */
  enableSearch?: boolean;
  /** 节点里的复制按钮 + 搜索结果里的「复制路径」。默认 true */
  enableCopy?: boolean;
  /** 配色。默认 "auto"（跟随系统 prefers-color-scheme） */
  theme?: JsonThemeName;
  /** 初始折叠层级：0 = 全展开，1 = 只展开根，以此类推。默认 0 */
  collapsed?: number;
}

/** 模块级常量：一次并行加载组件与两套主题，引用稳定 */
const loadJsonView = async () => {
  const [core, light, dark] = await Promise.all([
    import("@uiw/react-json-view"),
    import("@uiw/react-json-view/light"),
    import("@uiw/react-json-view/dark"),
  ]);
  return {
    JsonView: core.default,
    themes: {
      light: light.lightTheme,
      dark: dark.darkTheme,
    } as Record<"light" | "dark", React.CSSProperties>,
  };
};

export function createJsonPreviewPlugin(
  config: JsonPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<JsonPreviewPluginConfig> = {
    maxFileSize: config.maxFileSize ?? 5 * 1024 * 1024,
    enableSearch: config.enableSearch ?? true,
    enableCopy: config.enableCopy ?? true,
    theme: config.theme ?? "auto",
    collapsed: config.collapsed ?? 0,
  };

  return {
    name: "JsonPreviewPlugin",
    version: "1.0.0",
    description: "JSON 树视图（折叠 / 搜索 / 导出）",
    supportedTypes: [
      "application/json",
      "text/json",
      "application/ld+json",
      "application/manifest+json",
    ],
    supportedExtensions: [".json", ".jsonld", ".webmanifest", ".map"],
    priority: 6,
    config: resolved,

    hooks: {
      render: (context) => (
        <JsonBody
          context={context}
          config={resolved}
          loadJsonView={loadJsonView}
        />
      ),

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="JSON"
            icon="🧾"
          />
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() =>
              triggerDownload(context.file.url, context.file.name)
            }
            icon="📥"
            title="下载原文件"
          >
            下载
          </ToolbarButton>
        </ToolbarContainer>
      ),
    },
  };
}

export default createJsonPreviewPlugin;
