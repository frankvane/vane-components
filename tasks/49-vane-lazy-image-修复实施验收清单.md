# vane-lazy-image 修复实施验收清单

> 对应评审报告：`tasks/40-vane-lazy-image-核心功能评审.html`（4 项 P0 / 8 项 P1 / 10 项 P2）
> 实施范围：`packages/vane-lazy-image/`（源码、自定义插件、hooks、测试）
> 结论：**22 项全部修复，0 项跳过，0 项阻塞**；`test` / `typecheck` / `lint` / `build` 四条命令全部通过。

## 1. 概述

### 1.1 范围与结论

- 按报告给出的 `T01–T08` 顺序落地：先修 P0 行为缺陷，再修 P1 默认值/钩子链语义，最后批量清理 P2。
- 未改动 `packages/plugin-core`、其它包、根配置与 `tasks/40` 报告本身；未执行任何 git 命令。
- 全部 22 项均在 `packages/vane-lazy-image/` 内可修复，**无需 plugin-core 支持，无阻塞项**。
- 每项均补了能复现原缺陷的回归测试（共新增 3 个测试文件、29 条用例），本轮无「纯注释/纯类型」项。

### 1.2 修复顺序映射（T01–T08）

| 阶段 | 报告建议 | 本轮对应项 |
| --- | --- | --- |
| T01 | src 变化 → abort + RESET，守卫改为比较 src | LI-P0-1 |
| T02 | 请求身份校验（requestId / dataset）与事件归属 | LI-P0-2 |
| T03 | CDN 回退加次数上限，去掉 cache-bust | LI-P0-3 |
| T04 | SVG 占位符 sanitize / 改为安全渲染 | LI-P0-4 |
| T05 | IO 能力检测降级 + root 进依赖 + unobserve 语义拆分 | LI-P1-2 / LI-P1-3 / LI-P1-4 / LI-P2-8 |
| T06 | 空 src 出口 + 门控中止重试 + 默认 rootMargin | LI-P1-1 / LI-P1-5 / LI-P2-10 |
| T07 | FetchLoader 失败不短路、超时可配置、预设顺序 | LI-P1-6 / LI-P1-7 |
| T08 | 清理 P2（ScrollIdle / 骨架单例 / srcset / retry / 选择器 / ObserverPool） | LI-P1-8 / LI-P2-1 ~ LI-P2-9 |

### 1.3 改动文件列表

**新增（测试）**
- `packages/vane-lazy-image/test/core-loading.test.tsx`（9 条：P0-1、P0-2×2、P1-1、P1-2、P1-4、P1-5、P1-3、P2-10）
- `packages/vane-lazy-image/test/plugin-hardening.test.ts`（16 条：P0-3×2、P0-4×2、P1-6、P1-7×2、P1-8、P2-1×2、P2-2 ~ P2-6）
- `packages/vane-lazy-image/test/hooks-utils.test.tsx`（4 条：P2-7×2、P2-8、P2-9）

**新增（交付文档）**
- `tasks/49-vane-lazy-image-修复实施验收清单.md`（本文档）

**修改（源码 / 插件）**
- `src/components/LazyLoadImagePlugin/LazyLoadImageCore.tsx`
- `src/components/LazyLoadImagePlugin/ObserverPool.ts`
- `src/components/LazyLoadImagePlugin/withPlugins.tsx`
- `src/components/LazyLoadImagePlugin/constants.ts`
- `src/custom-plugins/CDNFallbackPlugin/create.ts`
- `src/custom-plugins/SvgPlaceholderPlugin/create.tsx`
- `src/custom-plugins/FetchLoaderPlugin/create.ts`
- `src/custom-plugins/CacheIDBPlugin/create.ts`
- `src/custom-plugins/CacheMemoryPlugin/create.ts`
- `src/custom-plugins/CachePrewarmPlugin/create.tsx`
- `src/custom-plugins/ScrollIdlePlugin/create.ts`
- `src/custom-plugins/FallbackImagePlugin/create.ts`
- `src/custom-plugins/AspectRatioSpacerPlugin/create.ts`
- `src/custom-plugins/BlurUpPlugin/create.ts`
- `src/custom-plugins/SkeletonPlugin/create.tsx`
- `src/custom-plugins/HoverPrefetchPlugin/create.ts`
- `src/custom-plugins/ResponsivePlugin/create.ts`
- `src/custom-plugins/RetryOnErrorPlugin/create.ts`
- `src/presets/performance-first/index.ts`
- `src/hooks/useLCPPreload.ts`
- `src/utils/GlobalContext.ts`

