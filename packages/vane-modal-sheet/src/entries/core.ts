/** ./core —— 只要核心组件时导入这里，体积最小 */
export { ModalSheetCore } from "../components/ModalSheetPlugin/ModalSheetCore";
export {
  resolveSnap,
  resolveSnapPixels,
  createSheetState,
} from "../components/ModalSheetPlugin/engine";
export type {
  ModalSheetCoreProps,
  ModalSheetCoreRef,
  ModalSheetDragProps,
} from "../components/ModalSheetPlugin/plugins/types";
export type {
  SheetDetent,
  SheetEngineState,
} from "../components/ModalSheetPlugin/engine";
