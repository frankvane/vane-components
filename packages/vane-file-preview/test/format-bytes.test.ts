/**
 * `formatBytes` 的边界。
 *
 * 这条是 demo 真机验收抓到的：`sample.wav` 1048558 字节（比 1MiB 少 18 字节）
 * 显示成 "1024.0 KB"。原因是单位按**原始字节**判断（< 1024*1024 就走 KB），
 * 但显示值四舍五入到一位小数后又进了 1024 —— 一个「1024 KB」的假象。
 * 这类数在 1MB 附近的音频、截图、PDF 里极常见，用户会以为体积算错了。
 */
import { describe, expect, it } from "vitest";
import { formatBytes } from "../src/components/FilePreviewPlugin/shared/fileHelpers";

describe("formatBytes", () => {
  it("1KB 以下按字节显示，不进小数", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1)).toBe("1 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("正好在单位边界上时进到上一级", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
  });

  it("四舍五入后触顶时也进级，不出现「1024.0 KB」", () => {
    // 真实样本：sample.wav = 1048558 字节 → 1023.998 KB
    expect(formatBytes(1048558)).toBe("1.0 MB");
    expect(formatBytes(1048575)).toBe("1.0 MB");
    // 同理，MB → GB 这一档
    expect(formatBytes(1024 * 1024 * 1024 - 1)).toBe("1.0 GB");
  });

  it("没到四舍五入边界就老实留在本级", () => {
    // 1023.4 KB：四舍五入是 1023.4，不该被推到 MB
    expect(formatBytes(Math.round(1023.4 * 1024))).toBe("1023.4 KB");
    expect(formatBytes(2498125)).toBe("2.4 MB");
  });

  it("负数与非有限值给占位符，不抛错", () => {
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("—");
  });
});
