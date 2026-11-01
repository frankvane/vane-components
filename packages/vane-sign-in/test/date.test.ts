import { describe, expect, it } from "vitest";
import {
  addDays,
  compareDayKeys,
  diffDays,
  formatDayKey,
  isDayKey,
  toDayKey,
  todayKey,
} from "../src/utils/date";

/**
 * P1-2 · 日期与时区口径
 *
 * 回归目标：DayCell.date 必须是「业务时区的自然日」，展示不能混用
 * toLocaleDateString（SSR/浏览器时区不同会差一天），天数差不能直接拿 Date 相减。
 */
describe("toDayKey · 业务日键口径", () => {
  it("同一时刻在不同时区给出不同业务日（东八区 00:00–08:00 差一天）", () => {
    const instant = "2026-10-31T16:30:00Z";
    expect(toDayKey(instant, "UTC")).toBe("2026-10-31");
    expect(toDayKey(instant, "Asia/Shanghai")).toBe("2026-11-01");
    expect(toDayKey(instant, "America/New_York")).toBe("2026-10-31");
  });

  it("同一业务日内的两个时刻（UTC 跨日）归一成同一个 DayKey", () => {
    expect(toDayKey("2026-10-31T16:30:00Z", "Asia/Shanghai")).toBe(
      "2026-11-01"
    );
    expect(toDayKey("2026-11-01T15:30:00Z", "Asia/Shanghai")).toBe(
      "2026-11-01"
    );
  });

  it("缺省时区按运行环境本地自然日取值，而不是 UTC 日", () => {
    // 本地时间构造，23:59:59 与次日 00:00:01 必须落在不同的 DayKey
    expect(toDayKey(new Date(2026, 9, 31, 23, 59, 59))).toBe("2026-10-31");
    expect(toDayKey(new Date(2026, 10, 1, 0, 0, 1))).toBe("2026-11-01");
  });

  it("已是 DayKey 的字符串原样返回，epoch 毫秒按给定时区归一", () => {
    expect(toDayKey("2026-10-09")).toBe("2026-10-09");
    expect(toDayKey(Date.UTC(2026, 9, 31, 16, 30), "Asia/Shanghai")).toBe(
      "2026-11-01"
    );
  });

  it("formatDayKey 与 toDayKey 同口径（展示层不再用 toLocaleDateString）", () => {
    const at = Date.UTC(2026, 9, 31, 16, 30);
    expect(formatDayKey(at, "Asia/Shanghai")).toBe("2026-11-01");
    expect(formatDayKey(at, "UTC")).toBe("2026-10-31");
  });

  it("todayKey 等价于 toDayKey(now, tz)", () => {
    const now = Date.UTC(2026, 11, 31, 16, 30);
    expect(todayKey("Asia/Shanghai", now)).toBe("2027-01-01");
    expect(toDayKey(now, "Asia/Shanghai")).toBe("2027-01-01");
  });

  it("非法值抛 RangeError，非法日期键只判 false 不抛", () => {
    expect(() => toDayKey("not-a-date")).toThrow(RangeError);
    expect(() => diffDays("2026-13-01", "2026-12-01")).toThrow(RangeError);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("2026-2-9")).toBe(false);
    expect(isDayKey("2026-02-29")).toBe(false); // 2026 不是闰年
    expect(isDayKey("2024-02-29")).toBe(true);
  });
});

describe("diffDays / addDays · 跨月 / 闰年 / DST 免疫", () => {
  it("跨月边界：3/1 与 2/28 相差 1 天", () => {
    expect(diffDays("2026-03-01", "2026-02-28")).toBe(1);
    expect(diffDays("2026-02-28", "2026-03-01")).toBe(-1);
  });

  it("闰年：2024-03-01 与 2024-02-28 相差 2 天，平年相差 1 天", () => {
    expect(diffDays("2024-03-01", "2024-02-28")).toBe(2);
    expect(diffDays("2025-03-01", "2025-02-28")).toBe(1);
  });

  it("DST 切换日仍按自然日计 1 天（不碰 Date 相减）", () => {
    // 2026-03-08 是 America/New_York 夏令时开始；纯 DayKey 运算必须不受 23 小时影响
    expect(diffDays("2026-03-09", "2026-03-08")).toBe(1);
    expect(diffDays("2026-11-02", "2026-11-01")).toBe(1);
  });

  it("addDays 覆盖跨月 / 跨年 / 闰日", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-11-01", 0)).toBe("2026-11-01");
  });

  it("compareDayKeys 可做升序排序", () => {
    const keys = ["2026-11-05", "2026-10-09", "2026-12-31"];
    expect([...keys].sort(compareDayKeys)).toEqual([
      "2026-10-09",
      "2026-11-05",
      "2026-12-31",
    ]);
    expect(compareDayKeys("2026-10-09", "2026-10-09")).toBe(0);
    expect(compareDayKeys("2026-10-09", "2026-10-20")).toBe(-1);
  });
});
