import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Typography, Alert } from "antd";
import {
  Users,
  Hammer,
  UserCog,
  UserCheck2,
  UserX2,
  Wallet,
  HandCoins,
  Clock3,
  ListTodo,
  Loader,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getDashboardAsync } from "../store/services/dashboardService";
import { asyncStatus } from "../utils/asyncStatus";
import StatCard from "../components/StatCard";
import "./Dashboard.css";

const { Title, Text } = Typography;

// Responsive column spans reused across every stat section.
// xs: 1 per row · sm: 2 per row · md: 3 per row · xl: N per row (set per section)
const COLS_5_PER_ROW = { xs: 24, sm: 12, md: 8, xl: 24 / 6 }; // 6 slots, 5 cards fit on one row
const COLS_3_PER_ROW = { xs: 24, sm: 12, md: 8 };

const formatNumber = (n) => (typeof n === "number" ? n.toLocaleString("en-PK") : "—");

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user_data } = useSelector((state) => state.auth);
  const { dashboard, get_status, get_error } = useSelector((state) => state.dashboard ?? {});

  const isLoading = get_status === asyncStatus.LOADING || get_status === asyncStatus.IDLE;
  const isError = get_status === asyncStatus.ERROR;

  useEffect(() => {
    if (get_status === asyncStatus.IDLE) dispatch(getDashboardAsync());
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
      { key: "totalWorkers", icon: Users, label: "Total Workers", value: formatNumber(dashboard?.totalWorkers), color: "#386CFF" },
      { key: "totalMazdoor", icon: Hammer, label: "Total Mazdoor", value: formatNumber(dashboard?.totalMazdoor), color: "#0C1036" },
      { key: "totalQarigar", icon: UserCog, label: "Total Qarigar", value: formatNumber(dashboard?.totalQarigar), color: "#64748B" },
      { key: "presentWorkers", icon: UserCheck2, label: "Present Workers", value: formatNumber(dashboard?.presentWorkers), color: "#22C55E" },
      { key: "absentWorkers", icon: UserX2, label: "Absent Workers", value: formatNumber(dashboard?.absentWorkers), color: "#EF4444" },
    ],
    [dashboard]
  );

  const financeStats = useMemo(
    () => [
      { key: "totalSalary", icon: Wallet, label: "Total Salary", value: formatCurrency(dashboard?.totalSalary), color: "#386CFF" },
      { key: "totalAdvance", icon: HandCoins, label: "Total Advance", value: formatCurrency(dashboard?.totalAdvance), color: "#EAB308" },
      { key: "totalOverTime", icon: Clock3, label: "Total Overtime", value: formatNumber(dashboard?.totalOverTime), suffix: "hrs", color: "#0C1036" },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dashboard]
  );

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
      {/* {renderSection("Work Status", workStatusStats, COLS_3_PER_ROW)}/ */}
    </div>
  );
};

export default Dashboard;