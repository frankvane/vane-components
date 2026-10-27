import React from "react";
import type { PluginVariant } from "../data/plugin-catalog";

/**
 * 档位选择器
 *
 * 和常见「参数面板」不同：这里没有滑杆。原因是插件配置在装配时就固化了
 * （插件对象上的 config 在 render 时才读），改一个数必须换一套装配。
 * 与其假装能实时调参、实际却整棵重挂，不如把它诚实地表达成「档位」——
 * 每档是一个预生成好的组件（见 lib/previews.ts 的模块顶层常量）。
 *
 * 右侧那行小字是当前档和默认档的差别。没有它，用户切完看不出变化会以为坏了。
 */
export const VariantBar: React.FC<{
  variants: PluginVariant[];
  value: string;
  onChange: (key: string) => void;
}> = ({ variants, value, onChange }) => {
  const active = variants.find((v) => v.key === value) ?? variants[0];

  return (
    <div className="ctl-bar">
      <div
        className="scn-switch"
        role="group"
        aria-label="装配档位"
        style={{ display: "flex" }}
      >
        {variants.map((v) => (
          <button
            key={v.key}
            type="button"
            aria-pressed={v.key === active.key}
            onClick={() => onChange(v.key)}
            title={v.hint}
          >
            {v.label}
          </button>
        ))}
      </div>
      <span className="ctl-label" style={{ marginLeft: 4 }}>
        {active.hint ?? (variants.length > 1 ? "—" : "该插件只有一套默认装配")}
      </span>
    </div>
  );
};
