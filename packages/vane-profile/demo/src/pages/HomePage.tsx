import React from "react";
import { Link } from "react-router-dom";
import { ProfileCore, withPlugins, useProfileContext } from "vane-profile";
import {
  createBannerSlotPlugin,
  createStatRowPlugin,
  createTabSyncPlugin,
  createVerifyBadgePlugin,
  createFollowEchoPlugin,
  createBioSlotPlugin,
  createSocialLinksPlugin,
  createTagListPlugin,
  createWorksGridPlugin,
} from "vane-profile/custom-plugins";
import { CodeBlock } from "../components/CodeBlock";
import {
  AVATAR,
  SAMPLE_USER,
  TAB_CONTENT,
  SAMPLE_LINKS,
  SAMPLE_TAGS,
  SAMPLE_WORKS,
} from "../data/sample";
import { SCENARIOS } from "../scenarios/catalog";
import { PLUGINS } from "../data/plugins";
import { DEMOS, DEMO_PLUGINS } from "../demos/registry";

function ProfileContent() {
  const ctx = useProfileContext();
  const tab = ctx?.activeTab ?? "works";
  return (
    <div style={{ minHeight: 120, fontSize: 14, lineHeight: 1.85, color: "#cfd3c4" }}>
      <b style={{ color: "#e9ecdf" }}>{tab}</b> —— {TAB_CONTENT[tab]}
    </div>
  );
}

const TABS = [
  { id: "works", label: "作品" },
  { id: "feeds", label: "动态" },
  { id: "about", label: "关于" },
];

const HeroProfile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({
    gradient: ["#6a11cb", "#2575fc"],
    avatar: AVATAR,
    avatarRound: true,
    height: 150,
    overlay: <strong>{SAMPLE_USER.name}</strong>,
  }),
  createBioSlotPlugin({
    name: SAMPLE_USER.name,
    subtitle: "前端工程师 · 组件库作者",
    bio: SAMPLE_USER.bio,
    location: "上海",
    joinDate: "2021 加入",
  }),
  createStatRowPlugin({ items: SAMPLE_USER.stats }),
  createSocialLinksPlugin({ links: SAMPLE_LINKS }),
  createTagListPlugin({ tags: SAMPLE_TAGS }),
  createTabSyncPlugin({ tabs: TABS }),
  createVerifyBadgePlugin({ type: "personal" }),
  createFollowEchoPlugin({ size: "md" }),
  createWorksGridPlugin({ items: SAMPLE_WORKS, columns: 3, title: "精选作品", tab: "works" }),
]);

const QUICK_START = `import { ProfileCore, withPlugins } from "vane-profile";
import {
  createBannerSlotPlugin,
  createStatRowPlugin,
  createTabSyncPlugin,
} from "vane-profile/custom-plugins";

// 1. 装配：一个组件类型，模块顶层调一次
const Profile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({ avatar: user.avatar, overlay: <strong>{user.name}</strong> }),
  createStatRowPlugin({ items: user.stats }),
  createTabSyncPlugin({ tabs: [{ id: "works", label: "作品" }] }),
]);

// 2. 使用：和普通组件一样
export function UserPage({ user }: { user: User }) {
  return (
    <Profile verified={user.verified} stats={user.stats} banner={<span>@{user.handle}</span>}>
      <ProfileContent /> {/* 内部 useProfileContext().activeTab 决定渲染哪段 */}
    </Profile>
  );
}`;

const FEATURES = [
  ["Core 只做三段式", "头图区 / 简介区 / 数据行+关注 / 页签栏 / 内容区，布局与生命周期转发全在 Core"],
  ["能力都是插件", "16 个官方插件各管一块，不想付的代价不装"],
  ["领域槽不污染 Core", "16 个官方插件覆盖 7 个领域槽（头图/简介/数据/页签/徽标/关注/内容），按 priority 串联"],
  ["TabSync 是交互中枢", "点击切 tab → 内容区经 useProfileContext 自动重渲染，无需插件关心内容"],
  ["内容区插件接管", "WorksGrid / AchievementWall 走 renderContentArea，有内容插件时 Core 以它替代 children"],
  ["关注态受控", "FollowEcho 点击只作乐观 UI，真相回写 props，不把状态塞进 Core"],
  ["插件可单测", "16 个插件都能在 happy-dom 里直接调钩子断言"],
];

const NOTES = [
  ["装配一次", "withPlugins 放模块顶层（纯配置）或 useMemo（钩子要读闭包）。每次渲染都调会造出新组件类型，React 直接卸载重建。"],
  ["一插件一职责", "头图 / 简介 / 数据 / 社交 / 标签 / 页签 / 认证 / 关注 / 作品 / 会员 / 分享 / 直播 / 联系 / 私信 / 成就 / 活跃，16 个插件按 priority 串联，互不覆盖。"],
  ["子路径不进根入口", "官方插件走 vane-profile/custom-plugins/<Name>，根入口只含 Core + 装配器（≤3.5KB gzip）。"],
];

