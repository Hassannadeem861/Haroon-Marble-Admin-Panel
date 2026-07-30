import React from "react";
import { Card, Skeleton } from "antd";
import "./StatCard.css";

/**
 * StatCard
 * Reusable metric card used across the dashboard (and anywhere else a
 * single-number KPI needs to be shown). Pass a lucide-react icon component,
 * not a rendered element, via `icon`.
 */
const StatCard = ({ icon: Icon, label, value, suffix, color = "#386CFF", loading = false }) => {
  return (
    <Card
      className="stat-card"
      bordered
      styles={{ body: { padding: "18px 18px 16px" } }}
      style={{ borderRadius: 16, height: "100%", borderTop: `2.5px solid ${color}` }}
    >
      {loading ? (
        <Skeleton active title={{ width: "50%" }} paragraph={{ rows: 1, width: "70%" }} />
      ) : (
        <>
          <div
            className="stat-card-icon"
            style={{ background: `${color}17`, color }}
            aria-hidden="true"
          >
            {Icon && <Icon size={19} strokeWidth={1.8} />}
          </div>

          <div className="stat-card-value">
            {value}
            {suffix ? <span className="stat-card-suffix">{suffix}</span> : null}
          </div>

          <div className="stat-card-label">{label}</div>
        </>
      )}
    </Card>
  );
};

export default React.memo(StatCard);