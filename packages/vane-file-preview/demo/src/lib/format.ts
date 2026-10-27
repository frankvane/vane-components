/**
 * 演示站自己的格式化工具
 *
 * 不复用包内 `shared/fileHelpers`：那一层是实现细节（不在 exports 里），
 * 演示站依赖它会在包重构时断掉。这里只做展示需要的两件事。
 */

/** 字节数 → 人能读的单位。按**四舍五入之后**的值进位，否则 1048558 会显示成 "1024.0 KB" */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1023.95) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1023.95) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

/** 等宽读数里时间戳用 24 小时制，避免 AM/PM 撑宽列 */
export function stamp(): string {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

/** `application/vnd.openxmlformats-…` → `…wordprocessingml.document` 太吵，只留尾部 */
/**
 * MIME 压短。
 *
 * 关键在**保留尾部**而不是截前缀：OOXML 那三个类型的前 44 个字符完全一样
 * （`application/vnd.openxmlformats-officedocument.`），差别在尾巴上的
 * `wordprocessingml.document` / `spreadsheetml.sheet` / `presentationml.presentation`。
 * 第一版按前缀截 18 个字，结果 docx / xlsx / pptx 显示成同一个
 * `application/vnd.openxmlfor…` —— 三行长得一模一样，等于没显示。
 */
export function shortMime(type: string): string {
  if (!type) return "—";
  const slash = type.indexOf("/");
  if (slash < 0) return type;
  const major = type.slice(0, slash);
  const sub = type.slice(slash + 1);
  if (sub.length <= 22) return type;
  const parts = sub.split(".");
  if (parts.length >= 2) {
    return `${major}/…${parts.slice(-2).join(".")}`;
  }
  return `${major}/${sub.slice(0, 18)}…`;
}
