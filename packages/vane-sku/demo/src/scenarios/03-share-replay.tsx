import React from "react";
import { createSkuSelector } from "vane-sku";
import { createStatePersistencePlugin } from "vane-sku/custom-plugins/StatePersistence";
import { createUrlSyncPlugin } from "vane-sku/custom-plugins/UrlSync";
import type { ScenarioMeta } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

/**
 * 03 · 分享还原选择（对标拼多多的分享链接）
 *
 * 两条恢复通道同时在场：
 *  - UrlSync —— 选择写进查询串（?sku_颜色=red），把链接发出去，
 *    对方打开就是你在选的规格；
 *  - StatePersistence —— 本机 localStorage 记住上次的选择，
 *    刷新 / 回访接着选。
 * 两者都不渲染 UI，页面演示用的「重挂载还原」按钮就是模拟一次回访。
 */
export const meta: ScenarioMeta = {
  id: "share-replay",
  title: "分享还原选择",
  group: "状态恢复",
  ref: { label: "拼多多", url: "https://mobile.yangkeduo.com" },
  pain: "分享出去的链接原样还原选择，本机还记住上次",
  plugs: [
    { fn: "createUrlSyncPlugin", why: "选择 ↔ 查询串双向同步：分享链接即还原，清空自动删参" },
    { fn: "createStatePersistencePlugin", why: "本机记忆：localStorage 存上次选择，回访接着选" },
  ],
  props: ['defaultSelection={{ 颜色: "red", 尺码: "s" }}'],
  note: "两个插件都不渲染 UI、互不感知，靠内核 state 汇流。点「重挂载还原」= 模拟对方打开你分享的链接 + 你自己回访。",
};

// 组件类型必须在模块级创建（渲染函数里每次调用都会造出新类型 → 重挂载 → 选择态丢失）
const Sku = createSkuSelector([
  createUrlSyncPlugin(),
  createStatePersistencePlugin(),
]);

export default function ShareReplayScenario() {
  const [nonce, setNonce] = React.useState(0);
  const [search, setSearch] = React.useState(() =>
    typeof window === "undefined" ? "" : window.location.search
  );

  return (
    <div
      className="sku-card"
      style={{
        maxWidth: 420,
        margin: "0 auto",
        background: "#fff",
        padding: 16,
        borderRadius: 3,
        color: "#1f2328",
      }}
    >
      {/* key 变化 → 整棵重挂载 → UrlSync / StatePersistence 的 onMount 重新走一遍恢复流程 */}
      <Sku
        key={nonce}
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
        onChange={() => {
          // UrlSync 用 replaceState 写地址栏，等它落盘后再读（只读展示，不改参数）
          window.setTimeout(() => setSearch(window.location.search), 0);
        }}
      />
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: 11.5,
          color: "#57606a",
        }}
      >
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            borderRadius: 4,
            border: "1px solid #d0d4da",
            background: "#fff",
            color: "#1f2328",
            cursor: "pointer",
          }}
        >
          重挂载还原
        </button>
        <code style={{ fontFamily: "var(--ff-mono)", wordBreak: "break-all" }}>
          location.search = {search || "(空)"}
        </code>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "#57606a" }}>
        改一下规格：地址栏出现 ?sku_…；把这段链接复制给别人，他打开就是你选的组合。
      </p>
    </div>
  );
}
