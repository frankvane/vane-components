import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import { Overlay } from "../../components/ResumePlugin/plugins/overlay";
import doc from "./doc.json";

export interface ResumeVersion {
  id: string;
  name: string;
  time: string;
  data: ResumeData;
  template?: string;
  lang?: string;
  privacyOn?: boolean;
}
export interface VersioningConfig {
  storage?: "local" | "memory";
  /** 存储键；多实例 / 多用户场景请分别指定，避免同源覆盖 */
  storageKey?: string;
  maxVersions?: number;
  /** 持久化失败回调（配额不足、隐私模式禁写等） */
  onStorageError?: (error: unknown) => void;
  /** 恢复版本回调：宿主可据此回写受控数据；未配置时由 withResumePlugins 内部接管 */
  onRestore?: (version: ResumeVersion) => void;
}

const DEFAULT_KEY = "vane-resume-versions";

export const createVersioningPlugin: ResumePluginCreator<VersioningConfig> = (config = {}) => {
  const max = config.maxVersions ?? 20;
  const storageKey = config.storageKey ?? DEFAULT_KEY;
  const storageMode = config.storage ?? "local";
  // memory 模式的实例级存储
  const memory = new Map<string, string>();

  const readRaw = (): string | null => {
    if (storageMode === "memory") return memory.get(storageKey) ?? null;
    try {
      if (typeof localStorage !== "undefined") return localStorage.getItem(storageKey);
    } catch (error) {
      config.onStorageError?.(error);
    }
    return null;
  };

  const writeRaw = (raw: string): boolean => {
    if (storageMode === "memory") {
      memory.set(storageKey, raw);
      return true;
    }
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(storageKey, raw);
        return true;
      }
    } catch (error) {
      config.onStorageError?.(error);
    }
    return false;
  };

  const load = (): ResumeVersion[] => {
    const raw = readRaw();
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ResumeVersion[];
    } catch (error) {
      config.onStorageError?.(error);
      return [];
    }
  };

  const save = (list: ResumeVersion[]): boolean => writeRaw(JSON.stringify(list));

  const persistError = (ok: boolean) =>
    ok ? null : "本地存储写入失败，版本仅当前页面有效";

  return {
    name: "versioning",
    version: "0.1.0",
    description: doc.description,
    priority: 38,
    config: { order: 38 },
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (!ctx.state.versions) {
          const versions = load();
          ctx.setState({ versions, versionView: null, versionName: "" });
        }
      },
      renderToolbar: (ctx) => (
        <button
          key="versioning-save"
          type="button"
          onClick={() => ctx.setState({ versionView: "save", versionName: `版本 ${((ctx.state.versions as ResumeVersion[]) || []).length + 1}` })}
          style={toolbarBtn(false)}
        >
          保存版本
        </button>
      ),
      renderFooter: (ctx) => {
        const versions = (ctx.state.versions as ResumeVersion[]) || [];
        const current = versions.find((v) => v.id === ctx.state.currentVersionId);
        return (
          <button
            key="versioning-foot"
            type="button"
            onClick={() => ctx.setState({ versionView: "list" })}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 12,
              color: "var(--vr-muted, #5d636a)",
              cursor: "pointer",
              textDecoration: "underline",
              font: "inherit",
            }}
          >
            版本：{current ? current.name : "未保存"}（{versions.length}）
          </button>
        );
      },
      renderOverlay: (ctx) => {
        const view = ctx.state.versionView as string | undefined;
        if (!view) return null;
        const versions = (ctx.state.versions as ResumeVersion[]) || [];
        const close = () => ctx.setState({ versionView: null });
        const errorHint = ctx.state.versionPersistError ? (
          <div style={{ color: "#cf4407", fontSize: 12, marginTop: 10 }}>
            {String(ctx.state.versionPersistError)}
          </div>
        ) : null;

        if (view === "save") {
          const name = (ctx.state.versionName as string) || "";
          const doSave = () => {
            const snap: ResumeVersion = {
              id: `v${Date.now()}`,
              name: name || `版本 ${versions.length + 1}`,
              time: new Date().toISOString().slice(0, 19).replace("T", " "),
              data: JSON.parse(JSON.stringify(ctx.data ?? {})) as ResumeData,
              template: ctx.state.template as string,
              lang: ctx.state.lang as string,
              privacyOn: !!ctx.state.privacyOn,
            };
            const next = [...versions, snap].slice(-max);
            const saved = save(next);
            ctx.shared.set("versioning:list", next);
            ctx.setState({
              versions: next,
              currentVersionId: snap.id,
              versionView: null,
              versionPersistError: persistError(saved),
            });
            ctx.bus.emit("resume:version:save", snap);
          };
          return (
            <Overlay key="versioning-modal" title="保存版本" onClose={close}>
              <input
                value={name}
                placeholder="版本名称"
                onChange={(e) => ctx.setState({ versionName: e.target.value })}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d4d8de", marginBottom: 12, boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={doSave} style={toolbarBtn(true)}>保存</button>
                <button type="button" onClick={close} style={toolbarBtn(false)}>取消</button>
              </div>
              {errorHint}
            </Overlay>
          );
        }

        // list
        const restore = (v: ResumeVersion) => {
          const patch: Record<string, unknown> = { currentVersionId: v.id, versionView: null };
          // 快照包含模板 / 语言 / 隐私态，恢复时一并还原
          if (v.template !== undefined) patch.template = v.template;
          if (v.lang !== undefined) patch.lang = v.lang;
          if (v.privacyOn !== undefined) patch.privacyOn = v.privacyOn;
          ctx.setState(patch);
          ctx.bus.emit("resume:data-replace", v);
          config.onRestore?.(v);
        };
        const del = (id: string) => {
          const next = versions.filter((x) => x.id !== id);
          const saved = save(next);
          ctx.setState({ versions: next, versionPersistError: persistError(saved) });
          ctx.bus.emit("resume:version:delete", id);
        };
        return (
          <Overlay key="versioning-modal" title={`历史版本（${versions.length}）`} onClose={close} width={380}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflow: "auto" }}>
              {versions.length === 0 && <div style={{ color: "#8a9099", fontSize: 12 }}>暂无版本</div>}
              {versions.map((v) => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{v.name}</div>
                    <div style={{ color: "#8a9099", fontSize: 11 }}>{v.time}</div>
                  </div>
                  <button type="button" onClick={() => restore(v)} style={toolbarBtn(true)}>恢复</button>
                  <button type="button" onClick={() => del(v.id)} style={toolbarBtn(false)}>删除</button>
                </div>
              ))}
            </div>
            {errorHint}
          </Overlay>
        );
      },
    },
  };
};

createVersioningPlugin.meta = doc as PluginDoc;
