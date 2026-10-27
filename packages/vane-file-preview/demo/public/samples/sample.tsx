import "./App.css";

import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import React, { Suspense } from "react";

// 懒加载组件
const FilePreviewExample = React.lazy(
  () => import("./pages/FilePreviewPlugin/Example")
);
const BasicPreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/BasicPreviewDemo")
);
const ImagePreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/ImagePreviewDemo")
);
const PdfPreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/PdfPreviewDemo")
);
const VideoPreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/VideoPreviewDemo")
);
const AudioPreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/AudioPreviewDemo")
);
const CodePreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/CodePreviewDemo")
);
const MarkdownPreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/MarkdownPreviewDemo")
);
const OfficePreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/OfficePreviewDemo")
);
const CsvPreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/CsvPreviewDemo")
);
const JsonPreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/JsonPreviewDemo")
);
const ZipPreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/ZipPreviewDemo")
);
const EpubPreviewDemo = React.lazy(
  () => import("./pages/FilePreviewPlugin/EpubPreviewDemo")
);

// 加载中组件
const LoadingFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "400px",
      fontSize: "16px",
      color: "#666",
    }}
  >
    加载中...
  </div>
);

const App: React.FC = () => {
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Vane FilePreview 演示</h2>
        <nav className="nav">
          <NavLink to="/" end>
            首页
          </NavLink>

          <h3 style={{ marginTop: 12 }}>基础预览</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <NavLink to="/file-preview/basic">基础文件预览</NavLink>
            <NavLink to="/file-preview/image">图片预览</NavLink>
            <NavLink to="/file-preview/pdf">PDF预览</NavLink>
            <NavLink to="/file-preview/video">视频预览</NavLink>
            <NavLink to="/file-preview/audio">音频预览</NavLink>
          </div>

          <h3 style={{ marginTop: 12 }}>文档预览</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <NavLink to="/file-preview/code">代码预览</NavLink>
            <NavLink to="/file-preview/markdown">Markdown预览</NavLink>
            <NavLink to="/file-preview/office">Office文档预览</NavLink>
          </div>

          <h3 style={{ marginTop: 12 }}>数据预览</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <NavLink to="/file-preview/csv">CSV预览</NavLink>
            <NavLink to="/file-preview/json">JSON预览</NavLink>
          </div>

          <h3 style={{ marginTop: 12 }}>压缩文件预览</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <NavLink to="/file-preview/zip">ZIP预览</NavLink>
            <NavLink to="/file-preview/epub">EPUB预览</NavLink>
          </div>

          <h3 style={{ marginTop: 12 }}>综合示例</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <NavLink to="/fp-plugin/example">综合示例</NavLink>
          </div>
        </nav>
      </aside>
      <main className="main">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* 基础预览路由 */}
            <Route path="/file-preview/basic" element={<BasicPreviewDemo />} />
            <Route path="/file-preview/image" element={<ImagePreviewDemo />} />
            <Route path="/file-preview/pdf" element={<PdfPreviewDemo />} />
            <Route path="/file-preview/video" element={<VideoPreviewDemo />} />
            <Route path="/file-preview/audio" element={<AudioPreviewDemo />} />

            {/* 文档预览路由 */}
            <Route path="/file-preview/code" element={<CodePreviewDemo />} />
            <Route
              path="/file-preview/markdown"
              element={<MarkdownPreviewDemo />}
            />
            <Route
              path="/file-preview/office"
              element={<OfficePreviewDemo />}
            />

            {/* 数据预览路由 */}
            <Route path="/file-preview/csv" element={<CsvPreviewDemo />} />
            <Route path="/file-preview/json" element={<JsonPreviewDemo />} />

            {/* 压缩文件预览路由 */}
            <Route path="/file-preview/zip" element={<ZipPreviewDemo />} />
            <Route path="/file-preview/epub" element={<EpubPreviewDemo />} />

            {/* 综合示例路由 */}
            <Route path="/fp-plugin/example" element={<FilePreviewExample />} />

            {/* 默认重定向 */}
            <Route
              path="*"
              element={<Navigate to="/file-preview/basic" replace />}
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
