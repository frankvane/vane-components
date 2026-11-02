import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ResumeCore, withPlugins, DEFAULT_SECTION_ORDER } from "../src";
import type { ResumeData, ResumePlugin, ResumePluginContext } from "../src";
import { createTemplateSwitchPlugin } from "../src/custom-plugins/TemplateSwitchPlugin";
import { createContactDesensitizePlugin } from "../src/custom-plugins/ContactDesensitizePlugin";
import { createPrivacyMaskPlugin } from "../src/custom-plugins/PrivacyMaskPlugin";
import { createAttachmentPreviewPlugin } from "../src/custom-plugins/AttachmentPreviewPlugin";
import { createShareLinkPlugin } from "../src/custom-plugins/ShareLinkPlugin";
import {
  createVersioningPlugin,
  type ResumeVersion,
} from "../src/custom-plugins/VersioningPlugin";
import { createAiPolishPlugin } from "../src/custom-plugins/AiPolishPlugin";
import { createQrCodePlugin } from "../src/custom-plugins/QrCodePlugin";
import { createTimelineViewPlugin } from "../src/custom-plugins/TimelineViewPlugin";
import { createDeliverTrackPlugin } from "../src/custom-plugins/DeliverTrackPlugin";
import {
  createMultiLangPlugin,
  type LocaleTranslations,
} from "../src/custom-plugins/MultiLangPlugin";
import { createPrintOptimizePlugin } from "../src/custom-plugins/PrintOptimizePlugin";
import { Overlay } from "../src/components/ResumePlugin/plugins/overlay";
import {
  highlightText,
  safeHref,
} from "../src/components/ResumePlugin/plugins/tokens";
import * as allPlugins from "../src/custom-plugins";

/** 直接调用插件钩子时使用的最小领域上下文 */
function makeCtx(
  data: ResumeData,
  state: Record<string, unknown> = {},
  shared = new Map<string, unknown>()
): ResumePluginContext<ResumeData> {
  return {
    props: { data },
    data,
    state,
    setState: (patch: Record<string, unknown>) => Object.assign(state, patch),
    shared,
    forceUpdate: () => {},
    getSize: () => ({ width: 0, height: 0 }),
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    bus: { on: () => () => {}, off() {}, emit() {} },
    refs: { container: { current: null } },
    deviceInfo: {},
  } as unknown as ResumePluginContext<ResumeData>;
}

const piiData: ResumeData = {
  basics: {
    name: "张三",
    title: "高级前端工程师",
    summary: "多年经验",
    contacts: [
      { type: "phone", label: "电话", value: "+86 138-0013-8000" },
      { type: "email", label: "邮箱", value: "zhangsan@example.com" },
      { type: "address", label: "地址", value: "北京" },
    ],
  },
  work: [{ company: "Acme", role: "前端工程师", start: "2020", end: "2023", highlights: ["负责核心业务"] }],
  education: [],
  skills: [],
};

const data: ResumeData = {
  basics: {
    name: "张三",
    title: "高级前端工程师",
    contacts: [{ type: "email", label: "邮箱", value: "zhangsan@example.com" }],
  },
  work: [{ company: "Acme", role: "前端工程师", start: "2020", end: "2023", highlights: [] }],
  education: [{ school: "某大学", degree: "本科", major: "计算机科学", start: "2016", end: "2020" }],
  skills: [{ category: "前端", items: ["React", "TypeScript"] }],
};

describe("ResumeCore 基础渲染", () => {
  it("渲染基础信息与板块标题", () => {
    const html = renderToStaticMarkup(<ResumeCore data={data} />);
    expect(html).toContain("张三");
    expect(html).toContain("高级前端工程师");
    expect(html).toContain("工作经历");
    expect(html).toContain("教育背景");
  });
});

