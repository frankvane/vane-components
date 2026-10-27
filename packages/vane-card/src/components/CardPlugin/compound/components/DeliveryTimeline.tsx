import React from "react";

export type TimelineStep = {
  key: string;
  name: string;
  days?: number; // 步骤耗时（天），不填则自动平均分配
};

export type ComputedStep = TimelineStep & {
  startDate: Date;
  endDate: Date;
};

export type DeliveryTimelineProps = {
  className?: string;
  style?: React.CSSProperties;
  etaDays: number; // 总预计天数
  startDate?: Date | string; // 起始日期，默认今天
  weekendSkip?: boolean; // 是否跳过周末
  steps?: TimelineStep[]; // 自定义步骤
  showDates?: boolean; // 显示日期范围
  dateLocale?: string; // 日期本地化，默认 zh-CN
  onTimelineChange?: (steps: ComputedStep[]) => void;
};

function parseDate(input?: Date | string): Date {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

function addDays(base: Date, days: number, weekendSkip: boolean): Date {
  const d = new Date(base);
  if (!weekendSkip) {
    d.setDate(d.getDate() + days);
    return d;
  }
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0 Sun ... 6 Sat
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return d;
}

export const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({
  className = "",
  style,
  etaDays,
  startDate,
  weekendSkip = false,
  steps,
  showDates = true,
  dateLocale = "zh-CN",
  onTimelineChange,
}) => {
  const start = React.useMemo(() => parseDate(startDate), [startDate]);

  const defaultSteps: TimelineStep[] = React.useMemo(
    () => [
      { key: "process", name: "下单处理" },
      { key: "dispatch", name: "仓库发货" },
      { key: "transit", name: "运输中" },
      { key: "deliver", name: "派送/签收" },
    ],
    []
  );

  const plan = React.useMemo(() => {
    const input = steps && steps.length ? steps : defaultSteps;
    // 总天数分配到各步骤
    const total = Math.max(1, Math.round(etaDays));
    const explicit = input.filter((s) => typeof s.days === "number");
    const explicitSum = explicit.reduce((sum, s) => sum + (s.days || 0), 0);
    const remain = Math.max(0, total - explicitSum);
    const undefinedSteps = input.filter((s) => typeof s.days !== "number");
    const avg = undefinedSteps.length ? Math.floor(remain / undefinedSteps.length) : 0;
    let leftover = undefinedSteps.length ? remain - avg * undefinedSteps.length : 0;

    const distributed = input.map((s) => {
      if (typeof s.days === "number") return s;
      const add = avg + (leftover > 0 ? 1 : 0);
      if (leftover > 0) leftover -= 1;
      return { ...s, days: Math.max(1, add) };
    });

    // 确保总和等于 total
    const sum = distributed.reduce((acc, s) => acc + (s.days || 0), 0);
    const diff = total - sum;
    if (diff !== 0 && distributed.length) {
      distributed[distributed.length - 1] = {
        ...distributed[distributed.length - 1],
        days: Math.max(1, (distributed[distributed.length - 1].days || 1) + diff),
      };
    }

    // 生成时间范围
    let cursor = start;
    const computed: ComputedStep[] = distributed.map((s) => {
      const sDate = new Date(cursor);
      const eDate = addDays(cursor, s.days || 1, weekendSkip);
      cursor = eDate;
      return { ...s, startDate: sDate, endDate: eDate };
    });

    return computed;
  }, [etaDays, steps, defaultSteps, start, weekendSkip]);

  React.useEffect(() => {
    onTimelineChange?.(plan);
  }, [plan, onTimelineChange]);

  const containerStyles: React.CSSProperties = {
    display: "grid",
    gap: 12,
    border: "1px solid #eee",
    borderRadius: 8,
    padding: 12,
    background: "#fafafa",
    ...style,
  };

  const barStyles: React.CSSProperties = {
    height: 8,
    background: "#e6e6e6",
    borderRadius: 6,
    overflow: "hidden",
    display: "flex",
  };

  const dateFmt = (d: Date) => d.toLocaleDateString(dateLocale, { month: "short", day: "numeric" });

  return (
    <div className={`delivery-timeline ${className}`} style={containerStyles}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>预计 {Math.round(etaDays)} 天送达</strong>
        {showDates && (
          <span style={{ color: "#666" }}>
            {dateFmt(plan[0]?.startDate ?? start)} ~ {dateFmt(plan[plan.length - 1]?.endDate ?? start)}
          </span>
        )}
      </div>

      <div style={barStyles}>
        {plan.map((s, idx) => (
          <div
            key={s.key}
            style={{
              flex: s.days || 1,
              background: ["#96c", "#5ac", "#fa6", "#6c9"][idx % 4],
            }}
            title={`${s.name}（${s.days}天）`}
          />
        ))}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {plan.map((s) => (
          <div key={s.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "#fff", borderRadius: 6, border: "1px solid #eee" }}>
            <div>
              <strong>{s.name}</strong>
              <span style={{ color: "#999", marginLeft: 8 }}>约 {s.days} 天</span>
            </div>
            {showDates && (
              <div style={{ color: "#666" }}>
                {dateFmt(s.startDate)} ~ {dateFmt(s.endDate)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};