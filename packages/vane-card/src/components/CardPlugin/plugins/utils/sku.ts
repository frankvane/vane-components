/**
 * SKU 派生键的统一写入口径（插件侧与复合组件侧共用）。
 *
 * 派生键（sku.variant / sku.price / sku.image）必须「先清后写」：
 * 旧版只在命中变体时写，命中不到时什么都不做，于是切到未匹配/无价规格后
 * 价格与库存停在上一规格（P1-3）。
 */
import { BusKeys } from "../BusKeys";
import type { PluginBus } from "../types";

export interface SkuDerivable {
  price?: number;
  image?: string;
}

type WritableBus = Pick<PluginBus, "setData" | "deleteData">;

/** 写入（值为 undefined 时删除该键，同样会通知订阅方） */
function writeOrClear(bus: WritableBus, key: string, value: unknown): void {
  if (value === undefined) bus.deleteData(key);
  else bus.setData(key, value);
}

/**
 * 用匹配结果重写派生键；`variant` 为 undefined 时三个键全部清空。
 * 订阅方（PriceCalculator / ImagePlugin / QuantityPlugin）据此回到商品级默认值。
 */
export function writeSkuDerivedKeys(
  bus: WritableBus | undefined,
  variant: SkuDerivable | undefined
): void {
  if (!bus) return;
  writeOrClear(bus, BusKeys.skuVariant, variant);
  writeOrClear(
    bus,
    BusKeys.skuPrice,
    typeof variant?.price === "number" ? variant.price : undefined
  );
  writeOrClear(bus, BusKeys.skuImage, variant?.image);
}
