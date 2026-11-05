import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface DecodeAfterIdleConfig {
  enabled?: boolean;
  timeoutMs?: number;
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => void;
};

const ric: (cb: () => void, opts?: { timeout?: number }) => void =
  typeof window !== "undefined" && (window as IdleWindow).requestIdleCallback
    ? (window as IdleWindow).requestIdleCallback!
    : (cb: () => void, opts?: { timeout?: number }) => {
        setTimeout(cb, opts?.timeout ?? 0);
      };

export function createDecodeAfterIdlePlugin(
  config: DecodeAfterIdleConfig = {}
): LazyImagePlugin {
  const { enabled = true, timeoutMs = 600 } = config;

  return {
    name: "decode-after-idle",
    version: "1.0.0",
    config,
    hooks: {
      onLoadSuccess: (context) => {
        if (!enabled) return;
        const img = context.imageRef?.current as HTMLImageElement | null;
        if (!img || !img.decode) return;
        ric(async () => {
          try {
            await img.decode();
          } catch {
            // ignore decode errors
          }
        }, { timeout: timeoutMs });
      },
      transformProps: (props) => ({
        ...props,
        decoding: "async" as const,
      }),
    },
  } as LazyImagePlugin;
}