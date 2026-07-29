import React from "react";
import "./SkeletonLoader.css";

const SkeletonLine = ({ width = "100%", height = "12px" }) => (
  <div className="skeleton-line" style={{ width, height }} />
);

const SkeletonLoader = ({
  type = "table", // table, grid, list, dashboard, card
  rows = 8,
  columns = 9,
  cols = 3, // for grid layout
  showHeader = true,
  animationSpeed = "1.5s",
  gap = 16,
  cardHeight = "auto",
}) => {
  // Table Skeleton (for Agents, Clients management)
  if (type === "table") {
    return (
      <>
        {Array.from({ length: rows }).map((_, idx) => (
          <tr key={`skeleton-${idx}`}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <td key={`skeleton-col-${colIdx}`} className="skeleton-cell">
                {colIdx === 1 ? (
                  <div className="skeleton-user-cell">
                    <div className="skeleton-avatar" />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="skeleton-line" style={{ width: "70%" }} />
                      <div className="skeleton-line" style={{ width: "50%" }} />
                    </div>
                  </div>
                ) : colIdx === 0 ? (
                  <div className="skeleton-line" style={{ width: "30px" }} />
                ) : (
                  <div className="skeleton-line" />
                )}
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }

  // Grid Skeleton (for Quiz Categories, Dashboard cards)
  if (type === "grid") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))`, gap }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`grid-skeleton-${i}`} className="skeleton-grid-card" style={{ height: cardHeight }}>
            <SkeletonLine width="70%" height="18px" />
            <SkeletonLine width="100%" height="12px" style={{ marginTop: 12 }} />
            <SkeletonLine width="95%" height="12px" style={{ marginTop: 6 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div className="skeleton-icon" />
              <div className="skeleton-icon" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List Skeleton (for Quiz Questions)
  if (type === "list") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`list-skeleton-${i}`} className="skeleton-list-card" style={{ height: cardHeight }}>
            <SkeletonLine width="85%" height="16px" />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <SkeletonLine width="60px" height="18px" />
              <SkeletonLine width="60px" height="18px" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div className="skeleton-icon" style={{ width: 24, height: 24 }} />
              <div className="skeleton-icon" style={{ width: 24, height: 24 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Dashboard Skeleton
  if (type === "dashboard") {
    return (
      <div className="skeleton-dashboard-wrapper">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <SkeletonLine width="40%" height="32px" />
          <SkeletonLine width="25%" height="16px" style={{ marginTop: 8 }} />
        </div>

        {/* Stats Cards */}
        <SkeletonLine width="15%" height="16px" style={{ marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`stat-${i}`} className="skeleton-stat-card">
              <div className="skeleton-icon" style={{ width: 40, height: 40 }} />
              <SkeletonLine width="60%" height="24px" style={{ marginTop: 12 }} />
              <SkeletonLine width="80%" height="14px" style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>

        {/* Activity Cards */}
        <SkeletonLine width="12%" height="16px" style={{ marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`activity-${i}`} className="skeleton-stat-card">
              <div className="skeleton-icon" style={{ width: 32, height: 32 }} />
              <SkeletonLine width="50%" height="22px" style={{ marginTop: 12 }} />
              <SkeletonLine width="70%" height="13px" style={{ marginTop: 6 }} />
            </div>
          ))}
        </div>

        {/* Fleet Cards */}
        <SkeletonLine width="16%" height="16px" style={{ marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`fleet-${i}`} className="skeleton-stat-card">
              <SkeletonLine width="50%" height="14px" />
              <SkeletonLine width="40%" height="28px" style={{ marginTop: 12 }} />
              <SkeletonLine width="70%" height="12px" style={{ marginTop: 8 }} />
              <div style={{ height: 8, marginTop: 12, borderRadius: 4, background: "linear-gradient(90deg, var(--skeleton-bg, #e5e7eb) 25%, var(--skeleton-light, #f3f4f6) 50%, var(--skeleton-bg, #e5e7eb) 75%)", backgroundSize: "200% 100%", animation: "skeleton-loading 1.5s infinite" }} />
            </div>
          ))}
        </div>

        {/* Charts */}
        <SkeletonLine width="10%" height="16px" style={{ marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={`chart-${i}`} className="skeleton-stat-card" style={{ height: 280 }}>
              <SkeletonLine width="30%" height="16px" />
              <div style={{ marginTop: 20 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-end", marginTop: 12 }}>
                    <div style={{ flex: 1, height: `${Math.random() * 120 + 40}px`, borderRadius: 4, background: "linear-gradient(90deg, var(--skeleton-bg, #e5e7eb) 25%, var(--skeleton-light, #f3f4f6) 50%, var(--skeleton-bg, #e5e7eb) 75%)", backgroundSize: "200% 100%", animation: "skeleton-loading 1.5s infinite" }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
