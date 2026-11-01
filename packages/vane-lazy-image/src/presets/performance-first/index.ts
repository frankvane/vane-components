/**
 * 配方：性能优先（performance-first）
 *
 * 场景：首屏性能敏感页面（落地页/活动页），把加载链路的每一环都压到极限。
 * 组合思路：
 *   - CacheIDB：IndexedDB 持久缓存，命中直接返回 objectURL（零网络请求）；
 *   - FetchLoader：未命中缓存时 fetch 流式加载，带进度/超时/退避重试/请求去重，
 *     并把 blob 写入 sharedData 供 CacheIDB 落库；
 *   - ConcurrencyControl：限制并发，避免带宽挤占关键资源；
 *   - Preconnect：提前与图片域名建连，省掉 DNS/TCP/TLS 耗时；
 *   - DecodeAfterIdle：空闲时解码，不阻塞主线程交互；
 *   - DataSaver：用户开启省流时自动降质（否则不干预）。
 *
 * P1-7：CacheIDB 必须排在 FetchLoader 之前 —— 钩子链在第一个返回非 undefined
 * 的插件处短路，顺序颠倒会让缓存永不命中。
 *
 * 用法：withPlugins(LazyLoadImageCore, performanceFirstPreset())
 */
import { createFetchLoaderPlugin } from "../../custom-plugins/FetchLoaderPlugin";
import { createIDBCachePlugin } from "../../custom-plugins/CacheIDBPlugin";
import { createConcurrencyControlPlugin } from "../../custom-plugins/ConcurrencyControlPlugin";
import { createPreconnectPlugin } from "../../custom-plugins/PreconnectPlugin";
import { createDecodeAfterIdlePlugin } from "../../custom-plugins/DecodeAfterIdlePlugin";
import { createDataSaverPlugin } from "../../custom-plugins/DataSaverPlugin";
import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

export const performanceFirstPreset = (): LazyImagePlugin[] => [
  createIDBCachePlugin(),
  createFetchLoaderPlugin(),
  createConcurrencyControlPlugin(),
  createPreconnectPlugin(),
  createDecodeAfterIdlePlugin(),
  createDataSaverPlugin(),
];