## 2. 逐项验收表

> 编号与评审报告对齐。改动位置相对 `packages/vane-lazy-image/`；测试文件名为 `core-loading.test.tsx` / `plugin-hardening.test.ts` / `hooks-utils.test.tsx`（均在 `test/` 下）。

### 2.1 P0（4 项）

| 编号 | 级别 | 问题 | 修复方案 | 改动位置（file:line） | 回归测试用例名 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| LI-P0-1 | P0 | loaded / loading 态换 `src` 被守卫直接 return，图片永远不更新 | 「正在加载」改为 `loadingRef` 守卫；`src` 变化 effect 先 abort 在途请求、递增令牌、清空重试计数并 `RESET`，再由触发 effect 重新 `startLoad`；`reload` / `reset` 同步作废旧令牌 | `src/components/LazyLoadImagePlugin/LazyLoadImageCore.tsx:315-325, 401-409, 471-506, 531-553` | `P0-1：已加载后换 src 会重置状态机并重新发起加载` | ✅ 已修复 |
| LI-P0-2 | P0 | `img` 的 `onLoad` / `onError` 不校验请求身份，旧请求事件覆盖新状态 | 每次加载分配递增 `requestId`，reducer 仅接受与当前令牌一致的结果；`img` 写 `data-lli-request` / `data-lli-src`，事件处理用 `sameImageUrl` 校验 `currentSrc` / `src` / 属性值；回退图成功后允许 `error → loaded` 并同步 `displaySrc`；`FallbackImagePlugin` 每 `src` 只回退一次 | `.../LazyLoadImageCore.tsx:34-79, 91-100, 642-653, 677-744`；`src/custom-plugins/FallbackImagePlugin/create.ts:15-30` | `P0-2：迟到 / 无关地址的事件不会把 loading 误判为成功` / `P0-2：回退图加载成功后，error 态可以转为 loaded 并同步 displaySrc` | ✅ 已修复 |
| LI-P0-3 | P0 | CDN 回退无次数上限，每次失败都改写 `img.src`，形成无限重试循环 | `maxAttempts` 默认 `bases.length + 1`（原始地址 + 每个 CDN 各一次）；达到上限返回 `false` 终止链；`cacheBust` 默认 `false`；`onSrcChange` / `onUnmount` 重置尝试计数与索引 | `src/custom-plugins/CDNFallbackPlugin/create.ts:9-14, 35-36, 54-76` | `原始 + 每个 CDN 各尝试一次后终止，且默认不追加缓存击穿参数` / `换图（onSrcChange）后尝试计数归零` | ✅ 已修复 |
| LI-P0-4 | P0 | SVG 占位符把配置字符串当 HTML 注入（唯一 XSS sink） | 新增 `sanitizeSvg`：白名单标签、移除 `on*` 属性、style 危险表达式与 URI 协议白名单；XML 解析失败时回退 `text/html` 再取 `svg`；渲染改为 `<img src="data:image/svg+xml;charset=utf-8,...">`，删除 `dangerouslySetInnerHTML` | `src/custom-plugins/SvgPlaceholderPlugin/create.tsx:26-31, 55-120, 169-175, 213` | `剥离 script / on* / javascript: 协议` / `renderOverlay 以 <img src=data:image/svg+xml> 渲染，不含 HTML 注入` | ✅ 已修复 |

### 2.2 P1（8 项）

