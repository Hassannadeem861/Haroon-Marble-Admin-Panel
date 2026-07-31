import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GitMerge,
  MessageSquare,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Menu,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { logout } from "../store/slices/authSlice";
import { asyncStatus } from "../utils/asyncStatus";
import { ConfirmModal } from "../components/Modal";
import "./AdminLayout.css";

// import logoFull from "../assets/image/logo.png";
// import logoIcon from "../assets/image/mobilelogo.png";

// ─── NAV CONFIG ─────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      {
        key: "dashboard",
        Icon: LayoutDashboard,
        label: "Dashboard",
        path: "/dashboard",
      },
    ],
  },
  {
    label: "Management",
    items: [
      { key: 'users',  Icon: UserCheck, label: 'Users',  path: '/users' },
    ],
  },
  // {
  //   label: 'User Management',
  //   items: [
  //     { key: 'agents',  Icon: UserCheck, label: 'Agents',  path: '/agents' },
  //     { key: 'clients', Icon: Users,     label: 'Clients', path: '/clients' },
  //   ],
  // },
  {
    label: 'Platform',
    items: [
      // { key: 'matches',  Icon: GitMerge,      label: 'Matches',  path: '/matches' },
      // { key: 'messages', Icon: MessageSquare, label: 'Messages', path: '/messages' },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

// ─── COMPONENT ───────────────────────────────────────────────
const AdminLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user_data, user_role, logout_auth_status } = useSelector(
    (s) => s.auth,
  );

  // ── Local state
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const dropdownRef = useRef(null);

  const userName = user_data?.name || "User";
  const userRole = user_role?.replace(/_/g, " ").toUpperCase() || "USER";
  const isLoggingOut = logout_auth_status === asyncStatus.LOADING;

  // Filter nav items based on user role
  const getFilteredNavSections = () => {
    // Define role-based access mapping
    const roleAccess = {
      superAdmin: [
        "dashboard",
        "users",

      ],
      admin: [
        "dashboard",
        "users",
      ],
    };

    const allowedKeys = roleAccess[user_role] || roleAccess.superAdmin;

    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => allowedKeys.includes(item.key)),
    })).filter((section) => section.items.length > 0);
  };

  const filteredNavSections = getFilteredNavSections();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBurger = () => {
    if (isMobile) setMobileOpen((p) => !p);
    else setCollapsed((p) => !p);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    console.log("showLogoutModal: ", showLogoutModal)
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const activeKey = location.pathname.split("/")[1] || "dashboard";

  const sidebarCls = [
    "al-sidebar",
    !isMobile && collapsed ? "collapsed" : "",
    isMobile && mobileOpen ? "mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mainCls = ["al-main", !isMobile && collapsed ? "collapsed" : ""]
    .filter(Boolean)
    .join(" ");

  const currentItem = NAV_SECTIONS.flatMap((s) => s.items).find(
    (i) => i.key === activeKey,
  );
  const pageTitle = currentItem?.label || "Dashboard";

  return (
    <div className="al-root">
      {/* Overlay */}
      <div
        className={`al-overlay ${mobileOpen ? "show" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={sidebarCls}>
        {/* Logo */}
        <div className="al-logo" onClick={() => handleNavClick("/dashboard")}>
          <div className="al-logo-icon">
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: 26,
                height: 26,
                objectFit: "contain",
                borderRadius: 7,
              }}
            />
          </div>
          <div className="al-logo-brand">
            <span className="al-logo-title">Haroon Marble</span>
            <span className="al-logo-sub">Admin Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="al-nav">
          {filteredNavSections.map((section) => (
            <div key={section.label} className="al-nav-group">
              <div className="al-nav-group-label">{section.label}</div>
              {section.items.map(({ key, Icon, label, path, badge }) => (
                <div
                  key={key}
                  className={`al-nav-item ${activeKey === key ? "active" : ""}`}
                  onClick={() => handleNavClick(path)}
                  title={!isMobile && collapsed ? label : undefined}
                >
                  <span className="al-nav-icon">
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                  <span className="al-nav-label">{label}</span>
                  {badge && <span className="al-nav-badge">{badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="al-sidebar-footer">
          <div className="al-sidebar-user">
            <div
              className="al-user-av"
              style={{ cursor: "pointer" }}
              title="Edit Profile"
              onClick={() => navigate("/profile")}
            >
              {user_data?.avatar ? (
                <img src={user_data.avatar} alt={userName} />
              ) : (
                getInitials(userName)
              )}
            </div>
            <div className="al-user-meta">
              <div className="al-user-name">{userName}</div>
              <div className="al-user-role-txt">{userRole}</div>
            </div>
            <button
              className="al-logout-icon"
              onClick={() => setShowLogoutModal(true)}
              disabled={isLoggingOut}
              title="Logout"
            >
              <LogOut size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <div className={mainCls}>
        {/* Header */}
        <header className="al-header">
          <div className="al-header-left">
            <button
              className="al-burger"
              onClick={handleBurger}
              disabled={isLoggingOut}
              aria-label="Toggle sidebar"
            >
              <Menu size={18} strokeWidth={1.8} />
            </button>

            <div className="al-breadcrumb">
              {/* <span className="al-bc-root">VelocityAdmin</span> */}
              {/* <ChevronRight size={13} className="al-bc-sep" strokeWidth={2} /> */}
              {/* <span className="al-bc-page">{pageTitle}</span> */}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="al-content">{children}</main>
      </div>

      {showLogoutModal && (
        <ConfirmModal
          icon={LogOut}
          iconColor="#ef4444"
          title="Logout"
          message="Are you sure you want to logout from the admin panel?"
          confirmText="Yes, Logout"
          confirmClass="reject"
          loading={isLoggingOut}
          onConfirm={handleLogout}
          onClose={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