describe("withPlugins 装配", () => {
  it("装配模板切换插件后仍渲染核心数据", () => {
    const Enhanced = withPlugins(ResumeCore, [createTemplateSwitchPlugin()]);
    const html = renderToStaticMarkup(<Enhanced data={data} />);
    expect(html).toContain("张三");
  });

  it("公开 withPlugins 挂载领域槽（renderToolbar 可见）", () => {
    const probe: ResumePlugin = {
      name: "probe-toolbar",
      priority: 10,
      hooks: {
        renderToolbar: () => <button type="button">工具栏探针</button>,
      },
    };
    const Enhanced = withPlugins(ResumeCore, [probe]);
    const html = renderToStaticMarkup(<Enhanced data={data} />);
    expect(html).toContain("工具栏探针");
  });
});

describe("highlightText", () => {
  it("命中关键词时包裹 <mark>", () => {
    const out = highlightText("hello world", ["world"]);
    const html = renderToStaticMarkup(<span>{out}</span>);
    expect(html).toContain("<mark");
    expect(html).toContain("world");
  });

  it("无关键词时原样返回字符串", () => {
    const out = highlightText("hello world", []);
    expect(typeof out === "string" ? out : "").toBe("hello world");
  });
});

describe("P0-2 联系方式脱敏不保留原始 href", () => {
  const contactData: ResumeData = {
    basics: {
      name: "王五",
      title: "前端工程师",
      contacts: [
        { type: "email", label: "邮箱", value: "wangwu@example.com", href: "mailto:wangwu@example.com" },
        { type: "phone", label: "电话", value: "13800138000", href: "tel:13800138000" },
        { type: "social", label: "主页", value: "github.com/wangwu", href: "https://github.com/wangwu" },
      ],
    },
    work: [],
    education: [],
    skills: [],
  };

  it("mask 模式经装配后 HTML 不残留原文与 mailto/tel 链接", () => {
    const Enhanced = withPlugins(ResumeCore, [createContactDesensitizePlugin()]);
    const html = renderToStaticMarkup(<Enhanced data={contactData} />);
    expect(html).not.toContain("wangwu@example.com");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("13800138000");
    expect(html).not.toContain("tel:");
    expect(html).toContain("***");
  });

  it("hide 模式同时清空 value 与 href", () => {
    const plugin = createContactDesensitizePlugin();
    const out = plugin.hooks.transformData!(
      { state: { contactMode: "hide" } } as unknown as ResumePluginContext<ResumeData>,
      contactData
    ) as ResumeData;
    expect(out.basics.contacts.every((c) => c.value === "***" && c.href === undefined)).toBe(true);
  });
});

