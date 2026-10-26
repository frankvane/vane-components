/**
 * dashboard · 后台看板卡片流配方
 *
 * 版式特点：卡片数量大、容器宽度会变（侧栏折叠）、需要位置记忆与快捷键。
 * 大数据量建议再开 Core 的 `virtualize`（此时不要同开 RecyclePlugin）。
 */
import { createBookmarkPlugin } from "../../custom-plugins/BookmarkPlugin";
import { createDebounceLayoutPlugin } from "../../custom-plugins/DebounceLayoutPlugin";
import { createRecyclePlugin } from "../../custom-plugins/RecyclePlugin";
import { createStatePersistencePlugin } from "../../custom-plugins/StatePersistencePlugin";
import { createThrottlePlugin } from "../../custom-plugins/ThrottlePlugin";
import { createA11yPlugin } from "../../custom-plugins/A11yPlugin";
import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export interface DashboardPresetOptions {
  /** 滚动节流，默认 24ms */
  scrollThrottle?: number;
  /** 布局防抖，默认 200ms */
  layoutDebounce?: number;
  /** 同时保持可见的项数，默认 60 */
  poolSize?: number;
  /** 持久化键名前缀，默认 dashboard */
  storageKey?: string;
}

export function dashboardPreset(options: DashboardPresetOptions = {}): WaterfallPlugin[] {
  const {
    scrollThrottle = 24,
    layoutDebounce = 200,
    poolSize = 60,
    storageKey = "dashboard",
  } = options;

  return [
    createThrottlePlugin({ scroll: scrollThrottle, resize: layoutDebounce }),
    createDebounceLayoutPlugin({ delay: layoutDebounce }),
    createRecyclePlugin({ poolSize }),
    createStatePersistencePlugin({ storageKey: `${storageKey}-state` }),
    createBookmarkPlugin({ storageKey: `${storageKey}-bookmark` }),
    createA11yPlugin(),
  ];
}
