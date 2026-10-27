/**
 * D05 · 数据导入（CSV 列映射）
 *
 * 真实痛点是「导入前得先看清表头对不对」：左边要能滚动看全表（含异常值），
 * 右边把列映射到业务字段。预览在这里不是装饰 —— 用户是靠它决定「第 3 列到底是
 * 部门还是评分」的，所以表格必须真的可读、编码不能乱。
 *
 * 表头是从文件里真读出来的（fetch → 首行 split），不是写死的数组：
 * 写死的话换个分隔符就整页错位，而这正是 CSV 最常见的坑。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createCsvPreviewPlugin } from "vane-file-preview/custom-plugins";
import { formatBytes } from "../lib/format";
import { getSample } from "../data/samples";
import type { ScenarioMeta } from "./types";

const Preview = withPlugins(FilePreviewCore, { plugins: [createCsvPreviewPlugin()] });

const CSV = getSample("sample-data.csv");

/** 业务侧要接的字段 */
const FIELDS = [
  { key: "name", label: "姓名", required: true },
  { key: "dept", label: "部门", required: true },
  { key: "score", label: "评分", required: true },
  { key: "note", label: "备注", required: false },
];

export const meta: ScenarioMeta = {
  code: "D05",
  title: "数据导入 · 列映射",
  pain: "导入前必须先看清表头与异常值：表格要能滚、编码不能乱，用户才能判断「第 3 列是部门还是评分」。映射错了后面全错。",
  plugs: [
    { fn: "createCsvPreviewPlugin", why: "编码（GB18030）与分隔符自动识别，表格可搜索/排序" },
  ],
  note: "表头是从文件首行真读出来的，不是写死的数组 —— 写死的话换个分隔符就整页错位，而这恰好是 CSV 最常见的坑。",
};

const ImportScenario: React.FC = () => {
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [imported, setImported] = React.useState<number | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetch(CSV.url)
      .then((r) => r.text())
      .then((text) => {
        if (!alive) return;
        const first = text.split(/\r?\n/)[0] ?? "";
        const cols = first.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        setHeaders(cols);
        // 默认按顺序对上前 N 个字段，剩下的留空
        const next: Record<string, string> = {};
        FIELDS.forEach((f, i) => {
          if (cols[i]) next[f.key] = cols[i];
        });
        setMapping(next);
      })
      .catch(() => alive && setHeaders([]));
    return () => {
      alive = false;
    };
  }, []);

  const mapped = FIELDS.filter((f) => mapping[f.key]).length;
  const ready = FIELDS.every((f) => !f.required || mapping[f.key]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 250px", gap: 10 }}>
      <div className="stage-shell" style={{ height: 360 }}>
        <div className="filebar">
          <span className="filebar-label">source</span>
          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "rgba(28,26,23,0.6)" }}>
            {CSV.name} · {formatBytes(CSV.size)}
          </span>
        </div>
        <div className="stage-mount">
          <Preview file={CSV} containerStyle={{ width: "100%", height: "100%" }} />
        </div>
        <div className="stage-foot">
          <span className="dot is-loaded" aria-hidden="true" />
          <span>{headers.length} 列</span>
          <span style={{ marginLeft: "auto" }}>
            {mapped}/{FIELDS.length} 已映射
          </span>
        </div>
      </div>

      <div className="demo-side-block" style={{ background: "var(--surface)" }}>
        <div className="side-head">
          字段映射
          <b>{ready ? "可以导入" : "缺必填"}</b>
        </div>
        <div style={{ padding: "6px 10px 10px" }}>
          {FIELDS.map((f) => (
            <div className="map-row" key={f.key} style={{ gridTemplateColumns: "1fr 14px 1fr" }}>
              <b>
                {f.label}
                {f.required ? " *" : ""}
              </b>
              <span style={{ textAlign: "center" }}>←</span>
              <select
                aria-label={`${f.label} 对应 CSV 列`}
                value={mapping[f.key] ?? ""}
                onChange={(e) =>
                  setMapping((prev) => {
                    const next = { ...prev };
                    if (e.target.value) next[f.key] = e.target.value;
                    else delete next[f.key];
                    return next;
                  })
                }
              >
                <option value="">（不导入）</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-mini"
              disabled={!ready}
              onClick={() => setImported(18)}
              style={!ready ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
            >
              导入
            </button>
            <span className="muted" style={{ fontSize: 11 }}>
              {imported ? `已导入 ${imported} 行` : "只读预览，不会真写库"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportScenario;
