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
  }
);
