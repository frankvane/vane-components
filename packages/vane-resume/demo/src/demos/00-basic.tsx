/**
 * 裸核心：不装任何插件，只渲染结构化简历数据。
 * 其它示例页都是在这之上叠加一个插件。
 */
import React from "react";
import { ResumeCore } from "vane-resume";
import { SAMPLE_RESUME } from "../data/sample";
import type { DemoMeta, DemoStageProps } from "./types";

export const meta: DemoMeta = {
  slug: "basic",
  title: "裸核心",
  group: "basic",
  intro: "ResumeCore 接收 ResumeData，按板块顺序渲染；不装任何插件时就是最朴素的纵向简历。",
  why: "先看底座：所有插件都是在这个结构化核心之上做增强，而不是重写它。",
  plugs: [],
  props: [],
};

export default function Stage(_: DemoStageProps) {
  return (
    <ResumeCore data={SAMPLE_RESUME} containerStyle={{ maxWidth: 560, margin: "0 auto" }} />
  );
}
