import React from "react";

interface Props {
  fallback?: (error: Error) => React.ReactNode;
  children: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

/**
 * 渲染层错误边界：插件 renderXxx 抛错时兜底，避免白屏。
 * 用法：把插槽渲染包进 <PluginErrorBoundary>。
 */
export class PluginErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn("[vane/plugin-core] 插件渲染错误已被隔离", error, info);
    this.props.onError?.(error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return this.props.fallback ? this.props.fallback(error) : null;
    }
    return this.props.children;
  }
}