| 编号 | 级别 | 问题 | 修复方案 | 改动位置（file:line） | 回归测试用例名 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| LI-P1-1 | P1 | 空 `src` 会永久停在 loading，没有任何出口 | `startLoad` 入口与 `onBeforeLoad` 改写后都判空，非空才进入 loading，否则清 refs 并 `RESET` 回 idle；空值不渲染 `img` | `.../LazyLoadImageCore.tsx:390-399, 439-444` | `P1-1：空 src 回到 idle 且不渲染 img，回填后恢复加载` | ✅ 已修复 |
| LI-P1-2 | P1 | 没有 `IntersectionObserver` 的环境直接抛 TypeError，无降级 | `ObserverPool.observe` 先做能力检测，不支持或构造失败时同步 `callback(true)` 并返回空清理函数（等价 eager） | `.../ObserverPool.ts:213-224, 265-274` | `P1-2：无 IntersectionObserver 环境降级为立即加载` | ✅ 已修复 |
| LI-P1-3 | P1 | 默认 `unobserveOnVisible=true`：可见即退订，leave 永不回调 | 默认改为 `false`（常量 + Core 解构默认值），保证 `isIntersecting` 可随滚动回落，leave 钩子可持续触发 | `src/components/LazyLoadImagePlugin/constants.ts:151-152`；`.../LazyLoadImageCore.tsx:196` | `默认不在可见后退订（保证 leave 事件可持续触发）` | ✅ 已修复（破坏性默认值，见 §4） |
| LI-P1-4 | P1 | `root` 变化不进 `optionsKey`，切换滚动容器后仍观察旧 `root` | `useIntersectionObserver` 显式解构 `root` 并纳入 effect 依赖；`ObserverPool` 配置键改用 root 元素稳定身份（WeakMap）而非 tag/class | `.../LazyLoadImageCore.tsx:185-207`；`.../ObserverPool.ts:196-202` | `P1-4：切换 root 滚动容器会重建观察（不同 root 生成独立 observer）` | ✅ 已修复 |
| LI-P1-5 | P1 | 门控中止后同一视口周期内不再重触发，图一直不加载 | 门控中止走 `RESET` 而非 error，并 `scheduleGateRetry`：最多 5 次、每次 300ms 递增 `gateEpoch` 重新触发加载；放行后计数清零，卸载/换图清理定时器 | `.../LazyLoadImageCore.tsx:319-325, 379-388, 453-460, 495-506, 508-520` | `P1-5：门控中止后按 300ms 延迟重试，最终进入 loading` | ✅ 已修复 |
| LI-P1-6 | P1 | FetchLoader 总是返回值 → 短路 `onLoad` 链；3s 沙箱超时又让慢图失败后二次下载 | 失败路径统一 `return undefined`（让后续插件继续）；插件声明 `timeout: 0` 关闭沙箱超时，网络超时由 `config.timeout` 负责；`onSrcChange` / `onUnmount` abort + revoke + 清 `sharedData` | `src/custom-plugins/FetchLoaderPlugin/create.ts:134, 271, 335-341, 357-358, 371-379` | `fetch 失败时 onLoad 返回 undefined，并关闭沙箱超时` | ✅ 已修复 |
| LI-P1-7 | P1 | performance-first 预设自相矛盾：缓存永不命中 + 每次成功都二次 fetch | 预设顺序改为 `CacheIDB → FetchLoader`；CacheIDB `onLoadSuccess` 优先复用 sharedData 的 blob / 本地 blob / dataURL，不再对原始 `src` 二次 `fetch`；移除 `fetchingKeys` | `src/presets/performance-first/index.ts:14-16, 27-29`；`src/custom-plugins/CacheIDBPlugin/create.ts:196-235, 276` | `performance-first 中 CacheIDB 排在 FetchLoader 之前` / `onLoadSuccess 对普通 URL 不再发起二次 fetch` | ✅ 已修复 |
| LI-P1-8 | P1 | ScrollIdle 全局表用 container 作强引用 key，cleanup 定义了却从不调用 | `ScrollIdleWatcher` 记录 `refCount + cleanup`：`acquire` 复用同容器监听，`release` 归零时执行 cleanup、清 timer、唤醒 waiters 并删除 Map 条目；`onUnmount` 精确释放本实例引用 | `src/custom-plugins/ScrollIdlePlugin/create.ts:31-33, 113-142, 163-181` | `最后一个使用方 unmount 时移除容器监听，先卸载的实例不提前释放` | ✅ 已修复 |

