/**
 * `mammoth/mammoth.browser` 没有类型声明（npm 包只带 Node 侧的 JS）。
 *
 * 这里只声明我们用到的那个函数签名，**不是**完整的 mammoth API：
 * 完整类型请装 `@types/mammoth`（社区包，若存在）或用 `as` 断言。
 * 好处是插件里 `mammoth.convertToHtml(...)` 的参数与返回值都有类型，
 * 而不是一路 `any` 到渲染层。
 */
declare module "mammoth/mammoth.browser" {
  export interface MammothMessage {
    type: string;
    message: string;
  }

  export interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }

  export interface MammothOptions {
    /** 附带默认样式映射（标题 / 列表 / 表格）。默认 true */
    includeDefaultStyleMap?: boolean;
    /** 自定义样式映射，形如 `["p[style-name='Title'] => h1"]` */
    styleMap?: string[];
    /** 图片转换回调；不传时 mammoth 会把图片内联成 base64 */
    convertImage?: unknown;
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer } | { path: string },
    options?: MammothOptions
  ): Promise<MammothResult>;

  const mammoth: {
    convertToHtml: typeof convertToHtml;
  };

  export default mammoth;
}
