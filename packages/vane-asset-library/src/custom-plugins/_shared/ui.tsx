/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";

/**
 * 官方插件共用的小控件。
 *
 * 只收敛「每个插件本来都要写一遍」的三样东西：chip / badge / 卡片角标容器。
 * 业务逻辑一律留在各自插件里 —— 这里放多了就又变成一份私有内核。
 *
 * 目录以 `_` 开头，门禁的结构扫描（A2/A3/A6）会跳过它，不会被当成插件。
 */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean };

export function Chip({ active, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx("vc-asset-chip", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type BadgeProps = {
  tone?: "warn" | "danger" | "good";
  className?: string;
  children: React.ReactNode;
  title?: string;
};

export function Badge({ tone, className, children, title }: BadgeProps) {
  return (
    <span className={cx("vc-asset-badge", className)} data-tone={tone} title={title}>
      {children}
    </span>
  );
}

type CornerProps = {
  align?: "start" | "end" | "bottom" | "bottom-start";
  children: React.ReactNode;
};

/** 卡片媒体区角标容器：start=左上，end=右上，bottom=右下，bottom-start=左下 */
export function CardCorner({ align = "end", children }: CornerProps) {
  return (
    <div className="vc-asset-card__overlay" data-align={align}>
      {children}
    </div>
  );
}

/** 覆盖层里的可点元素必须阻断冒泡，否则点角标会连带触发卡片选中 */
export function stop(event: React.SyntheticEvent): void {
  event.stopPropagation();
  event.preventDefault();
}