### 2.3 P2（10 项）

| 编号 | 级别 | 问题 | 修复方案 | 改动位置（file:line） | 回归测试用例名 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| LI-P2-1 | P2 | 默认没有占位比例（CLS）；`Core` 在 loading 阶段 `opacity:0` 导致模糊占位不可见 | AspectRatio 改在 `transformProps` 阶段写 `containerStyle.aspectRatio`（显式值优先）；BlurUp 未显式指定 `opacity` 时补 1 | `src/custom-plugins/AspectRatioSpacerPlugin/create.ts:16-33`；`src/custom-plugins/BlurUpPlugin/create.ts:34-42` | `P2-1 AspectRatioSpacer 在 transformProps 阶段写入 aspect-ratio，且尊重显式值` / `P2-1 BlurUp 未显式指定 opacity 时补 1，显式值保持` | ✅ 已修复 |
| LI-P2-2 | P2 | Skeleton 每个实例都往 DOM 插一份全局 keyframes | 抽出 `SKELETON_STYLE_ID` + `ensureSkeletonStyle()`：仅当 id 不存在时插入一份 `<style>`；覆盖层本身不再返回 `<style>` | `src/custom-plugins/SkeletonPlugin/create.tsx:13-35, 59` | `P2-2 Skeleton 全局 keyframes 只注入一次，且覆盖层本身不含 <style>` | ✅ 已修复 |
| LI-P2-3 | P2 | HoverPrefetch 的 image 目标在 `onMount` 时拿不到 `img`；preload link 只加不删 | image 目标改为延迟绑定（首次 hover 时再解析）；按 id 记录本实例插入的 link，`onUnmount` 逐个移除并解绑事件 | `src/custom-plugins/HoverPrefetchPlugin/create.ts:29-50, 116-160` | `P2-3 HoverPrefetch 插入的 preload link 在卸载时移除` | ✅ 已修复 |
| LI-P2-4 | P2 | Responsive 的 `srcset` 只在成功后补，且 `src` 已是 `blob:`，造成二次下载 | `transformProps` 首帧写入 `srcSet` / `sizes`（显式值优先）；`onLoadSuccess` 仅在非 `blob:` / `data:` 时兜底补一次 | `src/custom-plugins/ResponsivePlugin/create.ts:41-59` | `P2-4 Responsive 在 transformProps 阶段写入 srcset/sizes，成功后跳过 blob/data` | ✅ 已修复 |
| LI-P2-5 | P2 | RetryOnError 的重试计数跨 `src` 累积，定时器也不可取消 | 计数键改为 `retry-count:${src}`；定时器按 `src` 存入 Map，`onSrcChange` / `onUnmount` 逐个 `clearTimeout` | `src/custom-plugins/RetryOnErrorPlugin/create.ts:37-39, 63-73` | `P2-5 RetryOnError 计数按 src 隔离，换图后取消旧定时器` | ✅ 已修复 |
| LI-P2-6 | P2 | CacheMemory / CachePrewarm 的 `blob:` 策略互斥，预热结果永远用不上 | 缓存 Entry 支持 `string \| Blob`；预热门（CachePrewarm）只写 Blob 不创建 objectURL；读取（CacheMemory `onLoad`）命中 Blob 时才 `createObjectURL` 并回填 sharedData | `src/custom-plugins/CacheMemoryPlugin/create.ts:10-11, 123-138, 147-153`；`src/custom-plugins/CachePrewarmPlugin/create.tsx:53-59` | `P2-6 CacheMemory 缓存 Blob 并在读取时创建 objectURL` / `P2-6 CachePrewarm 预热只写 Blob，不创建 objectURL` | ✅ 已修复 |
| LI-P2-7 | P2 | useLCPPreload 把 `src` 拼进 CSS 选择器，未转义 | 不再拼接选择器：遍历 `link[rel="preload"]` 用 `new URL(src, document.baseURI).href` 比较 `link.href`，命中则复用，未命中才插入 | `src/hooks/useLCPPreload.ts:74-84, 93-95, 116` | `P2-7 含引号 / 方括号的签名 URL 也能正常插入预加载链接` / `同地址重复挂载不会插入第二条 preload，卸载后清理` | ✅ 已修复 |
| LI-P2-8 | P2 | ObserverPool 单例定时器不停；重复观察时只删掉第一个回调 | 自动清理定时器在无 observer 时 `stopAutoCleanup`，下次 `observe` 惰性重启；`unobserve` 删除该元素的全部回调并按实际移除数同步 `elementCount`（幂等、不为负） | `src/components/LazyLoadImagePlugin/ObserverPool.ts:134-178, 333-361` | `P2-8 同一元素注册两次回调，一次 unobserve 即清空全部回调与计数` | ✅ 已修复 |
| LI-P2-9 | P2 | GlobalContext 的全局监听在模块单例上永不移除 | 监听登记为 `disposeFns`；新增 `dispose()` 逆序解除并清空；`ensureInitialized()` 在 dispose 后惰性重建；导出 `disposeGlobalContext` | `src/utils/GlobalContext.ts:24-27, 44-112, 254` | `P2-9 dispose 移除 online/resize 监听，再次访问时重新注册` | ✅ 已修复 |
| LI-P2-10 | P2 | 默认 `rootMargin` 为 0px，首屏边缘图必然「先白后图」 | `INTERSECTION_OBSERVER_DEFAULTS.ROOT_MARGIN` 与 Core 解构默认值统一为 `"200px 0px"` | `src/components/LazyLoadImagePlugin/constants.ts:145-146`；`.../LazyLoadImageCore.tsx:196` | `默认 rootMargin 为 200px 提前量` | ✅ 已修复（破坏性默认值，见 §4） |

