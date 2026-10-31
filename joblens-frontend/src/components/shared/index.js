import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
// ─── NEW ICON IMPORT ───
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Globe,
  Plus,
  Users,
  Bell,
  ClipboardList,
  User,
  MapPin,
  Bot,
  Link2,
  Shield,
  MessageCircle,
  LogOut,
  GraduationCap,
  UserCircle,
  Folder,
  Search,
  XCircle,
} from "react-icons/lu";

/* ─── ICON COMPONENT ─── */
const Icon = ({ name, size = 20, className = "" }) => {
  const icons = {
    grid: LayoutDashboard,
    chart: BarChart3,
    building: Building2,
    globe: Globe,
    plus: Plus,
    users: Users,
    bell: Bell,
    clipboard: ClipboardList,
    user: User,
    pin: MapPin,
    bot: Bot,
    link: Link2,
    shield: Shield,
    chat: MessageCircle,
    logout: LogOut,
    graduation: GraduationCap,
    student: UserCircle,
    folder: Folder,
    search: Search,
    close: XCircle,
  };
  const IconComponent = icons[name];
  return IconComponent ? (
    <IconComponent size={size} className={className} />
  ) : null;
};
/* ─── THEME SWITCHER (KEEPS EMOJIS) ─── */
export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-switcher">
      {[
        ["dark", "🌙"],
        ["light", "☀️"],
        ["college", "🏫"],
      ].map(([t, icon]) => (
        <button
          key={t}
          className={`theme-btn${theme === t ? " active" : ""}`}
          onClick={() => setTheme(t)}
          title={t}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};
/* ─── TOPBAR ─── */
export const Topbar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <div className="topbar">
      <span className="topbar-title">{title}</span>
      <div className="topbar-actions">
        <ThemeSwitcher />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--brand), var(--brand-dark))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.85rem",
              fontFamily: "var(--font-display)",
            }}
          >
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {user?.name}
          </span>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleLogout}
          title="Logout"
        >
          <Icon name="logout" size={16} /> Logout
        </button>
      </div>
    </div>
  );
};
/* ─── NAVIGATION DATA (EMOJIS → NAMES) ─── */
const COORD_NAV = [
  {
    section: "Overview",
    items: [
      { path: "/coordinator", label: "Dashboard", icon: "grid" },
      {
        path: "/coordinator/placements",
        label: "Track Placements",
        icon: "chart",
      },
    ],
  },
  {
    section: "Drives",
    items: [
      {
        path: "/coordinator/oncampus",
        label: "On-Campus Drives",
        icon: "building",
      },
      {
        path: "/coordinator/offcampus",
        label: "Off-Campus Drives",
        icon: "globe",
      },
      { path: "/coordinator/new-drive", label: "New Drive", icon: "plus" },
    ],
  },
  {
    section: "Students",
    items: [
      { path: "/coordinator/students", label: "Student List", icon: "users" },
      {
        path: "/coordinator/notifications",
        label: "Notifications",
        icon: "bell",
      },
      { path: "/coordinator/audit", label: "Audit Logs", icon: "clipboard" },
    ],
  },
];
const STUDENT_NAV = [
  {
    section: "Overview",
    items: [
      { path: "/student", label: "Dashboard", icon: "grid" },
      { path: "/student/profile", label: "My Profile", icon: "user" },
    ],
  },
  {
    section: "Drives",
    items: [
      { path: "/student/oncampus", label: "On-Campus", icon: "building" },
      { path: "/student/offcampus", label: "Off-Campus", icon: "globe" },
      { path: "/student/status", label: "Application Status", icon: "pin" },
    ],
  },
  {
    section: "AI Tools",
    items: [
      { path: "/student/resume-match", label: "Resume Match AI", icon: "bot" },
      { path: "/student/job-links", label: "Job Link Generator", icon: "link" },
      {
        path: "/student/fake-detect",
        label: "Fake Job Detector",
        icon: "shield",
      },
    ],
  },
  {
    section: "Community",
    items: [
      { path: "/student/feedback", label: "Company Feedback", icon: "chat" },
    ],
  },
];
/* ─── SIDEBAR ─── */
export const Sidebar = ({ role = "student" }) => {
  const nav = role === "coordinator" ? COORD_NAV : STUDENT_NAV;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">JL</div>
        <div>
          <div className="logo-text">JobLens</div>
          <div className="logo-sub">CCPDMS v1.0</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map((section) => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map((item) => (
              <button
                key={item.path}
                className={`nav-item${isActive(item.path) ? " active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <Icon name={item.icon} size={20} className="nav-item-icon" />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div
          style={{
            background: "var(--brand-bg)",
            border: "1px solid var(--border-accent)",
            borderRadius: "var(--radius)",
            padding: "10px 12px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Icon
              name={role === "coordinator" ? "graduation" : "student"}
              size={14}
            />
            {role === "coordinator" ? "Coordinator" : "Student"}
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              marginTop: "2px",
              color: "var(--text-primary)",
            }}
          >
            {user?.name || "User"}
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm w-full"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <Icon name="logout" size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
};
/* ─── ALL OTHER COMPONENTS (EXACTLY ORIGINAL) ─── */
export const Spinner = ({ size = "", text = "" }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      padding: 32,
    }}
  >
    <div className={`spinner${size === "lg" ? " spinner-lg" : ""}`} />
    {text && (
      <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
        {text}
      </span>
    )}
  </div>
);
export const EmptyState = ({ icon = "📭", title, msg, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <div className="empty-state-title">{title}</div>
    {msg && <div className="empty-state-msg">{msg}</div>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);
