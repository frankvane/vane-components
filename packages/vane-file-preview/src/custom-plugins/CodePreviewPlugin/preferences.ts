/**
 * 代码预览的用户偏好（主题 / 行号 / 换行 / 每个文件的语言）。
 *
 * ## 迁移时改的两件事
 *
 * 1. **键加前缀，并可关闭。** 迁移前的键是 `codePreviewPlugin_preferences` 与
 *    `codePreviewPlugin_preferences_language_<文件名>` —— 无前缀、无命名空间，
 *    宿主页面里出现任何同名键都会互相覆盖；而且**没有开关**，一个只读的文件预览
 *    组件在用户浏览器上静默写 localStorage，属于「未经允许的持久化」。
 *    现在统一 `vane-file-preview:` 前缀，且 `storage: false` 时完全不碰 localStorage。
 *
 * 2. **语言偏好按文件名存是错的，改成按扩展名。** 迁移前 `_language_<完整文件名>`：
 *    用户给 `a.ts` 选了 typescript，打开 `b.ts` 又要重选一遍，而 localStorage 会
 *    随着用户看过的文件数无限增长。按扩展名存既符合直觉，条数也有上界。
 *
 * ## 为什么不用 sessionStorage / cookie
 * 这些偏好就是「下次还这么看」，session 语义不对；cookie 会跟着每次请求发出去。
 */

const PREFIX = "vane-file-preview:";
const KEY_PREFS = `${PREFIX}code:prefs`;
const KEY_LANGUAGE_PREFIX = `${PREFIX}code:language:`;

export type CodeThemePreference = "auto" | "light" | "dark";

export interface CodePreferences {
  theme?: CodeThemePreference;
  showLineNumbers?: boolean;
  wrapLongLines?: boolean;
}

export interface LanguagePreference {
  /** 扩展名（小写、带点），例如 `.ts` */
  extension: string;
  language: string;
}

/** `storage: false` 时所有读写都是空操作 */
export interface PreferenceStore {
  read: () => CodePreferences;
  write: (patch: CodePreferences) => void;
  readLanguage: (extension: string) => string | undefined;
  writeLanguage: (extension: string, language: string) => void;
}

const noopStore: PreferenceStore = {
  read: () => ({}),
  write: () => {},
  readLanguage: () => undefined,
  writeLanguage: () => {},
};

/**
 * 读一次偏好。
 *
 * localStorage 在三种真实场景里会抛异常（Safari 无痕、跨域 iframe、
 * 配额写满），所以每次访问都包 try/catch —— 读失败就当没有偏好，
 * 写失败就静默放弃。**偏好存不下不该让预览崩掉。**
 */
function readPrefs(): CodePreferences {
  try {
    if (typeof window === "undefined" || !window.localStorage) return {};
    const raw = window.localStorage.getItem(KEY_PREFS);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    // 存进去的可能是任何东西（用户手改、旧版本、别的库同名键），
    // 逐字段校验，不信任 JSON.parse 的结果
    if (!parsed || typeof parsed !== "object") return {};
    const p = parsed as Record<string, unknown>;
    const out: CodePreferences = {};
    if (p.theme === "auto" || p.theme === "light" || p.theme === "dark") {
      out.theme = p.theme;
    }
    if (typeof p.showLineNumbers === "boolean") {
      out.showLineNumbers = p.showLineNumbers;
    }
    if (typeof p.wrapLongLines === "boolean") {
      out.wrapLongLines = p.wrapLongLines;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * 创建偏好存储。
 *
 * `enabled: false` 时返回一个全空操作的实现 —— 宿主页面有权要求
 * 「别在我这儿写 localStorage」，这必须是配置项而不是「文档里提一句」。
 */
export function createPreferenceStore(enabled: boolean): PreferenceStore {
  if (!enabled) return noopStore;

  const canUseStorage = (): boolean => {
    try {
      return typeof window !== "undefined" && !!window.localStorage;
    } catch {
      return false;
    }
  };

  return {
    read: readPrefs,

    write: (patch) => {
      if (!canUseStorage()) return;
      try {
        const merged = { ...readPrefs(), ...patch };
        window.localStorage.setItem(KEY_PREFS, JSON.stringify(merged));
      } catch {
        // 配额满 / 无痕模式：放弃持久化，不影响本次浏览
      }
    },

    readLanguage: (extension) => {
      if (!canUseStorage() || !extension) return undefined;
      try {
        return (
          window.localStorage.getItem(
            `${KEY_LANGUAGE_PREFIX}${extension.toLowerCase()}`
          ) ?? undefined
        );
      } catch {
        return undefined;
      }
    },

    writeLanguage: (extension, language) => {
      if (!canUseStorage() || !extension) return;
      try {
        window.localStorage.setItem(
          `${KEY_LANGUAGE_PREFIX}${extension.toLowerCase()}`,
          language
        );
      } catch {
        // 同上
      }
    },
  };
}