**统计：22 / 22 已修复；跳过 0；阻塞 0。**

### 2.4 测试覆盖说明（P2 例外项）

- 本轮 10 项 P2 **全部**有可执行的回归测试，不存在仅靠注释/类型声明交付的项。
- LI-P2-10 与 LI-P1-3 属默认值常量，测试直接断言 `INTERSECTION_OBSERVER_DEFAULTS`，同时 LI-P1-3 的行为由「可见后退订」默认 `false` 与 P1-4 的 root 重建用例共同约束。

## 3. 验证记录

在 `e:\react-plugin-component` 下真实执行（2026-11-01）：

| 命令 | 退出码 | 实际结果 |
| --- | --- | --- |
| `pnpm --filter vane-lazy-image test` | 0 | `Test Files 10 passed (10)`；`Tests 75 passed (75)`；`Duration 26.48s`。新增 29 条用例（core-loading 9 / plugin-hardening 16 / hooks-utils 4）全部通过；既有 46 条无回归 |
| `pnpm --filter vane-lazy-image typecheck` | 0 | `tsc --noEmit -p tsconfig.json`，无任何错误输出（`test/` 与 `demo/src` 均在 include 范围内） |
| `pnpm --filter vane-lazy-image lint` | 0 | `✖ 363 problems (0 errors, 363 warnings)`。警告为既有 `@typescript-eslint/no-explicit-any` / `no-unused-vars`（规则本身为 warn，集中在 demo 与测试）；本轮无 error 残留 |
| `pnpm --filter vane-lazy-image build` | 0 | `✓ 363 modules transformed`；`dist/chunks/LazyLoadImageCore--kHcJVj1.js 18.73 kB │ gzip 7.04 kB`；`[vite:dts] Declaration files built in 6147ms`；`✓ built in 8.46s` |

测试过程中修正的非预期现象（均已在实现中解决，非放行）：
- `useIntersectionObserver` 漏解构 `root` 却用于 effect 依赖，导致 7 条 Core 用例 `ReferenceError`；补齐解构后同时满足 LI-P1-4。
- `sanitizeSvg` 在 happy-dom 下 `image/svg+xml` 解析返回空串；增加 `text/html` 解析回退，保证清洗结果非空且跨环境可用。
- `ScrollIdle` 用例曾按「同一容器 add 两次」断言，实现为复用同一监听（引用计数 2、add 1 次）；按实现语义修正断言而非放宽。
- `CacheMemory` 用例曾新建 context 导致丢失原 `sharedData`；改为复用同一实例。
- 回退图成功后 `displaySrc` 同步为绝对 URL（`http://localhost/404.jpg`），断言改为 `toMatch(/404\.jpg$/)`，属预期行为。

