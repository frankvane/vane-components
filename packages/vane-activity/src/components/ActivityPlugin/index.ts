export { default as ActivityCore } from "./ActivityCore";
export { withPlugins } from "./withPlugins";
export type { WithPluginsConfig } from "vane-plugin-core";
export {
  ActivitySlotProvider,
  renderActivitySlot,
  useActivitySlot,
  useActivityContext,
} from "./plugins/slots";
export type * from "./plugins/types";
