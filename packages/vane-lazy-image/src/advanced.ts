/**
 * @module vane-lazy-image/advanced
 * 高级能力：依赖解析（内核）+ 版本比较工具。
 */

export { resolveDependencyOrder, type DepNode } from "@vane/plugin-core";

export {
  compareVersions,
  isVersionInRange,
  parseVersion,
  isValidVersion,
  formatVersion,
  isVersionEqual,
  isVersionGreater,
  isVersionLess,
} from "./utils/versionCompare";
