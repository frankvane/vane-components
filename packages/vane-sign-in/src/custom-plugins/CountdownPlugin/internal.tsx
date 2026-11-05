import React from "react";
import { GREEN, TEXT_3 } from "../tokens";
import { useSignInNow } from "../../components/SignInPlugin/plugins/clockContext";

export interface CountdownTextProps {
  nextResetAt: number;
  todaySigned: boolean;
}

/**
 * 倒计时文案（消费 Core 时钟，保证每秒 tick；旧实现只在渲染那一帧读 Date.now()）。
 * 长周期换算成「n天m小时」，不再出现「168小时0分」。
 */
export function CountdownText({ nextResetAt, todaySigned }: CountdownTextProps) {
  const now = useSignInNow();
  const diff = nextResetAt - now;
  if (diff <= 0) {
    return <div style={{ fontSize: 12, color: GREEN }}>现在可签到</div>;
  }
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3.6e6);
  const minutes = Math.floor((diff % 3.6e6) / 6e4);
  const remaining = days > 0 ? `${days}天${hours}小时` : `${hours}小时${minutes}分`;
  return (
    <div style={{ fontSize: 12, color: TEXT_3 }}>
      {todaySigned ? `距下次可签到 ${remaining}` : "今日可签到"}
    </div>
  );
}
