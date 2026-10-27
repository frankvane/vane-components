import { Actions } from "./components/Actions";
import { Badge } from "./components/Badge";
import { BadgeGroup } from "./components/BadgeGroup";
import { Brand } from "./components/Brand";
import { ColorSwatches } from "./components/ColorSwatches";
import { CouponBar } from "./components/CouponBar";
import { A11yToolbar } from "./components/A11yToolbar";
import { DeliveryTimeline } from "./components/DeliveryTimeline";
import { Description } from "./components/Description";
import { Discount } from "./components/Discount";
import { Divider } from "./components/Divider";
import { FeatureList } from "./components/FeatureList";
import { Image } from "./components/Image";
import { Inventory } from "./components/Inventory";
import { OldPrice } from "./components/OldPrice";
import { OptionPicker } from "./components/OptionPicker";
import { OrderSummaryPanel } from "./components/OrderSummaryPanel";
import { Price } from "./components/Price";
import { PricePerUnit } from "./components/PricePerUnit";
import { QuantityStepper } from "./components/QuantityStepper";
import { Rating } from "./components/Rating";
import { ReturnPolicy } from "./components/ReturnPolicy";
import { SavingsBadge } from "./components/SavingsBadge";
import { Section } from "./components/Section";
import { SelectedInfo } from "./components/SelectedInfo";
import { Shipping } from "./components/Shipping";
import { ShippingEstimator } from "./components/ShippingEstimator";
import { SizeSelector } from "./components/SizeSelector";
import { SKUCode } from "./components/SKUCode";
import { SpecsTable } from "./components/SpecsTable";
import { StockBadge } from "./components/StockBadge";
import { Subtitle } from "./components/Subtitle";
import { Tags } from "./components/Tags";
import { Title } from "./components/Title";
import { UpsellBundle } from "./components/UpsellBundle";
import { VariantMediaSwitcher } from "./components/VariantMediaSwitcher";
import { VariantSelector } from "./components/VariantSelector";
import { Warranty } from "./components/Warranty";
import { ProductCard as ProductCardMain } from "./ProductCard";

/**
 * `<ProductCard>` 及其 38 个子组件。
 *
 * 子组件是"零件"，写法是 `<ProductCard.Image />` 这样的点号访问 —— 下面用
 * `Object.assign` 一次挂上，而不是 38 行 `(ProductCard as any).X = X`：
 * 后者让每个赋值都绕过类型检查，漏挂一个子组件编译器也不会提示。
 */
export type ProductCardCompound = typeof ProductCardMain & {
  Image: typeof Image;
  Badge: typeof Badge;
  Title: typeof Title;
  Price: typeof Price;
  Description: typeof Description;
  Actions: typeof Actions;
  Section: typeof Section;
  Rating: typeof Rating;
  Inventory: typeof Inventory;
  Subtitle: typeof Subtitle;
  OldPrice: typeof OldPrice;
  Discount: typeof Discount;
  Tags: typeof Tags;
  Brand: typeof Brand;
  Shipping: typeof Shipping;
  Warranty: typeof Warranty;
  Divider: typeof Divider;
  FeatureList: typeof FeatureList;
  SpecsTable: typeof SpecsTable;
  SKUCode: typeof SKUCode;
  BadgeGroup: typeof BadgeGroup;
  PricePerUnit: typeof PricePerUnit;
  QuantityStepper: typeof QuantityStepper;
  OptionPicker: typeof OptionPicker;
  ColorSwatches: typeof ColorSwatches;
  SizeSelector: typeof SizeSelector;
  VariantSelector: typeof VariantSelector;
  SelectedInfo: typeof SelectedInfo;
  OrderSummaryPanel: typeof OrderSummaryPanel;
  SavingsBadge: typeof SavingsBadge;
  CouponBar: typeof CouponBar;
  StockBadge: typeof StockBadge;
  VariantMediaSwitcher: typeof VariantMediaSwitcher;
  ShippingEstimator: typeof ShippingEstimator;
  DeliveryTimeline: typeof DeliveryTimeline;
  ReturnPolicy: typeof ReturnPolicy;
  UpsellBundle: typeof UpsellBundle;
  A11yToolbar: typeof A11yToolbar;
};

export const ProductCard: ProductCardCompound = Object.assign(ProductCardMain, {
  Image,
  Badge,
  Title,
  Price,
  Description,
  Actions,
  Section,
  Rating,
  Inventory,
  Subtitle,
  OldPrice,
  Discount,
  Tags,
  Brand,
  Shipping,
  Warranty,
  Divider,
  FeatureList,
  SpecsTable,
  SKUCode,
  BadgeGroup,
  PricePerUnit,
  QuantityStepper,
  OptionPicker,
  ColorSwatches,
  SizeSelector,
  VariantSelector,
  SelectedInfo,
  OrderSummaryPanel,
  SavingsBadge,
  CouponBar,
  StockBadge,
  VariantMediaSwitcher,
  ShippingEstimator,
  DeliveryTimeline,
  ReturnPolicy,
  UpsellBundle,
  A11yToolbar,
});

// 类型导出
export type { ProductCardProps, ProductCardContextValue, ProductCardState } from "./ProductCard";
export type { ImageProps } from "./components/Image";
export type { BadgeProps } from "./components/Badge";
export type { TitleProps } from "./components/Title";
export type { PriceProps } from "./components/Price";
export type { DescriptionProps } from "./components/Description";
export type { ActionsProps } from "./components/Actions";
export type { SectionProps } from "./components/Section";
export type { RatingProps } from "./components/Rating";
export type { InventoryProps } from "./components/Inventory";
export type { SubtitleProps } from "./components/Subtitle";
export type { OldPriceProps } from "./components/OldPrice";
export type { DiscountProps } from "./components/Discount";
export type { TagsProps } from "./components/Tags";
export type { BrandProps } from "./components/Brand";
export type { ShippingProps } from "./components/Shipping";
export type { WarrantyProps } from "./components/Warranty";
export type { DividerProps } from "./components/Divider";
export type { FeatureListProps } from "./components/FeatureList";
export type { SpecsTableProps } from "./components/SpecsTable";
export type { SKUCodeProps } from "./components/SKUCode";
export type { BadgeGroupProps } from "./components/BadgeGroup";
export type { PricePerUnitProps } from "./components/PricePerUnit";
export type { QuantityStepperProps } from "./components/QuantityStepper";
export type { OptionPickerProps } from "./components/OptionPicker";
export type { ColorSwatchesProps } from "./components/ColorSwatches";
export type { SizeSelectorProps } from "./components/SizeSelector";
export type { VariantSelectorProps } from "./components/VariantSelector";
export type { SelectedInfoProps } from "./components/SelectedInfo";
export type { OrderSummaryPanelProps, OrderSummary } from "./components/OrderSummaryPanel";
export type { SavingsBadgeProps } from "./components/SavingsBadge";
export type { CouponBarProps, CouponInfo } from "./components/CouponBar";
export type { StockBadgeProps } from "./components/StockBadge";
export type { VariantMediaSwitcherProps, VariantImage } from "./components/VariantMediaSwitcher";
export type {
  ShippingEstimatorProps,
  RegionOption,
  MethodOption,
  ShippingEstimateResult,
} from "./components/ShippingEstimator";
export type { DeliveryTimelineProps, TimelineStep, ComputedStep } from "./components/DeliveryTimeline";
export type { ReturnPolicyProps } from "./components/ReturnPolicy";
export type { UpsellBundleProps, Bundle, BundleItem } from "./components/UpsellBundle";
export type { A11yToolbarProps } from "./components/A11yToolbar";
