import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/**
 * 统一 lint 规则。
 * 与旧仓库（旧仓库）的差异：
 *  - no-explicit-any 降为 warn（插件系统本身大量使用 any，但提示仍在）
 *  - no-unused-vars 恢复为 warn，避免历史包袱直接 FAIL CI
 *  - 明确放开 console（插件沙箱内部需要 console.warn）
 */
export default tseslint.config(
  // 注意：必须用 **/ 前缀——共享配置的 ignores 相对各消费包解析，裸目录名不生效
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/demo-dist/**",
      "**/demo/dist/**",
      // vitepress 构建产物（cache/deps 里是第三方打包结果，不是本仓源码）
      "**/.vitepress/cache/**",
      "**/.vitepress/.temp/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }
      ],
      "no-console": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },
  // demo 统一采用「导出 meta + 匿名 export default createXxx()」的注册表写法，
  // only-export-components 在该场景恒为误报；只对 demo 关闭这一条规则（test/src 不受影响）。
  // templates/demo-shell 是各包 demo 外壳的唯一真源（由 scripts/sync-demo-shell.mjs 生成），同属 demo 场景。
  {
    files: ["**/demo/**/*.{ts,tsx}", "**/templates/demo-shell/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  }
);
