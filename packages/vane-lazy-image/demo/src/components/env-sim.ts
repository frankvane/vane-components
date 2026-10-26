/**
 * 演示环境模拟（离线 / 弱网·省流量 / 低电量）
 *
 * 一批插件的能力依赖运行环境（`navigator.onLine`、`navigator.connection`、
 * `navigator.getBattery`），在示例页里天然看不到效果。这里用属性覆盖 + 事件派发
 * 模拟这些环境，不改插件代码，也不触发真实断网。
 *
 * 状态持久化到 sessionStorage：部分插件在挂载时读取环境（而非监听变化），
 * 因此刷新后仍能保持模拟状态，便于验收。
 */
const KEY = "vane-demo-env";

export interface EnvState {
  offline: boolean;
  slow: boolean; // 弱网 + saveData
  battery: boolean; // 低电量
}

export const DEFAULT_ENV: EnvState = { offline: false, slow: false, battery: false };

export function readEnv(): EnvState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_ENV };
    const o = JSON.parse(raw);
    return {
      offline: !!o.offline,
      slow: !!o.slow,
      battery: !!o.battery,
    };
  } catch {
    return { ...DEFAULT_ENV };
  }
}

export function writeEnv(e: EnvState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(e));
  } catch {
    /* ignore */
  }
}

export function isEnvActive(e: EnvState = readEnv()): boolean {
  return e.offline || e.slow || e.battery;
}

/**
 * 进程内共享的环境状态。
 * 观察台的勾选框与预览区的「一键演示」按钮都要改环境，若各自 useState，
 * 点了演示按钮勾选框不会同步。这里放一份带订阅的中心状态，
 * 任何一处写入都会立即 apply 到 navigator 并通知所有订阅者。
 */
let currentEnv: EnvState | null = null;
const envListeners = new Set<(e: EnvState) => void>();

export function getEnvState(): EnvState {
  if (!currentEnv) currentEnv = readEnv();
  return currentEnv;
}

export function setEnvState(next: EnvState) {
  currentEnv = { ...next };
  writeEnv(currentEnv);
  applyEnv(currentEnv);
  envListeners.forEach((fn) => {
    try {
      fn(currentEnv as EnvState);
    } catch {
      /* ignore */
    }
  });
}

export function subscribeEnv(fn: (e: EnvState) => void): () => void {
  envListeners.add(fn);
  return () => {
    envListeners.delete(fn);
  };
}

export function applyEnv(e: EnvState) {
  // 离线
  try {
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => !e.offline });
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new Event(e.offline ? "offline" : "online"));
  } catch {
    /* ignore */
  }

  // 弱网 / 省流量
  try {
    const type = e.slow ? "2g" : "4g";
    const conn: any = (navigator as any).connection;
    const patch = (target: any) => {
      Object.defineProperty(target, "effectiveType", { configurable: true, get: () => type });
      Object.defineProperty(target, "saveData", { configurable: true, get: () => e.slow });
      Object.defineProperty(target, "downlink", { configurable: true, get: () => (e.slow ? 0.3 : 10) });
      Object.defineProperty(target, "rtt", { configurable: true, get: () => (e.slow ? 900 : 50) });
      return target;
    };
    if (conn) {
      patch(conn);
      try {
        conn.dispatchEvent(new Event("change"));
      } catch {
        /* ignore */
      }
    } else {
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: patch({
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent() {
            return true;
          },
        }),
      });
    }
  } catch {
    /* ignore */
  }

  // 低电量
  try {
    (navigator as any).getBattery = () =>
      Promise.resolve({
        level: e.battery ? 0.08 : 0.92,
        charging: !e.battery,
        chargingTime: e.battery ? Infinity : 0,
        dischargingTime: e.battery ? 900 : Infinity,
        addEventListener() {},
        removeEventListener() {},
      });
  } catch {
    /* ignore */
  }

  // 设备内存（内存压力类插件读它）
  try {
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => (e.battery ? 1 : 8) });
  } catch {
    /* ignore */
  }
}

export function applyEnvFromStorage() {
  const e = readEnv();
  if (isEnvActive(e)) applyEnv(e);
}
