import React, { useRef, useState } from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  CommentNode,
} from "../../components/CommentPlugin/plugins/types";
import { renderCommentContent } from "../../components/CommentPlugin/content";
import doc from "./doc.json";

export interface RichComposerConfig {
  /** 启用哪些富编辑能力，默认全部启用 */
  features?: {
    emoji?: boolean;
    image?: boolean;
    mention?: boolean;
  };
  /** 文本框占位符 */
  placeholder?: string;
  /** 提交按钮文案，默认「发布」 */
  submitText?: string;
}

const EMOJIS = [
  "😀", "😂", "🤣", "😍", "😘", "😎", "🤔", "😭",
  "👍", "👎", "❤️", "🔥", "🎉", "💯", "✨", "🌟",
  "😅", "😡", "🥺", "😴", "🙏", "💪", "👏", "💡",
];

const DEFAULT_FEATURES = { emoji: true, image: true, mention: true };

/** 把文本 + 图片解析为结构化富内容节点（@提及按候选名匹配） */
function buildContent(
  text: string,
  mentions: { id: string; name: string }[],
  images: string[]
): CommentNode[] {
  const nodes: CommentNode[] = [];
  const regex = /@([^\s@]{1,20})/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const name = m[1];
    const found = mentions.find((x) => x.name === name);
    if (found) {
      if (m.index > lastIndex) {
        nodes.push({ type: "text", value: text.slice(lastIndex, m.index) });
      }
      nodes.push({ type: "mention", userId: found.id, name: found.name });
      lastIndex = regex.lastIndex;
    }
  }
  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }
  for (const url of images) nodes.push({ type: "image", url });
  return nodes;
}

/** 根评论框：textarea + 工具条（emoji / 图片 / @提及）→ 结构化内容 */
function Composer({
  context,
  features,
  placeholder,
  submitText,
}: {
  context: CommentPluginContext<any>;
  features: { emoji: boolean; image: boolean; mention: boolean };
  placeholder?: string;
  submitText?: string;
}) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const mentions = (context.props.mentions as { id: string; name: string; avatar?: string }[]) ?? [];
  const fileRef = useRef<HTMLInputElement | null>(null);

  const preview = buildContent(text, mentions, images);
  const canSubmit = preview.some(
    (n) =>
      (n.type === "text" && n.value.trim().length > 0) ||
      n.type === "image" ||
      n.type === "mention"
  );

  const submit = () => {
    if (!canSubmit) return;
    (
      context.props.onSubmit as ((c: CommentNode[]) => void) | undefined
    )?.(preview);
    setText("");
    setImages([]);
    setShowEmoji(false);
    setMentionOpen(false);
  };

  const insertEmoji = (e: string) => setText((t) => t + e);
  const insertMention = (name: string) => {
    setText((t) => t + `@${name} `);
    setMentionOpen(false);
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImages((arr) => [...arr, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        border: "1px solid rgba(128,128,128,0.22)",
        borderRadius: 8,
        padding: 10,
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? "说点什么吧…"}
        rows={3}
        style={{
          width: "100%",
          resize: "vertical",
          border: "none",
          outline: "none",
          background: "transparent",
          color: "inherit",
          fontSize: 14,
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />

      {images.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0" }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={src}
                alt=""
                style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }}
              />
              <button
                type="button"
                onClick={() => setImages((arr) => arr.filter((_, j) => j !== i))}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 11,
                  lineHeight: "18px",
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showEmoji && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 2,
            margin: "6px 0",
          }}
        >
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => insertEmoji(e)}
              style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {mentionOpen && mentions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0" }}>
          {mentions.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => insertMention(m.name)}
              style={{
                border: "1px solid rgba(128,128,128,0.25)",
                borderRadius: 999,
                padding: "2px 10px",
                background: "transparent",
                color: "#1565c0",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              @{m.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
        {features.emoji && (
          <button type="button" onClick={() => setShowEmoji((v) => !v)} style={toolBtn}>
            😊
          </button>
        )}
        {features.image && (
          <>
            <button type="button" onClick={() => fileRef.current?.click()} style={toolBtn}>
              🖼️
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
          </>
        )}
        {features.mention && mentions.length > 0 && (
          <button type="button" onClick={() => setMentionOpen((v) => !v)} style={toolBtn}>
            @
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          style={{
            marginLeft: "auto",
            border: "none",
            borderRadius: 6,
            padding: "6px 18px",
            fontSize: 13,
            cursor: canSubmit ? "pointer" : "not-allowed",
            background: canSubmit ? "#1565c0" : "rgba(128,128,128,0.2)",
            color: canSubmit ? "#fff" : "inherit",
          }}
        >
          {submitText ?? "发布"}
        </button>
      </div>

      {canSubmit && (
        <div
          style={{
            marginTop: 6,
            padding: 6,
            borderRadius: 6,
            background: "rgba(128,128,128,0.1)",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {renderCommentContent(preview)}
        </div>
      )}
    </div>
  );
}

const toolBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 16,
  padding: 2,
};

/**
 * RichComposerPlugin - 富编辑：底部 `renderFooter` 渲染根评论框。
 * 支持 emoji / 图片（DataURL）/ @提及，输出结构化 CommentNode[] 回调 onSubmit。
 */
export function createRichComposerPlugin<T = any>(
  config: RichComposerConfig = {}
): CommentPlugin<T> {
  const features = { ...DEFAULT_FEATURES, ...(config.features ?? {}) };
  return {
    name: "RichComposerPlugin",
    version: "0.1.0",
    description: "富编辑：底部评论框，支持 emoji / 图片 / @提及，输出结构化富内容回调 onSubmit。",
    priority: 10,
    enabled: true,
    hooks: {
      renderFooter: (context: CommentPluginContext<T>) => (
        <Composer
          context={context}
          features={features}
          placeholder={config.placeholder}
          submitText={config.submitText}
        />
      ),
    },
  };
}

export { doc };
