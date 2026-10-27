/**
 * 媒体组（3 页）：Image / Video / Gallery
 *
 * 三者抢的都是「头部媒体区」，priority 分别 10 / 40 / 40 —— 同时装会叠在一起，
 * 所以每页只装一个。工坊里把三个都勾上，就能看到叠成什么样（那是 Lab，不是推荐用法）。
 */
import React from "react";
import { createGalleryPlugin, createImagePlugin, createVideoPlugin } from "vane-card/custom-plugins";
import { Content, makeCard, useCard } from "../stage";
import { svgImage } from "../../data/images";
import { TEE } from "../../data/seed";
import videoUrl from "../../assets/demo.mp4?url";
import type { DemoEntry } from "../types";

// ============ Image ============

const ImageCard = makeCard([createImagePlugin({ alt: "商品主图" })]);

const imagePage: DemoEntry = {
  meta: {
    slug: "image",
    title: "ImagePlugin：主图 + 破图兜底",
    group: "media",
    plugin: "ImagePlugin",
    intro: "读 data.image 渲染头部主图，固定比例裁切；图加载失败时走 fallback，容器高度不塌。",
    why: "列表卡和商详卡的第一屏都是图。图挂掉时如果容器塌了，整张卡会跳一下 —— 兜底比展示更重要。",
    plugs: [
      {
        fn: "createImagePlugin",
        cfg: 'alt: "商品主图"',
        why: "把主图放进头部区，并在破图时用 placeholder 顶住高度",
      },
    ],
    props: ["padding={0}"],
    note: "没有图源时它返回 null（头部不占位），不会渲染一个空的 <img>；主图还会跟随总线 sku.variant 自动换图。",
    controls: [
      {
        key: "source",
        label: "图源",
        kind: "select",
        init: "data",
        options: [
          { label: "data.image", value: "data" },
          { label: "无图（不渲染）", value: "none" },
          { label: "坏图（走兜底）", value: "broken" },
        ],
      },
    ],
  },
  Stage: ({ cfg }) => {
    const data =
      cfg.source === "none"
        ? { ...TEE, image: undefined }
        : cfg.source === "broken"
          ? { ...TEE, image: "https://invalid.example/broken.png" }
          : TEE;
    return (
      <ImageCard cardId="media-image" data={data} padding={0}>
        <Content title={TEE.title} subtitle={TEE.subtitle} />
      </ImageCard>
    );
  },
};

// ============ Video ============

const videoPage: DemoEntry = {
  meta: {
    slug: "video",
    title: "VideoPlugin：头部视频 + 悬停播放",
    group: "media",
    plugin: "VideoPlugin",
    intro: "16:9 头部视频，可配封面、静音、循环、悬停播放。默认不自动播 —— 带声自动播会被浏览器拦，用户也烦。",
    why: "服饰 / 家电 / 户外这类商品，视频比图更能说明「用起来什么感觉」，但必须由用户决定播不播。",
    plugs: [
      {
        fn: "createVideoPlugin",
        cfg: 'src: videoUrl, muted: {{muted}},\n        playOnHover: {{hoverPlay}}',
        why: "提供头部视频区，并在悬停时播放 / 移出暂停",
      },
    ],
    props: ["padding={0}"],
    note: "如果同时装了 GalleryPlugin，Gallery 会声明 media.handledByGallery，Video 自动让位（避免出现两个播放器）。",
    controls: [
      { key: "hoverPlay", label: "悬停播放", kind: "switch", init: false },
      { key: "muted", label: "静音", kind: "switch", init: true },
    ],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createVideoPlugin({
        src: videoUrl,
        poster: svgImage({ label: "视频封面", width: 480, height: 270 }),
        muted: Boolean(cfg.muted),
        playOnHover: Boolean(cfg.hoverPlay),
        controls: true,
      }),
    ]);
    return (
      <Card cardId="media-video" data={TEE} padding={0}>
        <Content title={TEE.title} subtitle="把鼠标移到视频上：开了「悬停播放」才会真的动" />
      </Card>
    );
  },
};

// ============ Gallery ============

const galleryPage: DemoEntry = {
  meta: {
    slug: "gallery",
    title: "GalleryPlugin：多图轮播 + 缩略图",
    group: "media",
    plugin: "GalleryPlugin",
    intro: "多图轮播，可开指示器、缩略图、自动播；support 把视频插进第 N 位。选规格时若变体带图，主图会跟着切。",
    why: "商详卡有 3–6 张图时，用缩略图比用圆点更省一次点击 —— 用户能直接跳到想看的那张。",
    plugs: [
      {
        fn: "createGalleryPlugin",
        cfg: "images: data.images,\n        autoplay: {{autoplay}},\n        showThumbnails: {{thumbs}},\n        interval: {{interval}}",
        why: "轮播 + 缩略图 + 自动播，替代「一张主图 + 一串小图」的手写实现",
      },
    ],
    props: ["padding={0}"],
    note: "自动播要配合 interval；用户手动点过之后应停掉自动播（本插件在交互后自动暂停，避免「抢控制权」）。",
    controls: [
      { key: "interval", label: "自动播间隔", kind: "number", init: 3000, min: 1000, max: 6000, step: 500 },
      { key: "autoplay", label: "自动播", kind: "switch", init: false },
      { key: "thumbs", label: "缩略图", kind: "switch", init: true },
    ],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createGalleryPlugin({
        images: TEE.images,
        autoplay: Boolean(cfg.autoplay),
        interval: Number(cfg.interval),
        showThumbnails: Boolean(cfg.thumbs),
        showIndicators: true,
      }),
    ]);
    return (
      <Card cardId="media-gallery" data={TEE} padding={0}>
        <Content title={TEE.title} subtitle={`${TEE.images?.length ?? 0} 张图 · 点缩略图直接跳`} />
      </Card>
    );
  },
};

export const MEDIA_DEMOS: DemoEntry[] = [imagePage, videoPage, galleryPage];
