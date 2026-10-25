import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { defineConfig, type UserConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { discoverEntries, generateExports } from "../discover-entries.mjs";

/**
 * @vane/build-config
 * 统一 Vite 构建配置：库构建 + 入口自动发现 + demo 构建。
 * 入口/exports 规则见 discover-entries.mjs（构建与发布脚本共用同一份实现）。
 */

export const DEFAULT_EXTERNAL = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
];

export { discoverEntries, generateExports };

export interface LibOptions {
  /** UMD 全局变量名，如 "VaneTable" */
  name: string;
  /** 包根目录，默认 process.cwd() */
  root?: string;
  /** 额外 external（如 localforage、pdfjs-dist） */
  external?: string[];
  /** 输出格式，默认仅 es（现代打包器均支持；需要兼容 CJS 时传 ["es","cjs"]） */
  formats?: Array<"es" | "cjs">;
  /** 是否生成 d.ts，默认 true */
  dts?: boolean;
  /** 是否压缩，默认 true */
  minify?: boolean;
}

export interface DemoOptions {
  /** 包根目录（不是 demo 目录），默认 process.cwd() */
  root?: string;
  /** html 入口，默认 <root>/demo/index.html */
  entry?: string;
  port?: number;
  outDir?: string;
  /** dev 服务器自动打开的路径；html 在 demo/ 子目录时传 "/demo/index.html"，
   *  否则根路径没有 index.html 会打开空白页。默认 true（根路径） */
  open?: string | boolean;
}

/** 把 src/styles/*.css 复制到 dist/style.css，避免为一行 CSS 引额外依赖 */
function cssCopyPlugin(root: string): Plugin {
  return {
    name: "vane-css-copy",
    generateBundle() {
      const dir = path.join(root, "src", "styles");
      if (!existsSync(dir)) return;
      const files = readdirSync(dir).filter((f) => f.endsWith(".css"));
      const css = files.map((f) => readFileSync(path.join(dir, f), "utf-8")).join("\n");
      if (!css) return;
      this.emitFile({ type: "asset", fileName: "style.css", source: css });
    },
  };
}

/** 库构建配置 */
export function createLibConfig(options: LibOptions): UserConfig {
  const root = options.root ?? process.cwd();
  const entries = discoverEntries(root);
  const external = [...DEFAULT_EXTERNAL, ...(options.external ?? [])];
  const formats = options.formats ?? ["es"];
  const primary = entries.index ?? Object.values(entries)[0];

  const plugins: Plugin[] = [react() as unknown as Plugin];

  if (options.dts !== false) {
    plugins.push(
      dts({
        include: ["src"],
        outDir: "dist",
        // Windows 下 rollup 打包类型文件可能触发 EPERM，关闭以避免写入后清理失败
        rollupTypes: false,
        tsconfigPath: "./tsconfig.json",
        staticImport: true,
        insertTypesEntry: true,
      }) as unknown as Plugin
    );
  }

  plugins.push(cssCopyPlugin(root));

  const srcDir = path.join(root, "src");

  // 入口产物路径 = 源码相对路径（与 d.ts 输出一致，仅差扩展名）
  const entryFileNames = (chunk: { facadeModuleId?: string | null }) => {
    const rel = path.relative(srcDir, chunk.facadeModuleId ?? "").split(path.sep).join("/");
    return rel.replace(/\.tsx?$/, ".js");
  };

  const outputs = formats.map((format) => ({
    format,
    dir: "dist",
    entryFileNames,
    chunkFileNames: "chunks/[name]-[hash].js",
    assetFileNames: "[name][extname]",
    ...(format === "cjs" ? { exports: "named" as const } : {}),
  }));

  return defineConfig({
    plugins,
    build: {
      outDir: "dist",
      emptyOutDir: true,
      minify: options.minify === false ? false : "esbuild",
      target: "es2020",
      lib: {
        entry: primary,
        name: options.name,
      },
      rollupOptions: {
        input: entries,
        external,
        output: outputs,
      },
    },
  });
}

/** demo 构建配置（演示站，不参与发布）。root 传包根目录，html 放在 demo/ 下 */
export function createDemoConfig(options: DemoOptions = {}): UserConfig {
  const root = options.root ?? process.cwd();
  const entry = options.entry ?? path.resolve(root, "demo/index.html");
  return defineConfig({
    root,
    base: "./",
    plugins: [react() as unknown as Plugin],
    resolve: {
      alias: { "@": path.resolve(root, "src") },
    },
    server: { port: options.port ?? 3000, open: options.open ?? true },
    build: {
      outDir: options.outDir ?? "demo-dist",
      emptyOutDir: true,
      rollupOptions: { input: entry },
    },
  });
}