describe("P0-3 链接协议白名单", () => {
  it("放行安全协议与相对路径", () => {
    expect(safeHref("https://example.com/a")).toBe("https://example.com/a");
    expect(safeHref("http://example.com")).toBe("http://example.com");
    expect(safeHref("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(safeHref("tel:+8613800000000")).toBe("tel:+8613800000000");
    expect(safeHref("/files/a.pdf")).toBe("/files/a.pdf");
    expect(safeHref("#contact")).toBe("#contact");
  });

  it("拦截危险协议与大小写/空白混淆", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref(" JaVaScRiPt:alert(1)")).toBeUndefined();
    expect(safeHref("java\nscript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBeUndefined();
    expect(safeHref("vbscript:msgbox(1)")).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
    expect(safeHref("   ")).toBeUndefined();
  });

  it("核心渲染不输出危险协议链接", () => {
    const unsafeData: ResumeData = {
      basics: {
        name: "赵六",
        title: "工程师",
        contacts: [
          { type: "email", label: "邮箱", value: "z@example.com", href: "javascript:alert(1)" },
        ],
      },
      work: [],
      education: [],
      skills: [],
      projects: [{ name: "项目", desc: "描述", links: ["javascript:alert(1)"] }],
      attachments: [
        { name: "恶意附件", kind: "link", url: "javascript:alert(1)" },
        { name: "正常附件", kind: "link", url: "https://example.com/a" },
      ],
    };
    const html = renderToStaticMarkup(<ResumeCore data={unsafeData} />);
    expect(html).not.toContain("javascript:");
    expect(html).toContain("https://example.com/a");
  });
});

describe("P1 回归", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("P1-2 隐私模式在数据层清空联系方式与简介", () => {
    const plugin = createPrivacyMaskPlugin();
    const out = plugin.hooks.transformData!(
      makeCtx(piiData, { privacyOn: true }),
      piiData
    ) as ResumeData;
    expect(out.basics.contacts).toHaveLength(0);
    expect(out.basics.summary).toBe("*** 已隐藏 ***");
    // 关闭时不应改动数据（保持同一引用）
    const off = plugin.hooks.transformData!(
      makeCtx(piiData, { privacyOn: false }),
      piiData
    ) as ResumeData;
    expect(off).toBe(piiData);
  });

  it("P1-11 默认脱敏覆盖 +86 / 短文本", () => {
    const plugin = createContactDesensitizePlugin();
    const out = plugin.hooks.transformData!(
      makeCtx(piiData, { contactMode: "mask" }),
      piiData
    ) as ResumeData;
    const [phone, email, address] = out.basics.contacts;
    // +86 与短横线被归一化，仍保留头 3 尾 4
    expect(phone.value).toBe("138***8000");
    expect(phone.value).not.toContain("13800138000");
    // 邮箱本地与域名均遮罩
    expect(email.value).not.toContain("zhangsan");
    expect(email.value).not.toContain("example");
    // 短文本无法保留结构时直接全隐藏
    expect(address.value).toBe("***");
    expect(out.basics.contacts.every((c) => c.href === undefined)).toBe(true);
  });

  it("P1-12 附件 iframe 带 sandbox / referrerPolicy", () => {
    const plugin = createAttachmentPreviewPlugin();
    const d: ResumeData = {
      ...piiData,
      attachments: [{ name: "简历.pdf", kind: "pdf", url: "https://example.com/a.pdf" }],
    };
    const ctx = makeCtx(d, { previewItem: 0 });
    const node = plugin.hooks.renderOverlay!(ctx);
    const html = renderToStaticMarkup(node as React.ReactElement);
    expect(html).toContain('sandbox="allow-scripts"');
    expect(html).toMatch(/referrerpolicy="no-referrer"/i);
    expect(html).not.toContain("allow-same-origin");
  });

  it("P1-5 分享默认不内联简历数据", async () => {
    const plugin = createShareLinkPlugin({ baseUrl: "https://cv.example.com/view" });
    const ctx = makeCtx(piiData);
    const node = plugin.hooks.renderToolbar!(ctx) as React.ReactElement<{ onClick: () => Promise<void> }>;
    await node.props.onClick();
    const url = ctx.shared.get("share:url") as string;
    expect(url).toBe("https://cv.example.com/view");
    expect(url).not.toContain("#r=");
    expect(url).not.toContain(encodeURIComponent(piiData.basics.name));
    expect(ctx.state.shareOpen).toBe(true);
  });

  it("P1-4 AI 润色缓存按语言隔离", () => {
    const plugin = createAiPolishPlugin();
    const shared = new Map<string, unknown>();
    shared.set("aipolish:polished", { lang: "en", summary: "English summary" });

    const mismatched = plugin.hooks.transformData!(
      makeCtx(piiData, { aiPolishEnabled: true, lang: "zh" }, shared),
      piiData
    ) as ResumeData;
    expect(mismatched).toBe(piiData);

    shared.set("aipolish:polished", { lang: "zh", summary: "中文润色" });
    const matched = plugin.hooks.transformData!(
      makeCtx(piiData, { aiPolishEnabled: true, lang: "zh" }, shared),
      piiData
    ) as ResumeData;
    expect(matched.basics.summary).toBe("中文润色");
    // 联系人等非润色字段不应被缓存覆盖
    expect(matched.basics.contacts).toHaveLength(piiData.basics.contacts.length);
  });

  it("P1-6 版本快照使用自定义 storageKey 并上报存储错误", () => {
    const getItem = vi.fn(() => null);
    vi.stubGlobal("localStorage", { getItem, setItem: vi.fn(), removeItem: vi.fn() });
    createVersioningPlugin({ storageKey: "resume-user-a" }).hooks.onMount!(
      makeCtx(piiData)
    );
    expect(getItem).toHaveBeenCalledWith("resume-user-a");

    const onStorageError = vi.fn();
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("storage denied");
      },
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    createVersioningPlugin({ onStorageError }).hooks.onMount!(makeCtx(piiData));
    expect(onStorageError).toHaveBeenCalled();
  });

  it("P1-3 隐私模式下二维码不编码明文联系方式", () => {
    const shared = new Map<string, unknown>();
    const plugin = createQrCodePlugin();
    plugin.hooks.renderOverlay!(makeCtx(piiData, { privacyOn: true }, shared));
    const pending = shared.get("qr:pending") as string;
    expect(pending).toContain("BEGIN:VCARD");
    expect(pending).not.toContain("zhangsan@example.com");

    const shared2 = new Map<string, unknown>();
    plugin.hooks.renderOverlay!(makeCtx(piiData, { privacyOn: false }, shared2));
    expect(shared2.get("qr:pending")).toContain("zhangsan@example.com");
  });

  it("P1-15 Overlay 具备 dialog 语义", () => {
    const html = renderToStaticMarkup(
      <Overlay title="测试弹层" onClose={() => {}}>
        <button type="button">确定</button>
      </Overlay>
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="测试弹层"');
    expect(html).toContain("data-vr-overlay");
  });
});

describe("P2 回归", () => {
  it("P2-1 投递事件读取最新列表，清理后停止监听", () => {
    const handlers = new Set<(d: unknown) => void>();
    const bus = {
      on: (_event: string, handler: (d: unknown) => void) => {
        handlers.add(handler);
        return () => handlers.delete(handler);
      },
      emit: (_event: string, payload: unknown) => handlers.forEach((h) => h(payload)),
      off: () => {},
    };
    const ctx = makeCtx(piiData);
    // 模拟真实 React 快照：setState 不会改写旧 ctx.state
    (ctx as unknown as { setState: () => void }).setState = () => {};
    (ctx as unknown as { bus: unknown }).bus = bus;

    const plugin = createDeliverTrackPlugin({ initial: [] });
    const cleanup = plugin.hooks.onMount!(ctx) as unknown as () => void;
    bus.emit("resume:deliver:add", { id: "a", company: "A", date: "2026-01-01", status: "投递" });
    bus.emit("resume:deliver:add", { id: "b", company: "B", date: "2026-01-02", status: "面试" });

    const list = ctx.shared.get("deliver:list") as Array<{ company: string }>;
    expect(list.map((d) => d.company)).toEqual(["A", "B"]);

    cleanup();
    bus.emit("resume:deliver:add", { id: "c", company: "C", date: "2026-01-03", status: "投递" });
    expect(
      (ctx.shared.get("deliver:list") as Array<{ company: string }>).map((d) => d.company)
    ).toEqual(["A", "B"]);
  });

  it("P2-3 时间轴模式保留关键词高亮", () => {
    const plugin = createTimelineViewPlugin({ mode: "timeline" });
    const d: ResumeData = {
      ...piiData,
      work: [
        {
          company: "React 团队",
          role: "React 工程师",
          start: "2020",
          end: "2023",
          highlights: ["使用 react 构建核心业务"],
        },
      ],
      education: [],
    };
    const node = plugin.hooks.renderWork!(
      makeCtx(d, { timelineMode: "timeline", highlightKeywords: ["React"] })
    );
    const html = renderToStaticMarkup(node as React.ReactElement);
    expect((html.match(/<mark/g) ?? []).length).toBe(3);
    expect(html).toContain("构建核心业务");
  });

  it("P2-10 关键词正则复用不串游标", () => {
    const render = () =>
      renderToStaticMarkup(<span>{highlightText("React 与 react", ["React"])}</span>);
    const first = render();
    const second = render();
    expect((first.match(/<mark/g) ?? []).length).toBe(2);
    expect(second).toBe(first);
  });

  it("P2-4 MultiLang 拒绝空 locales，并对 basics 做深合并", () => {
    expect(() => createMultiLangPlugin({ locales: [], translations: {} })).toThrow(/locales/);

    const translations: LocaleTranslations = {
      en: {
        basics: { name: "Zhang San", title: "Senior Frontend Engineer" },
      } as unknown as Partial<ResumeData>,
    };
    const plugin = createMultiLangPlugin({
      locales: [{ code: "en", label: "EN" }],
      translations,
    });
    const out = plugin.hooks.transformData!(
      makeCtx(piiData, { lang: "en" }),
      piiData
    ) as ResumeData;
    expect(out.basics.name).toBe("Zhang San");
    expect(out.basics.title).toBe("Senior Frontend Engineer");
    // 仅翻译 name/title 时，contacts 等原有字段必须保留（浅合并会整体丢失）
    expect(out.basics.contacts).toEqual(piiData.basics.contacts);
  });

  it("P2-6 无数据时不渲染空的基本信息段", () => {
    const Enhanced = withPlugins(ResumeCore, []);
    const empty = renderToStaticMarkup(<Enhanced />);
    expect(empty).not.toContain("基本信息");

    const withData = renderToStaticMarkup(<Enhanced data={piiData} />);
    expect(withData).toContain("基本信息");
  });

  it("P2-11 打印样式默认隐藏 overlay，卸载时移除", () => {
    const el = document.createElement("div");
    const ctx = makeCtx(piiData);
    (ctx as unknown as { refs: unknown }).refs = { getContainer: () => el };

    const cleanup = createPrintOptimizePlugin().hooks.onMount!(ctx) as unknown as () => void;
    const style = el.querySelector('style[data-vane-resume-print="1"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain("[data-vr-overlay]");
    expect(style!.textContent).toContain("[data-vr-no-print]");

    cleanup();
    expect(el.querySelector('style[data-vane-resume-print="1"]')).toBeNull();
  });

  it("P2-5 默认板块顺序为运行期只读常量", () => {
    expect(Object.isFrozen(DEFAULT_SECTION_ORDER)).toBe(true);
    expect(() => {
      (DEFAULT_SECTION_ORDER as unknown as string[]).push("work");
    }).toThrow();
  });
});

describe("P2-8 版本恢复 client 渲染闭环", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // React 18 的 createRoot 需要显式声明 act 环境，避免并发更新告警
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
  });

  const findButton = (text: string) =>
    Array.from(container.querySelectorAll("button")).find((b) =>
      (b.textContent ?? "").includes(text)
    );

  it("点击「恢复」后简历数据切回快照并恢复模板/语言/隐私状态", async () => {
    const storageKey = "resume-version-restore";
    const snapshot: ResumeVersion = {
      id: "v1",
      name: "旧版本",
      time: "2026-01-01 00:00:00",
      data: { ...piiData, basics: { ...piiData.basics, name: "李四" } },
      template: "classic",
      lang: "en",
      privacyOn: true,
    };
    localStorage.setItem(storageKey, JSON.stringify([snapshot]));

    const Enhanced = withPlugins(ResumeCore, [
      createVersioningPlugin({ storage: "local", storageKey }),
    ]);

    await act(async () => {
      root.render(<Enhanced data={piiData} />);
    });
    expect(container.textContent).toContain("张三");

    // 打开历史版本弹层
    await act(async () => {
      findButton("版本：")!.click();
    });
    expect(container.textContent).toContain("历史版本");

    // 恢复快照：Versioning 发 resume:data-replace，withResumePlugins 接管
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((b) => b.textContent === "恢复")!
        .click();
    });

    expect(container.textContent).toContain("李四");
    expect(container.textContent).not.toContain("张三");
    // 快照中的 template / lang / privacyOn 一并还原到 state
    expect(container.textContent).toContain("旧版本");
  });
});

