import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  UserCheck,
  GitMerge,
  TrendingUp,
  UserPlus,
  Heart,
  AlertCircle,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getDashboardAsync } from "../store/services/dashboardService";
import { asyncStatus } from "../utils/asyncStatus";
import "./Dashboard.css";
import SkeletonLoader from "../components/SkeletonLoader";

const PIE_COLORS  = ["#386CFF", "#0C1036"];
const BAR_COLORS  = ["#386CFF", "#0C1036", "#64748B"];
const MATCH_COLORS = ["#22C55E", "#EAB308", "#EF4444"];

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user_data } = useSelector((s) => s.auth);
  const { dashboard, get_status } = useSelector((s) => s.dashboard ?? {});

  const userName   = "Haroon Marble";
  // const userName   = user_data?.name || "Haroon Marble";
  const isLoading  = get_status === asyncStatus.LOADING || get_status === asyncStatus.IDLE;
  const isError    = get_status === asyncStatus.ERROR;

  useEffect(() => {
    if (get_status === asyncStatus.IDLE) dispatch(getDashboardAsync());
  }, [dispatch, get_status]);

  const users            = dashboard?.users            || {};
  const matches          = dashboard?.matches          || {};
  const activity         = dashboard?.activity         || {};
  const agentVerification = dashboard?.agentVerification || {};

  /* ── Stat cards ── */
  const STATS = useMemo(() => [
    {
      Icon: Users,
      value: users.total ?? "—",
      label: "Total Users",
      tag: "Users",
      footer: `${users.agents ?? 0} agents · ${users.clients ?? 0} clients`,
    },
    {
      Icon: UserCheck,
      value: users.agents ?? "—",
      label: "Total Agents",
      tag: "Agents",
      footer: `${users.verified ?? 0} verified`,
    },
    {
      Icon: Users,
      value: users.clients ?? "—",
      label: "Total Clients",
      tag: "Clients",
      footer: `${users.newThisMonth ?? 0} new this month`,
    },
    {
      Icon: TrendingUp,
      value: users.active ?? "—",
      label: "Active Users",
      tag: "Active",
      footer: `${activity.todayActiveUsers ?? 0} active today`,
    },
  ], [users, activity]);

  /* ── Key metrics ── */
  const METRICS = useMemo(() => [
    {
      Icon: GitMerge,
      value: matches.total ?? 0,
      label: "Total Matches",
      sub: `${matches.accepted ?? 0} accepted · ${matches.pending ?? 0} pending`,
    },
    {
      Icon: UserPlus,
      value: users.newThisMonth ?? 0,
      label: "New This Month",
      sub: "registrations this month",
    },
    {
      Icon: Heart,
      value: users.quizCompleted ?? 0,
      label: "Quiz Completed",
      sub: `out of ${users.total ?? 0} total users`,
    },
  ], [matches, users]);

  const hasPendingVerifications = (agentVerification.pending ?? 0) > 0;

  if (isLoading) return <SkeletonLoader type="dashboard" />;

  return (
    <div className="dash-root">

      {/* HEADER */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">
            Welcome back, <span className="dash-greeting-name">{userName}</span>
          </h1>
          <p className="dash-subtitle">Haroon Marble — Admin Overview</p>
        </div>
      </div>

      {isError && (
        <div className="dash-error">
          <AlertCircle size={15} strokeWidth={2} />
          Failed to load dashboard. Please refresh the page.
        </div>
      )}


      {/* ── STATS ── */}
      <p className="dash-section-lbl">Platform Overview</p>
      <div className="dash-stats">
        {STATS.map(({ Icon, value, label, tag, footer }) => (
          <div key={label} className="dash-stat">
            <div className="dash-stat-top">
              <div className="dash-stat-icon-wrap">
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <span className="dash-stat-tag">{tag}</span>
            </div>
            <div className="dash-stat-val">{value}</div>
            <div className="dash-stat-lbl">{label}</div>
            <div className="dash-stat-foot">
              <span className="dash-stat-fdot" />
              {footer}
            </div>
          </div>
        ))}
      </div>

      {/* ── KEY METRICS ── */}
      {/* <p className="dash-section-lbl">Key Metrics</p> */}
      {/* <div className="dash-activity-grid">
        {METRICS.map(({ Icon, value, label, sub }) => (
          <div key={label} className="dash-activity-card">
            <div className="dash-activity-icon">
              <Icon size={17} strokeWidth={1.8} />
            </div>
            <div className="dash-activity-val">{value}</div>
            <div className="dash-activity-lbl">{label}</div>
            <div className="dash-activity-sub">{sub}</div>
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default Dashboard;
