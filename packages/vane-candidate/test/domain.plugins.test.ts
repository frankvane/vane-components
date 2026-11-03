import { describe, expect, it } from "vitest";
import { createScorePlugin } from "../src/custom-plugins/ScorePlugin";
import { createStageFlowPlugin } from "../src/custom-plugins/StageFlowPlugin";
import { moveStage, stageIndexOf, csvCell, maskPhone, maskEmail } from "../src/components/CandidatePlugin/domain";
import { DEFAULT_STAGES } from "../src/components/CandidatePlugin/plugins/types";
import type { Candidate } from "../src/components/CandidatePlugin/plugins/types";

const makeCandidate = (patch: Partial<Candidate> = {}): Candidate => ({
  id: "c1",
  name: "陈知远",
  role: "前端工程师",
  stage: "screening",
  ...patch,
});

describe("createScorePlugin", () => {
  it("返回合规的插件结构（name / hooks / meta）", () => {
    const plugin = createScorePlugin();
    expect(plugin.name).toBe("score");
    expect(typeof plugin.hooks.renderCardBadges).toBe("function");
    expect(createScorePlugin.meta.name).toBe("Score");
  });

  it("无分数候选人不渲染徽章", () => {
    const plugin = createScorePlugin();
    const ctx = { data: [makeCandidate({ score: undefined })] } as unknown as Parameters<
      NonNullable<typeof plugin.hooks.renderCardBadges>
    >[0];
    expect(plugin.hooks.renderCardBadges?.(ctx, makeCandidate())).toBeNull();
  });
});

describe("createStageFlowPlugin", () => {
  it("边界阶段上下文可读", () => {
    const plugin = createStageFlowPlugin();
    expect(plugin.name).toBe("stage-flow");
    expect(typeof plugin.hooks.renderCardActions).toBe("function");
    expect(createStageFlowPlugin.meta.name).toBe("StageFlow");
  });
});

describe("domain 纯函数", () => {
  it("moveStage 推进/退回且边界停住", () => {
    const stages = [...DEFAULT_STAGES];
    expect(moveStage(stages, "screening", 1)).toBe("interview");
    expect(moveStage(stages, "screening", -1)).toBe("applied");
    expect(moveStage(stages, "applied", -1)).toBe("applied");
    expect(moveStage(stages, "hired", 1)).toBe("rejected");
    expect(moveStage(stages, "rejected", 1)).toBe("rejected");
    // 不在阶段列表中的阶段不可流转
    expect(moveStage(stages, "unknown", 1)).toBe("unknown");
  });

  it("stageIndexOf 返回 -1 表示未定义阶段", () => {
    expect(stageIndexOf([...DEFAULT_STAGES], "offer")).toBe(3);
    expect(stageIndexOf([...DEFAULT_STAGES], "nope")).toBe(-1);
  });

  it("csvCell 防公式注入并转义引号", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("he said \"hi\"")).toBe('"he said ""hi"""');
  });

  it("csvCell 数值不破坏负数，且覆盖 \\t/\\r 前缀", () => {
    expect(csvCell(-5)).toBe('"-5"');
    expect(csvCell(87.5)).toBe('"87.5"');
    expect(csvCell("\t=cmd")).toBe('"\'\t=cmd"');
    expect(csvCell("\r@x")).toBe('"\'\r@x"');
    expect(csvCell("-normal")).toBe('"\'-normal"');
  });

  it("maskPhone / maskEmail 脱敏", () => {
    expect(maskPhone("13812345678")).toBe("138****5678");
    expect(maskEmail("zhiyuan.chen@example.com")).toBe("z***n@example.com");
    expect(maskPhone(undefined)).toBeUndefined();
  });

  it("maskPhone 兼容非纯数字格式，不原样透出（防静默脱敏失效）", () => {
    expect(maskPhone("+8613812345678")).toBe("861****5678");
    expect(maskPhone("138-1234-5678")).toBe("138****5678");
    expect(maskPhone("138 1234 5678")).toBe("138****5678");
    // 短号 / 无数字：掩码兜底，绝不原样返回
    expect(maskPhone("123456")).toBe("******");
    expect(maskPhone("abc")).toBe("****");
  });

  it("maskEmail 多 @ 输入取最后一段为域名", () => {
    expect(maskEmail("a@b@c.com")).toBe("a***b@c.com");
    expect(maskEmail("ab@x.com")).toBe("a***@x.com");
  });
});
