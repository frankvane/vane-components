import type { DeviceInfo } from "../types";

let cached: DeviceInfo | null = null;

/**
 * 设备信息检测（模块级缓存 = 旧仓库 GlobalContext 的思路）。
 * 100 个组件实例只检测一次；SSR / 无 window 环境安全降级。
 */
export function detectDevice(force = false): DeviceInfo {
  if (cached && !force) return cached;

  const width = typeof window !== "undefined" ? window.innerWidth : 1024;
  const height = typeof window !== "undefined" ? window.innerHeight : 768;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";

  const isTablet = /iPad|Tablet/i.test(ua);
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0);

  cached = {
    type: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
    os: ua,
    browser: ua,
    devicePixelRatio: dpr,
    viewportWidth: width,
    viewportHeight: height,
    isTouchDevice,
    isRetina: dpr >= 2,
  };
  return cached;
}

export function resetDeviceCache() {
  cached = null;
}
