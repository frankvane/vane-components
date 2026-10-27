# 发布流程

## 版本策略

- **所有包统一走 changesets**，不允许手动改 `version`；
- 组件包之间通过 `peerDependencies` 关联 `vane-plugin-core`，内核升级会带动所有包 minor/patch 提示；
- 破坏性变更必须 major，并在 changeset 里写清迁移步骤。

## 日常发版

```bash
# 1. 确认主干干净
git status

# 2. 本地全量校验
pnpm verify          # lint + typecheck + test + 包卫生检查

# 3. 记录变更
pnpm changeset       # 选择包 → 选择 major/minor/patch → 写 changelog
git add -A && git commit -m "chore: release prep"

# 4. 应用版本号 + 更新 CHANGELOG
pnpm release:version
git add -A && git commit -m "chore: version packages"

# 5. 发布
pnpm release:publish
```

## 发布前强制检查（`pnpm check`）

| 检查 | 不通过的后果 |
| --- | --- |
| react/react-dom 不在 dependencies | 消费方出现双 React |
| `exports["."]` 带 types + import | 类型报错 / 找不到入口 |
| README 含 `npm install <pkg>` | 首屏断裂 |
| gzip 体积 ≤ 预算 | 体积失控 |

## 本机环境注意（Windows）

- 发布脚本会触发 `prepublishOnly` → `build` → 清空 dist。本机安全策略会拦截子进程删目录，必须：

```bash
export CODEBUDDY_SAFE_DELETE_ENABLED=0
pnpm release:publish
```

- `vite-plugin-dts` 必须 `rollupTypes: false`（Windows EPERM），已在 `@vane/build-config` 内置。

## 发版后验证

```bash
# npm view 会读本地缓存，不可靠；直接查 registry
node -e "fetch('https://registry.npmjs.org/<pkg>').then(r=>r.json()).then(j=>console.log(j['dist-tags']))"
```

## 回滚

npm 不允许覆盖已发布版本，只能发一个更高的 patch 修复。所以：

1. 发版后立刻在消费项目里装一次验证；
2. 发现问题先 `npm deprecate <pkg>@<version>`，再发修复版。

