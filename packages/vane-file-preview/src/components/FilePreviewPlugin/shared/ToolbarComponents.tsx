/**
 * 插件工具栏的共享组件与样式。
 *
 * 迁移前这个文件叫 `custom-plugins/shared/ToolbarComponents.tsx`，位置对但有一处
 * 会咬人的重名：里面的文件信息组件叫 `FileInfo`，而**文件元数据类型**也叫 `FileInfo`
 * （`plugins/types.ts`）。同一个插件文件里两者都 import 时，一个在值空间、一个在类型
 * 空间，看着能过，但只要谁写一句 `import { FileInfo } from ...` 就会把组件当类型用、
 * 或者反过来 —— P3 迁移时统一把**组件**改名为 `FileMeta`，类型保持 `FileInfo`。
 *
 * 样式全部是内联对象而不是 className：插件产物不发 CSS 文件（`sideEffects:false`
 * + 不发 style.css），消费方不需要额外 import 任何样式表就能得到一致的工具栏
 * （ADR-16 D4）。
 */

import React from "react";

import { formatBytes } from "./fileHelpers";

/** 统一的工具栏尺寸与配色，插件只在此基础上加几何细节 */
export const toolbarStyles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    fontSize: 14,
    minHeight: 40,
  } as React.CSSProperties,

  fileMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#586069",
    padding: "4px 8px",
    background: "#fff",
    borderRadius: 4,
    border: "1px solid #e1e4e8",
  } as React.CSSProperties,

  button: {
    padding: "6px 12px",
    border: "1px solid #d0d7de",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    color: "#24292f",
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "all 0.2s ease",
  } as React.CSSProperties,

  buttonHover: {
    background: "#f6f8fa",
    borderColor: "#d0d7de",
  } as React.CSSProperties,

  buttonActive: {
    background: "#0969da",
    color: "#fff",
    borderColor: "#0969da",
  } as React.CSSProperties,

  buttonDisabled: {
    background: "#f6f8fa",
    color: "#8c959f",
    cursor: "not-allowed",
    borderColor: "#d0d7de",
  } as React.CSSProperties,

  iconButton: {
    padding: "6px",
    minWidth: 32,
    height: 32,
    boxSizing: "border-box",
  } as React.CSSProperties,

  separator: {
    width: 1,
    height: 20,
    background: "#d0d7de",
    margin: "0 4px",
  } as React.CSSProperties,

  progress: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#656d76",
  } as React.CSSProperties,
} as const;

// ============ 按钮 ============

export interface ToolbarButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
  icon?: string;
  title?: string;
  variant?: "default" | "icon" | "danger";
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  children,
  disabled = false,
  active = false,
  icon,
  title,
  variant = "default",
}) => {
  const baseStyle =
    variant === "icon" ? toolbarStyles.iconButton : toolbarStyles.button;
  const style = {
    ...baseStyle,
    ...(disabled ? toolbarStyles.buttonDisabled : {}),
    ...(active ? toolbarStyles.buttonActive : {}),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={style}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          Object.assign(
            e.currentTarget.style,
            baseStyle,
            toolbarStyles.buttonHover
          );
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) {
          Object.assign(e.currentTarget.style, baseStyle);
        }
      }}
    >
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      {children}
    </button>
  );
};

// ============ 文件信息 ============

export interface FileMetaProps {
  name: string;
  size?: number;
  type?: string;
  icon?: string;
}

/**
 * 工具栏左侧的文件信息块。
 *
 * 名字是 `FileMeta` 不是 `FileInfo` —— 后者已被文件元数据类型占用（见文件头注释）。
 * 字节格式化与下载触发等工具函数在 `./fileHelpers`，不在这个 UI 文件里。
 */
export const FileMeta: React.FC<FileMetaProps> = ({
  name,
  size,
  type,
  icon,
}) => {
  return (
    <div style={toolbarStyles.fileMeta}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <span style={{ fontWeight: 500 }}>{name}</span>
      {size ? (
        <span style={{ color: "#656d76" }}>({formatBytes(size)})</span>
      ) : null}
      {type && <span style={{ color: "#656d76", fontSize: 11 }}>{type}</span>}
    </div>
  );
};

// ============ 其它 ============

export const ToolbarSeparator: React.FC = () => {
  return <div style={toolbarStyles.separator} />;
};

export interface ProgressIndicatorProps {
  progress: number;
  status?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  // 默认值与包内其它文案保持一致的中文。调用方要英文自己传 status。
  status = "加载中…",
}) => {
  return (
    <div style={toolbarStyles.progress}>
      <div style={{ fontSize: 12 }}>⏳</div>
      <div>{status}</div>
      <div style={{ color: "#656d76" }}>{Math.round(progress)}%</div>
    </div>
  );
};

export interface ToolbarContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ToolbarContainer: React.FC<ToolbarContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div style={toolbarStyles.container} className={className}>
      {children}
    </div>
  );
};
