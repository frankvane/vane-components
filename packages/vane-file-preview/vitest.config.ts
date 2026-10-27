import { mergeConfig } from "vitest/config";
import { createVitestConfig } from "@vane/vitest-config";

/**
 * happy-dom 里 `<iframe src="https://...">` 会**真的去发网络请求**。
 *
 * 这个包有三处渲染 iframe：PDF、Office 在线查看器（`view.officeapps.live.com`）。
 * 不关掉的话，跑一次测试就往微软的服务器上打请求 —— 离线环境下测试超时，
 * 联网时把别人的服务当靶子。断言只读 `src` 属性，不需要真的加载页面。
 *
 * 用 `mergeConfig` 补一层而不是改 `@vane/vitest-config`：那个包被四个包共用，
 * 为一个包的 iframe 需求动共享默认值不值当。
 */
export default mergeConfig(
  createVitestConfig({ environment: "happy-dom" }),
  {
    test: {
      environmentOptions: {
        happyDOM: {
          settings: {
            disableIframePageLoading: true,
          },
        },
      },
      // happy-dom 每创建一个 iframe 就打一条 "Iframe page loading is disabled"，
      // 它只说明我们主动关掉了加载（见上），不是被测代码出错 —— 滤掉，
      // 别让真正的 stderr 淹没在几十条无害噪音里。
      onConsoleLog(log) {
        if (log.includes("Iframe page loading is disabled")) return false;
        return undefined;
      },
    },
  }
);
