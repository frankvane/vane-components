import { describe, expect, it } from "vitest";
import { createBackdropPlugin } from "../src/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "../src/custom-plugins/DragHandlePlugin";
import { createSnapDotsPlugin } from "../src/custom-plugins/SnapDotsPlugin";
import { createHeaderPlugin } from "../src/custom-plugins/HeaderPlugin";
import { createStepFlowPlugin } from "../src/custom-plugins/StepFlowPlugin";
import { createSearchBarPlugin } from "../src/custom-plugins/SearchBarPlugin";
import { createFooterPlugin } from "../src/custom-plugins/FooterPlugin";
import { createKeyboardAvoidPlugin } from "../src/custom-plugins/KeyboardAvoidPlugin";
import { createScrollLockPlugin } from "../src/custom-plugins/ScrollLockPlugin";
import { createFocusTrapPlugin } from "../src/custom-plugins/FocusTrapPlugin";

/** MVP 10 插件：工厂返回结构 + meta 挂载 + doc.json 完整性 */
const FACTORIES = [
  createBackdropPlugin,
  createDragHandlePlugin,
  createSnapDotsPlugin,
  createHeaderPlugin,
  createStepFlowPlugin,
  createSearchBarPlugin,
  createFooterPlugin,
  createKeyboardAvoidPlugin,
  createScrollLockPlugin,
  createFocusTrapPlugin,
];

describe("MVP 插件三件套", () => {
  it("每个工厂返回合规 Plugin 结构且 meta 已挂载", () => {
    for (const factory of FACTORIES) {
      const plugin = factory();
      expect(typeof plugin.name).toBe("string");
      expect(plugin.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(plugin.hooks).toBeTruthy();
      expect(plugin.version).toBeTruthy();
      // .meta = doc.json（demo 插件卡与文档生成的真源）
      expect(factory.meta).toBeTruthy();
      expect(factory.meta.name).toBeTruthy();
      expect(factory.meta.description).toBeTruthy();
      expect(typeof factory.meta.example).toBe("string");
    }
  });

  it("插件 name 全局唯一", () => {
    const names = FACTORIES.map((f) => f().name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("priority 落在各槽位约定带内", () => {
    const p = (f: (typeof FACTORIES)[number]) => f().priority ?? 0;
    expect(p(createBackdropPlugin)).toBe(10);
    expect(p(createDragHandlePlugin)).toBe(20);
    expect(p(createSnapDotsPlugin)).toBe(24);
    expect(p(createHeaderPlugin)).toBe(30);
    expect(p(createStepFlowPlugin)).toBe(32);
    expect(p(createSearchBarPlugin)).toBe(34);
    expect(p(createFooterPlugin)).toBe(40);
    expect(p(createKeyboardAvoidPlugin)).toBe(50);
    expect(p(createScrollLockPlugin)).toBe(52);
    expect(p(createFocusTrapPlugin)).toBe(54);
  });

  it("视觉件插件声明了对应的渲染槽钩子", () => {
    expect(typeof createBackdropPlugin().hooks.renderBackdrop).toBe("function");
    expect(typeof createDragHandlePlugin().hooks.renderHandle).toBe("function");
    expect(typeof createHeaderPlugin().hooks.renderHeader).toBe("function");
    expect(typeof createSearchBarPlugin().hooks.renderHeader).toBe("function");
    expect(typeof createFooterPlugin().hooks.renderFooter).toBe("function");
    expect(typeof createStepFlowPlugin().hooks.renderHeader).toBe("function");
    expect(typeof createStepFlowPlugin().hooks.renderFooter).toBe("function");
  });

  it("行为插件声明了生命周期/属性钩子", () => {
    expect(typeof createKeyboardAvoidPlugin().hooks.onMount).toBe("function");
    expect(typeof createScrollLockPlugin().hooks.onPropsChange).toBe("function");
    expect(typeof createFocusTrapPlugin().hooks.onPropsChange).toBe("function");
  });

  it("SnapDots 在单档时不渲染", () => {
    const plugin = createSnapDotsPlugin();
    const node = plugin.hooks.renderHandle?.({
      snapCount: 1,
      currentSnap: 0,
    } as any);
    expect(node).toBeNull();
  });
});
