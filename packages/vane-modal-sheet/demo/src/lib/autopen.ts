import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

/**
 * 弹层开合状态，支持 ?autopen=1 直达打开态。
 *
 * 两个用途：
 * 1. 分享示例链接时直接呈打开态，免去一次点击；
 * 2. 无头截图 / 自检（受控浏览器的 CDP 点击在部分环境不可靠，
 *    autopen 让「打开弹层」这一步不依赖点击）。
 */
export function useAutoOpen(): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof location === "undefined") return false;
    const params = new URLSearchParams(location.search);
    const hit = params.has("autopen");
    // 诊断通道：?autopendiag=1 时把弹层挂载/几何状态写进 title
    if (params.has("autopendiag")) {
      document.title = `AUTOPEN_DIAG search=${location.search} hit=${hit}`;
      window.setTimeout(() => {
        const panel = document.querySelector<HTMLElement>(".vc-ms-panel");
        const root = document.querySelector<HTMLElement>(".vc-ms-root");
        document.title = `DIAG panel=${panel ? 1 : 0} root=${root ? 1 : 0} tf=${
          panel?.style.transform ?? "-"
        } h=${panel?.style.height ?? "-"}`;
      }, 1500);
    }
    return hit;
  });
  return [open, setOpen];
}
