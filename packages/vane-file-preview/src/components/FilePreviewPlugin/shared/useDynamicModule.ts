/**
 * 动态加载可选依赖。
 *
 * ## 为什么不用静态 import
 *
 * 静态 `import JSZip from "jszip"` 有两个后果，迁移前都真实发生过：
 *   1. 消费方没装 jszip 时模块图直接崩，整页白屏（可选依赖就失去了「可选」的意义）；
 *   2. 构建时若 external 没写正则，整个库被内联，`dist` 从 40KB 涨到 1MB（见 vite.config 注释）。
 *
 * 动态 `import()` 把这两件事都解决了：依赖在**用到时才加载**，且失败是可捕获的
 * ——失败就渲染 `MissingDependency` 面板，而不是让页面消失。
 *
 * ## 调用方约束：loader 必须是**模块级常量**
 *
 * `useEffect` 靠引用判等，每次渲染都新建个箭头函数 = 每次渲染都重新 import（还会
 * 反复 setState）。所以每个插件都写成：
 *
 * ```ts
 * const loadJSZip = () => import("jszip");        // 模块级，引用永远不变
 * const { status, mod, error } = useDynamicModule(loadJSZip);
 * ```
 *
 * 另外 `import("jszip")` 字面量必须写在这里（不能是拼出来的变量名）——
 * Vite / Rollup 只在**静态可分析**时才把它拆成独立 chunk。
 */

import { useEffect, useState } from "react";

export type DynamicModuleState<T> =
  | { status: "loading"; mod: null; error: null }
  | { status: "ready"; mod: T; error: null }
  | { status: "unavailable"; mod: null; error: Error };

export function useDynamicModule<T>(
  loader: () => Promise<T>
): DynamicModuleState<T> {
  const [state, setState] = useState<DynamicModuleState<T>>({
    status: "loading",
    mod: null,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading", mod: null, error: null });

    loader()
      .then((mod) => {
        if (alive) setState({ status: "ready", mod, error: null });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setState({
          status: "unavailable",
          mod: null,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });

    return () => {
      alive = false;
    };
  }, [loader]);

  return state;
}

/**
 * 命名空间模块 → 默认导出（CJS/UMD 互操作）。
 *
 * `import("jszip")` 在浏览器里拿到的是 `{ default: JSZip, ... }`，
 * 而在某些打包器/测试环境下 `default` 可能被拍平。刻意用 `unknown` 收口，
 * 让调用方自己写一次断言，而不是在这里 `as any` 蒙过去。
 */
export function defaultOf<T>(mod: unknown): T {
  if (mod && typeof mod === "object" && "default" in mod) {
    return (mod as { default: T }).default;
  }
  return mod as T;
}
