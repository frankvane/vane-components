/**
 * 插件沙箱：把单个插件的钩子执行隔离开。
 * - try/catch 保证一个插件报错不会打断整条钩子链
 * - 超时控制避免异步钩子（网络请求等）卡死宿主
 */

export interface SandboxOptions {
  timeout?: number;
  name?: string;
  hook?: string;
}

export async function runHookInSandbox<T>(
  fn: () => T | Promise<T>,
  options: SandboxOptions = {}
): Promise<T> {
  const { timeout = 3000, name = "anonymous", hook = "unknown" } = options;

  if (!timeout || timeout <= 0) {
    return await fn();
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutGuard = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[vane/plugin-core] 插件 ${name} 的钩子 ${hook} 超时(${timeout}ms)`));
    }, timeout);
  });

  try {
    return await Promise.race([Promise.resolve().then(fn), timeoutGuard]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
