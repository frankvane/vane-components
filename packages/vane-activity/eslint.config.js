import vane from "@vane/eslint-config";

export default [
  ...vane,
  {
    // 这些文件本来就是「工厂 / 装配模块」，不是 React Refresh 的组件边界：
    // 插件 create.tsx 导出 creator + 配置类型，demo 与 slots 导出场景/工具函数。
    files: [
      "demo/src/demos/**/*.{ts,tsx}",
      "demo/src/scenarios/**/*.{ts,tsx}",
      "demo/src/lib/**/*.{ts,tsx}",
      "src/custom-plugins/**/create.tsx",
      "src/components/ActivityPlugin/plugins/slots.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];
