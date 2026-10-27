# HTML 注入样本

下面两段是原始 HTML。**默认（`allowHtml: false`）它们会被转义成文本**，
你能看到标签本身；勾上 demo 里的开关后它们才会真的进 DOM。

<img src="x" onerror="document.title='PWNED-BY-MARKDOWN'">

<strong style="color:#c00">我是 HTML 片段</strong>

<script>document.title = 'SCRIPT-EXECUTED'</script>

---

## 正常的 Markdown 也该工作

| 能力 | 状态 |
| --- | --- |
| 表格 | ✅ |
| 任务列表 | ✅ |
| 代码高亮 | ✅ |

- [x] GFM 任务列表
- [ ] 未完成项

单行换行
应该渲染成 `<br>`（remark-breaks）

```ts
const html = createMarkdownPreviewPlugin({ allowHtml: true }); // 想清楚再开
```
