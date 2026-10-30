import { afterAll, describe, expect, it } from "vitest";
import { runSelfTest } from "../demo/src/lib/selftest";

// 与项目其它组件测试一致，声明 act 环境，避免 React 18 的 act 告警噪声。
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * 浏览器内自测的确定性版本：直接复用 demo 里的 runSelfTest（真实挂载 + 真实点击 + 读真实 DOM），
 * 只是在 happy-dom 里跑而不是真实浏览器。几何断言在无布局引擎环境下自动跳过
 * （audit-coupon 的布局可用性探测），状态机 / 有效期 / 规则 / 叠加断言照常生效。
 */
describe("coupon 浏览器内自测（happy-dom）", () => {
  it("全部断言通过，无失败项", async () => {
    const result = await runSelfTest();
    if (result.failed.length) {
      // 让失败项直接暴露
      console.error("SELFTEST FAILED:", result.failed.join(" | "));
    }
    expect(result.failed.length, `失败项: ${result.failed.join(" | ")}`).toBe(0);
    expect(result.passed).toBe(result.total);
    expect(result.total).toBeGreaterThan(0);
  });
});

afterAll(() => {
  // 自测里创建过游离 DOM 节点，跑完清一下，避免影响后续文件
  document.body.innerHTML = "";
});