## 4. 公开 API 变更与破坏性标注

| 变更 | 是否破坏性 | 迁移方式 |
| --- | --- | --- |
| 默认 `rootMargin`：`0px` → `"200px 0px"` | **是（默认值）** | 需要「严格进入视口才加载」的场景显式传 `rootMargin="0px"` |
| 默认 `unobserveOnVisible`：`true` → `false` | **是（默认值）** | 需要「可见即退订、节省观察开销」的场景显式传 `unobserveOnVisible={true}`；注意会失去 leave 回调 |
| CDN 回退默认行为：首次请求改回原始地址，且默认不追加 cache-bust 参数（原先每次失败都改写并带时间戳） | **是（行为）** | 需要强制绕过 CDN 缓存时显式传 `cacheBust: true`；需要更多尝试时显式传 `maxAttempts` |
| SvgPlaceholder 仅接受可清洗的 SVG（其余 HTML 片段会被丢弃），渲染由 `dangerouslySetInnerHTML` 改为 `data:` URL `<img>` | **是（行为）** | 传入完整 `<svg>`；如需任意富文本占位，改用自定义 `renderOverlay` 插件 |
| FetchLoader 插件声明 `timeout: 0`（关闭沙箱 3s 超时） | 否（内部语义） | 网络超时由插件自身 `config.timeout`（默认 30s）负责，调用方无需改动 |
| CacheIDB / CacheMemory / CachePrewarm 支持 Blob 缓存与 `sharedData` 复用 | 否（增量） | 无需迁移；预热结果现在可被实际读取命中 |
| `LazyLoadImageCore` 新增可选 props `aspectRatio` / `srcSet` / `sizes` | 否（增量） | 不传时行为与之前一致 |

## 5. 遗留问题与风险

| 风险 | 说明 | 影响 / 缓解 |
| --- | --- | --- |
| 门控重试是有限兜底 | 最多 5 次、每次 300ms；若 `onBeforeLoad` 永久返回 false，最终仍停在 idle 且无错误提示 | 属刻意的防抖设计；需要上报的宿主可在门控插件内自行记录/回调 |
| 事件身份校验依赖 URL 归一化 | 用 `new URL(a, document.baseURI).href` 比较；对带 hash / 重定向后 `currentSrc` 与 `src` 不一致的极端场景，仍可能出现「本可识别却被拒」 | 仅影响事件归属判定，不会误置成功；宁可保持 loading 也不展示错图 |
| `CSS` 沙箱超时与网络钩子 | FetchLoader 关闭了沙箱超时，依赖自身 `config.timeout`；若插件实现者复制了 `timeout: 0` 却未自带超时，会失去沙箱兜底 | 已在插件内保留 fetch timeout 与 AbortController；自定义插件需自行负责 |
| objectURL 生命周期 | CacheMemory 命中 Blob 时创建 objectURL，未在 TTL 淘汰时统一 revoke；FetchLoader 路径有 revoke | 长会话大图场景可能多占内存，建议宿主按需清理或后续补淘汰回收 |
| happy-dom 局限 | 测试环境 `IntersectionObserver` 存在但不触发回调、`URL.createObjectURL` 需 stub | 用例通过 eager 模式 / 手动派发事件 / stub 覆盖，非真实浏览器行为 |

## 6. 未覆盖范围

- 未做真实浏览器 / 移动端 E2E（现有为 happy-dom 下的组件挂载、事件派发与插件钩子直调）。
- 未在 Next.js RSC / hydration 环境实测；SSR 阶段不执行 effect，本轮只保证无 IO 环境客户端降级。
- 未对 demo 页面做视觉回归或样式调整（改动集中在逻辑与安全，demo 仅间接受益于默认值变化）。
- 未改动 `packages/plugin-core`，因此未引入内核级「请求令牌 / 取消协议」；本轮在领域壳层内自洽实现。
- 未对其它 `vane-*` 包做同类问题排查与修复（超出本次范围）。
