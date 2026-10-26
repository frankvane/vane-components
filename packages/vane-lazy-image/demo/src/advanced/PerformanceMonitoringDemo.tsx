import {
  LazyLoadImageCore,
  createFetchLoaderPlugin,
  createPerformanceMonitorPlugin,
  withPlugins,
} from "vane-lazy-image";
import React, { useCallback, useMemo, useRef, useState } from "react";

import { DemoLayout } from "../components/DemoLayout";

const PerformanceMonitoringDemo: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<
    Array<{ src: string; duration: number; timestamp: number; index: number }>
  >([]);
  const [globalStats, setGlobalStats] = useState<{
    totalImages: number;
    avgLoadTime: number;
  }>({ totalImages: 0, avgLoadTime: 0 });
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const loadCountRef = useRef(0);
  const reportedSrcsRef = useRef<Set<string>>(new Set()); // 防止重复报告

  const images = Array.from(
    { length: 6 },
    (_, i) => `https://picsum.photos/seed/perf-mon-${i}/800/600`
  );

  // 稳定的 onReport 回调
  const handleReport = useCallback((data: { src: string; durationMs: number }) => {
    // 防止同一张图片重复报告
    if (reportedSrcsRef.current.has(data.src)) {
      console.log("[性能监控] 跳过重复报告:", data.src);
      return;
    }

    reportedSrcsRef.current.add(data.src);
    console.log("[性能监控] 新报告:", data);

    const newReport = {
      src: data.src,
      duration: data.durationMs,
      timestamp: Date.now(),
      index: loadCountRef.current++,
    };

    setPerformanceData((prev) => {
      const updated = [...prev, newReport];

      // 更新全局统计
      const totalImages = updated.length;
      const avgTime = updated.reduce((sum, r) => sum + r.duration, 0) / totalImages;

      setGlobalStats({
        totalImages,
        avgLoadTime: Math.round(avgTime),
      });

      return updated.slice(-10); // 保留最近10条
    });
  }, []);

  // 使用 useMemo 确保 LazyImage 只创建一次
  const LazyImage = useMemo(() => {
    return withPlugins(LazyLoadImageCore, [
      createFetchLoaderPlugin({ enabled: true }),
      createPerformanceMonitorPlugin({
        showOverlay: true,
        overlayPosition: "top-right",
        onReport: handleReport,
      }),
    ]);
  }, [handleReport]);

  return (
    <DemoLayout
      title="PerformanceMonitoring - 性能监控系统"
      description="完整的性能监控系统，包含实时报告、全局统计和性能分析"
    >
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            padding: 16,
            background: "#ecfdf5",
            borderRadius: "8px",
            border: "1px solid #10b981",
          }}
        >
          <p style={{ margin: 0, color: "#065f46", lineHeight: "1.6", marginBottom: 8 }}>
            📊 <strong>监控系统功能：</strong>
          </p>
          <ul style={{ margin: 0, color: "#065f46", lineHeight: "1.8" }}>
            <li>实时性能指标收集（TTFB、下载、解码）</li>
            <li>自动性能报告生成</li>
            <li>全局监控管理器（跨组件统计）</li>
            <li>性能阈值警告</li>
            <li>详细的性能分析报告</li>
          </ul>
        </div>
      </div>

      {/* 全局统计卡片 */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ fontSize: "1.1em", marginBottom: 12 }}>📈 全局统计</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 16,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "8px",
              color: "white",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2em", fontWeight: "bold" }}>
              {globalStats.totalImages}
            </div>
            <div style={{ fontSize: "0.9em", opacity: 0.9 }}>加载图片数</div>
          </div>
          <div
            style={{
              padding: 16,
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              borderRadius: "8px",
              color: "white",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2em", fontWeight: "bold" }}>
              {globalStats.avgLoadTime}ms
            </div>
            <div style={{ fontSize: "0.9em", opacity: 0.9 }}>平均加载时间</div>
          </div>
          <div
            style={{
              padding: 16,
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              borderRadius: "8px",
              color: "white",
              textAlign: "center",
            }}
          >
              <div style={{ fontSize: "2em", fontWeight: "bold" }}>
              {performanceData.length}
            </div>
            <div style={{ fontSize: "0.9em", opacity: 0.9 }}>报告数量</div>
          </div>
        </div>
      </div>

      {/* 图片展示 */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ fontSize: "1.1em", marginBottom: 12 }}>🖼️ 监控图片</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 16,
          }}
        >
          {images.map((src, i) => (
            <div key={src + i}>
              <div style={{ width: "100%", height: 150, position: "relative" }}>
                <LazyImage
                  src={src}
                  alt={`性能监控示例 ${i + 1}`}
                  loading="lazy"
                  containerStyle={{
                    width: "100%",
                    height: "100%",
                    background: "#f3f4f6",
                    borderRadius: "8px",
                  }}
                  imageStyle={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <p
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  fontSize: "0.85em",
                  color: "#666",
                }}
              >
                图片 {i + 1}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 实时性能报告 */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ fontSize: "1.1em", marginBottom: 12 }}>📋 实时性能报告</h3>
        {performanceData.length === 0 ? (
          <div
            style={{
              padding: 20,
              background: "#f9fafb",
              borderRadius: "8px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            等待性能数据收集中...（滚动页面以加载图片）
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {performanceData.map((report, i) => (
              <div
                key={i}
                onClick={() => setSelectedReport(i)}
                style={{
                  padding: 12,
                  background: selectedReport === i ? "#eff6ff" : "#f9fafb",
                  borderRadius: "8px",
                  border: `1px solid ${selectedReport === i ? "#3b82f6" : "#e5e7eb"}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.9em" }}>
                      图片 #{report.index + 1}
                    </strong>
                    <div style={{ fontSize: "0.8em", color: "#666", marginTop: 4 }}>
                      {new Date(report.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "1.1em",
                        fontWeight: "bold",
                        color: report.duration > 3000 ? "#dc2626" : report.duration > 1000 ? "#f59e0b" : "#16a34a",
                      }}
                    >
                      {report.duration}ms
                    </div>
                    <div style={{ fontSize: "0.8em", color: "#666" }}>
                      加载时长
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 详细指标 */}
      {selectedReport !== null && performanceData[selectedReport] && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: "1.1em", marginBottom: 12 }}>🔍 详细指标</h3>
          <div
            style={{
              padding: 16,
              background: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 0", fontWeight: 500 }}>图片索引</td>
                  <td style={{ padding: "8px 0", textAlign: "right", color: "#666" }}>
                    #{performanceData[selectedReport].index + 1}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 0", fontWeight: 500 }}>加载时长</td>
                  <td style={{ padding: "8px 0", textAlign: "right", color: "#666" }}>
                    {performanceData[selectedReport].duration}ms
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 0", fontWeight: 500 }}>加载时间</td>
                  <td style={{ padding: "8px 0", textAlign: "right", color: "#666" }}>
                    {new Date(performanceData[selectedReport].timestamp).toLocaleString()}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 0", fontWeight: 500 }}>图片URL</td>
                  <td style={{ padding: "8px 0", textAlign: "right", color: "#666", fontSize: "0.8em" }}>
                    {performanceData[selectedReport].src.substring(0, 50)}...
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0", fontWeight: 500 }}>性能等级</td>
                  <td style={{ padding: "8px 0", textAlign: "right" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.85em",
                        fontWeight: "bold",
                        background: performanceData[selectedReport].duration > 3000
                          ? "#fee2e2"
                          : performanceData[selectedReport].duration > 1000
                          ? "#fef3c7"
                          : "#d1fae5",
                        color: performanceData[selectedReport].duration > 3000
                          ? "#dc2626"
                          : performanceData[selectedReport].duration > 1000
                          ? "#f59e0b"
                          : "#16a34a",
                      }}
                    >
                      {performanceData[selectedReport].duration > 3000
                        ? "慢 (>3s)"
                        : performanceData[selectedReport].duration > 1000
                        ? "中等 (>1s)"
                        : "快 (<1s)"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API 使用示例 */}
      <div>
        <h3 style={{ fontSize: "1.1em", marginBottom: 12 }}>💻 API 使用示例</h3>
        <div
          style={{
            padding: 16,
            background: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <pre style={{ margin: 0, fontSize: "0.85em", overflow: "auto" }}>
{`import {
  LazyLoadImageCore,
  createPerformanceMonitorPlugin,
  withPlugins,
} from "vane-lazy-image";

// 使用性能监控插件
const LazyImage = withPlugins(LazyLoadImageCore, [
  createPerformanceMonitorPlugin({
    showOverlay: true,          // 显示性能叠加层
    overlayPosition: "top-right", // 叠加层位置
    onReport: (data) => {
      // 性能报告回调
      console.log("图片加载性能:", data);
      // {
      //   src: string,
      //   durationMs: number,
      //   network: NetworkInfo,
      //   device: DeviceInfo
      // }
    },
  }),
]);

// 使用组件
<LazyImage
  src="https://example.com/image.jpg"
  alt="示例图片"
/>`}
          </pre>
        </div>
      </div>
    </DemoLayout>
  );
};

export default PerformanceMonitoringDemo;

