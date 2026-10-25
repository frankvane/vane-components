import { describe, expect, it } from "vitest";
import { createExamplePlugin } from "../src/custom-plugins/ExamplePlugin";

describe("createExamplePlugin", () => {
  it("默认不渲染覆盖层", () => {
    const plugin = createExamplePlugin();
    expect(plugin.name).toBe("example-plugin");
    expect(plugin.hooks.renderOverlay?.({} as any)).toBeNull();
  });

  it("传入 text 时渲染覆盖层", () => {
    const plugin = createExamplePlugin({ text: "hi" });
    const node = plugin.hooks.renderOverlay?.({} as any);
    expect(node).not.toBeNull();
  });

  it("挂载机器可读 meta", () => {
    expect(createExamplePlugin.meta.name).toBe("ExamplePlugin");
  });
});
