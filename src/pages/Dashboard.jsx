import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Typography, Alert } from "antd";
import {
  Users,
  Building2,
  Wallet,
  HandCoins,
  Coins,
  Receipt,
  Package,
  ClipboardList,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { getDashboardSummaryAsync } from "../store/services/dashboardService.js";
import { asyncStatus } from "../utils/asyncStatus";
import StatCard from "../components/StatCard";
import "./Dashboard.css";

const { Title, Text } = Typography;

// Responsive column spans reused across every stat section.
// xs: 1 per row · sm: 2 per row · md: 3 per row · xl: N per row (set per section)
const COLS_5_PER_ROW = { xs: 24, sm: 12, md: 8, xl: 24 / 5 };
const COLS_3_PER_ROW = { xs: 24, sm: 12, md: 8 };

const formatNumber = (n) => (typeof n === "number" ? n.toLocaleString("en-PK") : "—");
const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user_data } = useSelector((state) => state.auth);
  const {
    statCards,
    recentActivity,
    charts,
    status: get_status,
    error: get_error,
  } = useSelector((state) => state.dashboard ?? {});

  const isLoading = get_status === asyncStatus.LOADING || get_status === asyncStatus.IDLE;
  const isError = get_status === asyncStatus.ERROR;

  useEffect(() => {
    if (get_status === asyncStatus.IDLE) dispatch(getDashboardSummaryAsync());
  }, [dispatch, get_status]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
      }),
    []
  );
  const formatCurrency = (n) => (typeof n === "number" ? currencyFormatter.format(n) : "—");

  const workforceStats = useMemo(
    () => [
      { key: "activeWorkers", icon: Users, label: "Active Workers", value: formatNumber(statCards?.activeWorkers), color: "#386CFF" },
      { key: "activeSites", icon: Building2, label: "Active Sites", value: formatNumber(statCards?.activeSites), color: "#22C55E" },
    ],
    [statCards]
  );

  const financeStats = useMemo(
    () => [
      { key: "monthlyPayroll", icon: Wallet, label: "Monthly Payroll", value: formatCurrency(statCards?.monthlyPayroll), color: "#386CFF" },
      { key: "advanceOutstanding", icon: HandCoins, label: "Advance Outstanding", value: formatCurrency(statCards?.advanceOutstanding), color: "#EAB308" },
      { key: "monthlySiteCost", icon: Coins, label: "Monthly Site Cost", value: formatCurrency(statCards?.monthlySiteCost), color: "#EF4444" },
    ],
    [statCards]
  );

  const payrollTrendMax = Math.max(...(charts?.monthlyPayrollTrend || []).map((item) => item.total), 1);
  const siteExpenseMax = Math.max(...(charts?.siteExpenseBreakdown || []).map((item) => item.total), 1);

  // const workStatusStats = useMemo(
  //   () => [
  //     { key: "pendingWork", icon: ListTodo, label: "Pending Work", value: formatNumber(dashboard?.pendingWork), color: "#EAB308" },
  //     { key: "inProgressWork", icon: Loader, label: "In Progress Work", value: formatNumber(dashboard?.inProgressWork), color: "#386CFF" },
  //     { key: "completedWork", icon: CheckCircle2, label: "Completed Work", value: formatNumber(dashboard?.completedWork), color: "#22C55E" },
  //   ],
  //   [dashboard]
  // );

  const renderSection = (title, stats, colSpan) => (
    <section className="dash-section">
      <Text className="dash-section-lbl">{title}</Text>
      <Row gutter={[16, 16]} className="dash-section-row">
        {stats.map(({ key, ...rest }) => (
          <Col key={key} {...colSpan}>
            <StatCard {...rest} loading={isLoading} />
          </Col>
        ))}
      </Row>
    </section>
  );

  return (
    <div className="dash-root">
      <header className="dash-header">
        <Title level={3} className="dash-greeting">
          Welcome back, <span className="dash-greeting-name">{user_data?.username || "Admin"}</span>
        </Title>
        <Text className="dash-subtitle">Here&apos;s today&apos;s workforce and work-order summary.</Text>
      </header>

      {isError && (
        <Alert
          className="dash-error-alert"
          type="error"
          showIcon
          icon={<AlertCircle size={16} />}
          message="Failed to load dashboard"
          description={
            typeof get_error === "string" ? get_error : "Please refresh the page or try again shortly."
          }
        />
      )}

      {renderSection("Workforce Overview", workforceStats, COLS_5_PER_ROW)}
      {renderSection("Financial Overview", financeStats, COLS_3_PER_ROW)}

      <section className="dash-section">
        <Text className="dash-section-lbl">Recent Activity</Text>
        <Row gutter={[16, 16]} className="dash-section-row">
          <Col xs={24} xl={8}>
            <div className="dash-data-panel">
              <div className="dash-panel-heading">
                <span className="dash-panel-icon dash-panel-icon--expense"><Receipt size={16} /></span>
                <span>Recent Expenses</span>
              </div>
              <div className="dash-activity-list">
                {(recentActivity?.expenses || []).map((item) => (
                  <div className="dash-activity-item" key={item._id}>
                    <div>
                      <strong>{item.siteId?.name || "Unknown site"}</strong>
                      <span>{item.category} · {formatDate(item.date)}</span>
                    </div>
                    <b>{formatCurrency(item.amount)}</b>
                  </div>
                ))}
                {!recentActivity?.expenses?.length && <span className="dash-empty">No recent expenses</span>}
              </div>
            </div>
          </Col>

          <Col xs={24} xl={8}>
            <div className="dash-data-panel">
              <div className="dash-panel-heading">
                <span className="dash-panel-icon dash-panel-icon--material"><Package size={16} /></span>
                <span>Recent Materials</span>
              </div>
              <div className="dash-activity-list">
                {(recentActivity?.materials || []).map((item) => (
                  <div className="dash-activity-item" key={item._id}>
                    <div>
                      <strong>{item.materialName}</strong>
                      <span>{item.siteId?.name || "Unknown site"} · {item.quantity} {item.unit}</span>
                    </div>
                    <b>{formatCurrency(item.estimatedValue)}</b>
                  </div>
                ))}
                {!recentActivity?.materials?.length && <span className="dash-empty">No recent materials</span>}
              </div>
            </div>
          </Col>

          <Col xs={24} xl={8}>
            <div className="dash-data-panel">
              <div className="dash-panel-heading">
                <span className="dash-panel-icon dash-panel-icon--work"><ClipboardList size={16} /></span>
                <span>Recent Daily Work</span>
              </div>
              <div className="dash-activity-list">
                {(recentActivity?.dailyWork || []).map((item) => (
                  <div className="dash-activity-item" key={item._id}>
                    <div>
                      <strong>{item.employerId?.name || "Unknown worker"}</strong>
                      <span>{item.workStatus} · {formatDate(item.entryDate)}</span>
                    </div>
                    <b>{formatCurrency(item.salary)}</b>
                  </div>
                ))}
                {!recentActivity?.dailyWork?.length && <span className="dash-empty">No recent daily work</span>}
              </div>
            </div>
          </Col>
        </Row>
      </section>

      <section className="dash-section">
        <Text className="dash-section-lbl">Trends & Breakdown</Text>
        <Row gutter={[16, 16]} className="dash-section-row">
          <Col xs={24} lg={8}>
            <div className="dash-data-panel dash-chart-panel">
              <div className="dash-panel-heading"><TrendingUp size={16} /> Monthly Payroll</div>
              {(charts?.monthlyPayrollTrend || []).map((item) => (
                <div className="dash-bar-row" key={`${item._id.y}-${item._id.m}`}>
                  <span>{item._id.m}/{item._id.y}</span>
                  <div className="dash-bar-track"><div className="dash-bar dash-bar--blue" style={{ width: `${(item.total / payrollTrendMax) * 100}%` }} /></div>
                  <b>{formatCurrency(item.total)}</b>
                </div>
              ))}
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div className="dash-data-panel dash-chart-panel">
              <div className="dash-panel-heading"><Receipt size={16} /> Site Expense Breakdown</div>
              {(charts?.siteExpenseBreakdown || []).map((item) => (
                <div className="dash-bar-row" key={item._id}>
                  <span className="dash-bar-label">{item.siteName}</span>
                  <div className="dash-bar-track"><div className="dash-bar dash-bar--red" style={{ width: `${(item.total / siteExpenseMax) * 100}%` }} /></div>
                  <b>{formatCurrency(item.total)}</b>
                </div>
              ))}
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div className="dash-data-panel dash-chart-panel">
              <div className="dash-panel-heading"><Users size={16} /> Attendance Overview</div>
              {(charts?.attendanceOverview || []).map((item) => (
                <div className="dash-attendance-row" key={item._id}>
                  <span className={`dash-attendance-dot dash-attendance-dot--${item._id}`} />
                  <span>{item._id}</span>
                  <b>{formatNumber(item.count)} workers</b>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default Dashboard;