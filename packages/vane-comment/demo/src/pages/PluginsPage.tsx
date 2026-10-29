/**
 * 插件工坊：勾选即装配
 *
 * 装配结果用 `useMemo` 按「勾选集合」缓存成组件类型 —— 每次渲染都调
 * withCommentPlugins 会造出新组件类型，React 直接卸载重建，等于每勾一下就整块重挂载
 * （用户刚点的赞被清空，这正是装配 API 最著名的坑位）。
 */
import React, { useCallback, useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import type { Comment, CommentNode } from "vane-comment";
import { CodeBlock } from "../components/CodeBlock";
import {
  DEFAULT_ON,
  GROUP_LABEL,
  GROUP_ORDER,
  PLUGINS,
  type PluginInfo,
} from "../data/plugins";
import { COMMENTS, MENTIONS, freshComments } from "../data/sample";

const byDir = new Map(PLUGINS.map((p) => [p.dir, p]));

function assemblyCode(selected: PluginInfo[]): string {
  if (selected.length === 0) {
    return `// 没有勾选任何插件 —— 内核仍有列表壳与状态渲染
const Comment = withCommentPlugins(CommentCore, []);`;
  }
  // import 按工厂名排序，一行一个深层子路径（照抄进真实项目不用改路径）
  const imports = [...selected]
    .sort((a, b) => a.factory.localeCompare(b.factory))
    .map((p) => `import { ${p.factory} } from "vane-comment/custom-plugins/${p.dir}";`)
    .join("\n");

  return `import { CommentCore, withCommentPlugins } from "vane-comment";
${imports}
import type { Comment } from "vane-comment";

// 执行顺序由插件自身 priority 决定，这里按分组与 priority 排列只为读起来整齐
const Comment = withCommentPlugins(CommentCore, [
${selected.map((p) => `  ${p.factory}(),  // priority ${p.priority}`).join("\n")}
]);

export function CommentZone({ comments }: { comments: Comment[] }) {
  return <Comment comments={comments} />;
}`;
}

const ME = { id: "u-me", name: "我", avatar: undefined };

export function PluginsPage() {
  const [on, setOn] = useState<Set<string>>(() => new Set(DEFAULT_ON));
  const [focus, setFocus] = useState<string>(PLUGINS[0].dir);
  const [comments, setComments] = useState<Comment[]>(() => freshComments());

  const selected = useMemo(() => PLUGINS.filter((p) => on.has(p.dir)), [on]);

  // 勾选集合变化才重建组件类型；数据用固定引用
  const key = selected.map((p) => p.dir).join("|");
  const Comment = useMemo(() => {
    const plugins = selected.map((p) => p.make());
    return withCommentPlugins(CommentCore, plugins);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const onLike = useCallback(
    (id: string) =>
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, liked: !c.liked, likeCount: (c.likeCount ?? 0) + (c.liked ? -1 : 1) }
            : c
        )
      ),
    []
  );
  const onReply = useCallback(
    (parentId: string, content: CommentNode[]) =>
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? {
                ...c,
                replies: [
                  { id: `${parentId}-r${Date.now()}`, author: ME, content, createdAt: Date.now(), likeCount: 0, liked: false },
                  ...(c.replies ?? []),
                ],
                replyCount: (c.replyCount ?? 0) + 1,
              }
            : c
        )
      ),
    []
  );
  const onSubmit = useCallback(
    (content: CommentNode[]) =>
      setComments((prev) => [
        { id: `c-${Date.now()}`, author: ME, content, createdAt: Date.now(), likeCount: 0, liked: false },
        ...prev,
      ]),
    []
  );

  const toggle = (dir: string) => {
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) next.delete(dir);
      else next.add(dir);
      return next;
    });
    setFocus(dir);
  };

  const focusPlugin = byDir.get(focus);

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">workshop · 装配台</p>
          <h2 className="page-title">插件工坊</h2>
          <p className="page-sub">
            {PLUGINS.length} 个插件按 {GROUP_ORDER.length} 组排列，勾选即装配 ——
            右侧预览是**真的**在跑这些插件，不是示意图。
          </p>
        </div>
        <div className="page-facts">
          <div>
            <b>{PLUGINS.length}</b>
            <span>plugins</span>
          </div>
          <div>
            <b>{GROUP_ORDER.length}</b>
            <span>groups</span>
          </div>
          <div>
            <b>{on.size}</b>
            <span>enabled</span>
          </div>
        </div>
      </header>

      <div className="ws">
        <aside className="ws-panel">
          <div className="ws-panel-head">
            <span>插件目录</span>
            <code>
              {on.size}/{PLUGINS.length}
            </code>
          </div>

          {GROUP_ORDER.map((group) => {
            const list = PLUGINS.filter((p) => p.group === group);
            return (
              <div className="ws-group" key={group}>
                <h4>
                  {GROUP_LABEL[group]} · {list.length}
                </h4>
                {list.map((p) => (
                  <label
                    key={p.dir}
                    className={`ws-check${focus === p.dir ? " is-focus" : ""}`}
                    title={p.summary}
                  >
                    <input
                      type="checkbox"
                      checked={on.has(p.dir)}
                      onChange={() => toggle(p.dir)}
                    />
                    <span>
                      <span className="name">
                        {p.dir}
                        <em className="prio">{p.priority}</em>
                      </span>
                      <span className="desc">{p.summary}</span>
                    </span>
                  </label>
                ))}
              </div>
            );
          })}
        </aside>

        <div>
          <div className="ws-stage plate">
            <div className="ws-stage-head">
              <span>
                已启用 <b>{selected.length}</b> 个
                {selected.length > 0
                  ? ` · ${selected.map((p) => p.dir).join(" / ")}`
                  : "（裸内核）"}
              </span>
              <span>live</span>
            </div>

            <div className="ws-scroll">
              <Comment
                comments={comments}
                defaultSortMode="newest"
                onLike={onLike}
                onReply={onReply}
                onSubmit={onSubmit}
                onReport={(id) => console.log("举报", id)}
                mentions={MENTIONS}
              />
            </div>
          </div>

          {focusPlugin ? (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="doc-head">
                <code>{focusPlugin.factory}</code>
                <span className="tag tag-accent">priority {focusPlugin.priority}</span>
                <span className="tag">{GROUP_LABEL[focusPlugin.group]}</span>
                {focusPlugin.doc.since ? (
                  <span className="tag">since {focusPlugin.doc.since}</span>
                ) : null}
              </div>
              <p className="doc-desc">{focusPlugin.doc.description}</p>

              {focusPlugin.doc.config?.length ? (
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>配置</th>
                      <th>类型</th>
                      <th>默认</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {focusPlugin.doc.config.map((c) => (
                      <tr key={c.name}>
                        <td>
                          <code>{c.name}</code>
                        </td>
                        <td>
                          <code className="dim">{c.type}</code>
                        </td>
                        <td>
                          <code className="dim">{c.default}</code>
                        </td>
                        <td>{c.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              <div className="doc-cols">
                {focusPlugin.doc.features?.length ? (
                  <div>
                    <h5>能做</h5>
                    <ul>
                      {focusPlugin.doc.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {focusPlugin.doc.useCases?.length ? (
                  <div>
                    <h5>适合</h5>
                    <ul>
                      {focusPlugin.doc.useCases.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {focusPlugin.doc.notes?.length ? (
                  <div>
                    <h5>注意</h5>
                    <ul>
                      {focusPlugin.doc.notes.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 14 }}>
            <CodeBlock code={assemblyCode(selected)} title="workshop.tsx" collapseAfter={0} maxHeight={420} />
          </div>
        </div>
      </div>
    </div>
  );
}
