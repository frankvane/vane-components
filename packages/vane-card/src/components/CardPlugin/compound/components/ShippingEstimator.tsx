import React from "react";
import { useProductCard } from "../ProductCard";

export type RegionOption = {
  code: string;
  name: string;
  baseFee: number; // 基础运费（元）
  extraPerKg?: number; // 超重每公斤附加费（元）
  etaDays: number; // 预计天数
};

export type MethodOption = {
  code: string;
  name: string;
  multiplier?: number; // 费用系数
  etaOffset?: number; // 预计天数增量
};

export type ShippingEstimateResult = {
  fee: number;
  etaDays: number;
  region: RegionOption;
  method: MethodOption;
  weightKg: number;
};

export type ShippingEstimatorProps = {
  className?: string;
  style?: React.CSSProperties;
  regions: RegionOption[];
  methods: MethodOption[];
  defaultRegionCode?: string;
  defaultMethodCode?: string;
  weightKg?: number; // 直接传入重量（公斤）
  weightFromData?: boolean; // 使用商品数据的单位重量 * 数量
  unitWeightKgFallback?: number; // 当 data.unitWeight 不存在时的回退
  showBreakdown?: boolean;
  onEstimateChange?: (result: ShippingEstimateResult) => void;
};

export const ShippingEstimator: React.FC<ShippingEstimatorProps> = ({
  className = "",
  style,
  regions,
  methods,
  defaultRegionCode,
  defaultMethodCode,
  weightKg,
  weightFromData = true,
  unitWeightKgFallback = 0.5,
  showBreakdown = true,
  onEstimateChange,
}) => {
  const { data, state } = useProductCard();

  const [regionCode, setRegionCode] = React.useState<string>(
    defaultRegionCode ?? regions[0]?.code
  );
  const [methodCode, setMethodCode] = React.useState<string>(
    defaultMethodCode ?? methods[0]?.code
  );

  const region = React.useMemo(
    () => regions.find((r) => r.code === regionCode) ?? regions[0],
    [regions, regionCode]
  );
  const method = React.useMemo(
    () => methods.find((m) => m.code === methodCode) ?? methods[0],
    [methods, methodCode]
  );

  const effectiveWeight = React.useMemo(() => {
    if (typeof weightKg === "number") return Math.max(0, weightKg);
    if (weightFromData) {
      const unit = data?.unitWeight ?? unitWeightKgFallback;
      const qty = state.quantity ?? 1;
      return Math.max(0, Number(unit) * Number(qty));
    }
    return 0;
  }, [weightKg, weightFromData, data?.unitWeight, unitWeightKgFallback, state.quantity]);

  const estimate = React.useMemo<ShippingEstimateResult>(() => {
    const base = region.baseFee;
    const extraRate = region.extraPerKg ?? 0;
    const multiplier = method.multiplier ?? 1;
    const etaBase = region.etaDays;
    const etaOffset = method.etaOffset ?? 0;

    const extra = effectiveWeight > 1 ? (effectiveWeight - 1) * extraRate : 0;
    const fee = (base + extra) * multiplier;
    const etaDays = etaBase + etaOffset;

    return {
      fee: Math.round(fee * 100) / 100, // 两位小数
      etaDays,
      region,
      method,
      weightKg: Math.round(effectiveWeight * 100) / 100,
    };
  }, [region, method, effectiveWeight]);

  React.useEffect(() => {
    onEstimateChange?.(estimate);
  }, [estimate, onEstimateChange]);

  return (
    <div className={`vc-shipping-estimator ${className}`.trim()} style={style}>
      <div className="vc-shipping-estimator__grid">
        <label className="vc-shipping-estimator__field">
          <span className="vc-shipping-estimator__label">配送区域</span>
          <select
            className="vc-shipping-estimator__select"
            value={regionCode}
            onChange={(e) => setRegionCode(e.target.value)}
          >
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="vc-shipping-estimator__field">
          <span className="vc-shipping-estimator__label">配送方式</span>
          <select
            className="vc-shipping-estimator__select"
            value={methodCode}
            onChange={(e) => setMethodCode(e.target.value)}
          >
            {methods.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="vc-shipping-estimator__summary">
        <div>
          <strong>预计运费：</strong>
          <span className="vc-shipping-estimator__fee">¥{estimate.fee.toFixed(2)}</span>
        </div>
        <div>
          <strong>预计送达：</strong>
          <span>{estimate.etaDays} 天</span>
        </div>
      </div>

      {showBreakdown && (
        <div className="vc-shipping-estimator__breakdown">
          <div>
            区域：{estimate.region.name}（基础 ¥{estimate.region.baseFee}）
          </div>
          <div>
            方式：{estimate.method.name}
            {estimate.method.multiplier ? `（系数 x${estimate.method.multiplier}）` : ""}
          </div>
          <div>
            重量：{estimate.weightKg}kg
            {estimate.region.extraPerKg
              ? `（超重每kg +¥${estimate.region.extraPerKg}）`
              : ""}
          </div>
        </div>
      )}
    </div>
  );
};