export function HomePage() {
  const stats = [
    { k: `${PLUGINS.length}`, v: "领域插件", s: `${PLUGINS.length} 块 · 按 priority 串联` },
    { k: `${SCENARIOS.length}`, v: "组合场景", s: "每卡两份可复制源码" },
    { k: `${DEMOS.length}`, v: "逐项示例", s: "一插件一页 · 参数可拖" },
    { k: "8", v: "领域钩子", s: "7 渲染槽 + onTabChange" },
  ];

  return (
    <div>
      <div className="masthead">
        <b>specimen № 03</b>
        <s aria-hidden />
        <span>profile · plugin-composed</span>
        <s aria-hidden />
        <span>
          {PLUGINS.length} plugins / {SCENARIOS.length} plates
        </span>
      </div>

      <section className="hero">
        <h1>
          个人主页本身很简单，
          <em>难的是它旁边那一堆需求。</em>
        </h1>

        <div className="hero-copy">
          <p className="lede">
            头图、数据行、页签、认证、关注 —— 这些不该揉进一个 800 行的组件里。vane-profile 把它们拆成{" "}
            <b>{PLUGINS.length} 个领域插件</b>，Core 只负责「三段式布局 + 生命周期转发」。
          </p>
          <ul className="feature-list">
            {FEATURES.map(([title, desc], i) => (
              <li key={title}>
                <em aria-hidden>{String(i + 1).padStart(2, "0")}</em>
                <div>
                  <b>{title}</b>
                  <span>{desc}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="hero-links">
            <Link to={`/demo/${DEMOS[0].meta.slug}`}>从「头图示例」开始</Link>
            <Link to="/scenarios">看 {SCENARIOS.length} 个真实版式</Link>
          </p>
        </div>

          <figure className="plate hero-demo">
          <figcaption className="plate-cap">
            <b>plate 00</b>
            <span>{PLUGINS.length} plugins · composed</span>
            <em>live</em>
          </figcaption>
          <div className="plate-ruler" aria-hidden />
          <div className="plate-body">
            <HeroProfile
              containerStyle={{ maxWidth: 460, margin: "0 auto" }}
              stats={SAMPLE_USER.stats}
              verified
              badgeType="personal"
              followState="none"
              banner={<span>@{SAMPLE_USER.handle}</span>}
              defaultActiveTab="works"
            >
              <ProfileContent />
            </HeroProfile>
          </div>
        </figure>
      </section>

      <section className="ledger" aria-label="项目规模">
        {stats.map((s) => (
          <div key={s.v}>
            <b>{s.k}</b>
            <span>{s.v}</span>
            <em>{s.s}</em>
          </div>
        ))}
      </section>

      <section className="two-col">
        <div>
          <div className="section-head">
            <h2>五分钟上手</h2>
            <code>2 steps</code>
          </div>
          <p>
            两步：装配成组件类型，然后当普通组件用。所有行为都来自插件，Core 的 props
            只有布局相关的那几个（stats / verified / followState / banner / defaultActiveTab）。
          </p>
          <ul className="notes">
            {NOTES.map(([t, d], i) => (
              <li key={t}>
                <em aria-hidden>{String(i + 1).padStart(2, "0")}</em>
                <span>
                  <b>{t}</b> —— {d}
                </span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 14 }}>
            想逐个插件看效果，走{" "}
            <Link to={`/demo/${DEMOS[0].meta.slug}`}>逐项示例</Link>（{DEMO_PLUGINS.length} /{" "}
            {PLUGINS.length} 个插件各有一页，另有 ref / 事件 / 基础 props 页）。
          </p>
        </div>
        <CodeBlock code={QUICK_START} title="user-page.tsx" collapseAfter={0} maxHeight={520} />
      </section>

      <section>
        <div className="section-head">
          <h2>目录</h2>
          <code>contents</code>
        </div>
        <div className="index-list">
          <Link className="index-row" to="/plugins">
            <em>02</em>
            <span>
              <strong>插件工坊</strong>
              <span>勾选 {PLUGINS.length} 个插件，实时看效果并生成装配代码</span>
            </span>
            <i aria-hidden>→</i>
          </Link>
          <Link className="index-row" to="/scenarios">
            <em>03</em>
            <span>
              <strong>场景示例</strong>
              <span>{SCENARIOS.length} 个真实版式（社交主页 / 创作者），每卡带可复制的完整源码</span>
            </span>
            <i aria-hidden>→</i>
          </Link>
          <Link className="index-row" to={`/demo/${DEMOS[0].meta.slug}`}>
            <em>04</em>
            <span>
              <strong>逐项示例</strong>
              <span>{DEMOS.length} 页：一插件一页，带参数控件与随参数变化的装配代码</span>
            </span>
            <i aria-hidden>→</i>
          </Link>
        </div>
      </section>
    </div>
  );
}
