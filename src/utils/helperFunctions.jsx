
import React,{useCallback} from 'react'
import {
  UserPlus,
  Search,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Users,
  UserCheck,
  UserX,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "A";

export const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
};

export const Toast = ({ message, type }) => (
  <div className={`am-toast ${type}`}>
    {type === "success"
      ? <CheckCircle size={16} strokeWidth={2} />
      : <AlertCircle size={16} strokeWidth={2} />
    }
    {message}
  </div>
);

export const UserToast = ({ message, type }) => (
  <div className={`um-toast ${type}`}>
    {type === "success"
      ? <CheckCircle size={16} strokeWidth={2} />
      : <AlertCircle  size={16} strokeWidth={2} />
    }
    {message}
  </div>
);

export const getAvatarBg = (name = '') => {
  const AV_BG = ['#0C1036', '#1a2460', '#243080', '#2e3d9a', '#394db0'];
  return AV_BG[(name.charCodeAt(0) || 0) % AV_BG.length];
};

export const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const formatMsgTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

export const Avatar = ({ name, photoUrl, size = 40 }) => {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="msg-avatar-img"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className="msg-avatar-fallback"
      style={{ width: size, height: size, background: getAvatarBg(name) }}
    >
      {getInitials(name)}
    </div>
  );
};

export const formatCurrency = (value = 0) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

// export const formatDate = (date) => {
//   if (!date) return "—";

//   return new Intl.DateTimeFormat("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   }).format(new Date(date));
// };

export const getStatusLabel = (status) => {
  const labels = {
    pending: "Pending",
    in_factory: "In Factory",
    ready: "Ready",
    on_the_way: "On The Way",
    received: "Received",
    checked: "Checked",
    completed: "Completed",
    unpaid: "Unpaid",
    partially_paid: "Partially Paid",
    fully_paid: "Fully Paid",
    paid: "Paid",
    arrived: "Arrived",
  };

  return labels[status] || status?.replaceAll("_", " ") || "—";
};