import React from "react";
import type {
  CommentData,
  CommentPlugin,
  CommentPluginContext,
} from "../../components/CommentPlugin/plugins/types";
import { Composer } from "./Composer";
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
  /** 图片 MIME 白名单（拖拽 / 改扩展名也拦得住），默认 jpeg/png/gif/webp */
  acceptImageTypes?: string[];
  /** 单张图片体积上限（MB），默认 5 */
  maxImageSizeMb?: number;
  /** 最多可选图片张数，默认 9 */
  maxImages?: number;
}

const DEFAULT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const DEFAULT_FEATURES = { emoji: true, image: true, mention: true };

/**
 * RichComposerPlugin - 富编辑：底部 `renderFooter` 渲染根评论框。
 * 支持 emoji / 图片（DataURL）/ @提及，输出结构化 CommentNode[] 回调 onSubmit。
 *
 * 泛型默认值收敛为 CommentData（真实领域数据类型）；自定义 data 形态的调用方请显式写泛型参数。
 */
export function createRichComposerPlugin<T = CommentData>(
  config: RichComposerConfig = {}
): CommentPlugin<T> {
  const features = { ...DEFAULT_FEATURES, ...(config.features ?? {}) };
  const acceptImageTypes = config.acceptImageTypes ?? DEFAULT_IMAGE_TYPES;
  const maxImageSizeMb = config.maxImageSizeMb ?? 5;
  const maxImages = config.maxImages ?? 9;
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
          acceptImageTypes={acceptImageTypes}
          maxImageSizeMb={maxImageSizeMb}
          maxImages={maxImages}
        />
      ),
    },
  };
}

export { doc };