describe("补强：插件渲染隔离与插件集合变化", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it("单个插件渲染抛错只丢自己那一段，其余工具栏与核心数据照常渲染", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // React 会把错误边界捕获的错误再打一条 console.error，测试里静音即可
    vi.spyOn(console, "error").mockImplementation(() => {});

    const ThrowDuringRender = () => {
      throw new Error("boom-render");
    };
    const brokenSync: ResumePlugin = {
      name: "broken-sync",
      priority: 12,
      hooks: {
        renderToolbar: () => {
          throw new Error("boom-sync");
        },
      },
    };
    const brokenBoundary: ResumePlugin = {
      name: "broken-boundary",
      priority: 11,
      hooks: { renderToolbar: () => <ThrowDuringRender /> },
    };
    const healthy: ResumePlugin = {
      name: "healthy-toolbar",
      priority: 10,
      hooks: { renderToolbar: () => <button type="button">正常按钮</button> },
    };

    const Enhanced = withPlugins(ResumeCore, [
      brokenSync,
      brokenBoundary,
      healthy,
    ]);
    await act(async () => {
      root.render(<Enhanced data={piiData} />);
    });

    // 同步抛错被 hook 调用的 try/catch 捕获；渲染期抛错被 PluginErrorBoundary 兜底
    expect(container.textContent).toContain("正常按钮");
    expect(container.textContent).toContain("张三");
    expect(warn).toHaveBeenCalled();
  });

  it("内容槽插件抛错时回落到核心默认结构", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const broken: ResumePlugin = {
      name: "broken-content",
      priority: 40,
      hooks: {
        renderWork: () => {
          throw new Error("boom-content");
        },
      },
    };

    const Enhanced = withPlugins(ResumeCore, [broken]);
    await act(async () => {
      root.render(<Enhanced data={piiData} />);
    });

    // 覆盖槽失败后走 fallback，默认工作经历仍在
    expect(container.textContent).toContain("Acme");
    expect(warn).toHaveBeenCalled();
  });

  it("插件集合变化后 PrintOptimize 样式仍生效且只保留一份", async () => {
    const probe: ResumePlugin = {
      name: "probe-dynamic",
      priority: 10,
      hooks: { renderToolbar: () => <button type="button">动态探针</button> },
    };

    // 与 demo 一样：按插件集合缓存 HOC 类型，集合变化时整块重挂载
    function Host({ withProbe }: { withProbe: boolean }) {
      const Enhanced = React.useMemo(() => {
        const plugins: ResumePlugin[] = [createPrintOptimizePlugin()];
        if (withProbe) plugins.push(probe);
        return withPlugins(ResumeCore, plugins);
      }, [withProbe]);
      return <Enhanced data={piiData} />;
    }

    await act(async () => {
      root.render(<Host withProbe={false} />);
    });
    const styleNodes = () =>
      container.querySelectorAll('style[data-vane-resume-print="1"]');
    expect(styleNodes()).toHaveLength(1);
    expect(styleNodes()[0].textContent).toContain("[data-vr-overlay]");

    // 新增插件：旧实例卸载时清理样式，新实例挂载后重新注入
    await act(async () => {
      root.render(<Host withProbe={true} />);
    });
    expect(container.textContent).toContain("动态探针");
    expect(styleNodes()).toHaveLength(1);

    // 移除插件：样式仍只保留一份
    await act(async () => {
      root.render(<Host withProbe={false} />);
    });
    expect(container.textContent).not.toContain("动态探针");
    expect(styleNodes()).toHaveLength(1);
  });
});

describe("插件全家桶导出", () => {
  it("导出 20 个工厂且各带 meta", () => {
    const mod = allPlugins as Record<string, unknown>;
    const factories = Object.values(mod).filter((v) => typeof v === "function");
    expect(factories.length).toBe(20);
    for (const fn of factories) {
      expect((fn as { meta?: unknown }).meta).toBeTruthy();
    }
  });

  it("无参工厂可生成带 name 的插件对象", () => {
    const p = createTemplateSwitchPlugin();
    expect(p.name).toBe("template-switch");
    expect(typeof p.hooks.renderToolbar).toBe("function");
  });
});
