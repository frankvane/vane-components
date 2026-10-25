/**
 * 配方：性能优先（performance-first）
 *
 * 场景：首屏性能敏感页面（落地页/活动页），把加载链路的每一环都压到极限。
 * 组合思路：
 *   - FetchLoader：fetch 流式加载，带进度/超时/退避重试/请求去重；
 *   - CacheIDB：IndexedDB 持久缓存，二次访问零请求；
 *   - ConcurrencyControl：限制并发，避免带宽挤占关键资源；
 *   - Preconnect：提前与图片域名建连，省掉 DNS/TCP/TLS 耗时；
 *   - DecodeAfterIdle：空闲时解码，不阻塞主线程交互；
 *   - DataSaver：用户开启省流时自动降质（否则不干预）。
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
  createFetchLoaderPlugin(),
  createIDBCachePlugin(),
  createConcurrencyControlPlugin(),
  createPreconnectPlugin(),
  createDecodeAfterIdlePlugin(),
  createDataSaverPlugin(),
];
