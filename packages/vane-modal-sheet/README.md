<p align="center">
  <a href="https://www.npmjs.com/package/vane-modal-sheet"><img src="https://img.shields.io/npm/v/vane-modal-sheet.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-modal-sheet"><img src="https://img.shields.io/npm/dm/vane-modal-sheet.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>
# 底部弹层

> 插件式 React 底部弹层（snap 吸附 + 原生拖拽 + 零第三方依赖）
>
> 插件式组件：`ModalSheetCore` 是 snap/拖拽几何的唯一决策者，视觉件与行为能力全部通过插件按需组合。

## 特性

- **零第三方运行时依赖**：原生 Pointer Events + CSS transform 补间，不依赖 motion/framer-motion
- **snap 吸附**：多档吸附点（比例/像素）、快速下滑关闭、拖出比例关闭，决策全在纯函数引擎里（CI 可全量单测）
- **插件化**：遮罩 / 把手 / 档位点 / 标题 / 步骤条 / 搜索框 / 吸底操作区 / 键盘避让 / 锁滚 / 焦点圈定，全部按需装配
- **进度联动**：内核逐帧写 `--vane-ms-progress` CSS 变量，插件零渲染成本做联动动画
- **可访问性**：`role=dialog` / `aria-modal` 内置；焦点圈定、`prefersReducedMotion` 走插件
- TypeScript 类型完备，与 `vane-plugin-core` 共用同一套插件规范

## 安装

```bash
npm install vane-modal-sheet
```

## 30 秒上手

```tsx
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";

const Sheet = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
  createHeaderPlugin({ title: "选择联系人" }),
]);

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>打开</button>
      <Sheet isOpen={open} onClose={() => setOpen(false)} snapPoints={[0.5, 0.9]}>
        <ContactList />
      </Sheet>
    </>
  );
}
```

## 包体积

| 导入方式 | Gzip |
| --- | --- |
| 根入口（Core + 装配 + 类型） | ~8 KB |
| 单插件子路径 | ~1–2 KB |

## 文档

- [API](../../docs/components/vane-modal-sheet/api.md)
- [插件目录](../../docs/components/vane-modal-sheet/plugins.md)
- [组合配方](../../docs/components/vane-modal-sheet/recipes.md)

## License

MIT
