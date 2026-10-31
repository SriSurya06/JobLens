import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../services/api';

import {
  Menu,
  X,
  Bell,
  UserRound,
  LogOut,
  KeyRound,
  LayoutDashboard,
  Building2,
  Users,
  Globe2,
  MessageSquare,
  Megaphone,
  ClipboardList,
  Bot,
  BriefcaseBusiness,
  Sparkles,
} from 'lucide-react';
const coordinatorNav = [
  { path: '/coordinator/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/coordinator/drives', icon: Building2, label: 'Drives' },
  { path: '/coordinator/students', icon: Users, label: 'Students' },
  { path: '/coordinator/notify', icon: Megaphone, label: 'Announcements' },
  { path: '/coordinator/audit', icon: ClipboardList, label: 'Audit Logs' },
];

const studentNav = [
  { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/student/drives', icon: Building2, label: 'On-Campus' },
  { path: '/student/offcampus', icon: Globe2, label: 'Off-Campus' },
  { path: '/student/profile', icon: UserRound, label: 'Profile' },
  { path: '/student/feedback', icon: MessageSquare, label: 'Feedback' },
  { path: '/student/ai', icon: Bot, label: 'AI Tools' },
];
function initials(nameOrEmail = '') {
  const base = nameOrEmail.split('@')[0];
  const parts = base.split(/[.\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const nav = user?.role === 'coordinator' ? coordinatorNav : studentNav;

  useEffect(() => {
    function onClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (user?.role !== 'student') return undefined;

    let mounted = true;
    const loadNotifications = async () => {
      try {
        const response = await studentAPI.getNotifications();
        if (mounted) {
          setNotifications(response.data.data.notifications || []);
          setUnreadCount(response.data.data.unreadCount || 0);
        }
      } catch {
        // The header should remain usable if notifications are temporarily unavailable.
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.role]);

  const markNotificationRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await studentAPI.markNotificationRead(notification._id);
      setNotifications((current) => current.map((item) =>
        item._id === notification._id ? { ...item, isRead: true } : item
      ));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      // Keep the dropdown responsive if marking read fails.
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await studentAPI.markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Leave the current state intact when the request fails.
    }
  };

  const clearNotifications = async () => {
    try {
      await studentAPI.clearNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // Keep the current list when clearing fails.
    }
  };

  const clearNotification = async (notification, event) => {
    event.stopPropagation();
    try {
      await studentAPI.clearNotification(notification._id);
      setNotifications((current) => current.filter((item) => item._id !== notification._id));
      if (!notification.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch {
      // Keep the notification visible when clearing fails.
    }
  };

  const openNotifications = async () => {
    setNotifOpen((open) => !open);
    if (user?.role !== 'student') return;

    try {
      const response = await studentAPI.getNotifications();
      setNotifications(response.data.data.notifications || []);
      setUnreadCount(response.data.data.unreadCount || 0);
    } catch {
      // Keep the existing notification list when refresh fails.
    }
  };

  const go = (path) => { navigate(path); setDrawerOpen(false); };

  return (
    <>
      <header className="app-header" role="banner">
        <div className="app-header-left">
          <button
            className="header-hamburger"
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
         <Menu size={21} strokeWidth={2} />
          </button>

          <button
            className="header-logo"
            style={{ background: 'none', border: 'none' }}
            onClick={() => go(nav[0].path)}
            aria-label="JobLens home"
          >
           <span
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '9px',
    fontWeight: 800,
    fontSize: '19px',
    letterSpacing: '-0.5px',
    color: 'var(--text-primary)',
  }}
>
  <span
    style={{
      width: '32px',
      height: '32px',
      borderRadius: '10px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--accent-primary)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(230,126,34,0.25)',
    }}
  >
    <BriefcaseBusiness size={18} strokeWidth={2.2} />
  </span>

  <span>
    Job<span style={{ color: 'var(--accent-primary)' }}>Lens</span>
  </span>
</span>
          </button>

          <nav className="header-nav" aria-label="Primary navigation">
            {nav.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  className={`header-nav-link ${active ? 'active' : ''}`}
                  onClick={() => go(item.path)}
                  aria-current={active ? 'page' : undefined}
                >
                  {(() => {
  const Icon = item.icon;
  return <Icon size={17} strokeWidth={2} aria-hidden="true" />;
})()}
{item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="app-header-right">
          {user?.role === 'student' && <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              className="header-icon-btn"
              aria-label="Notifications"
              onClick={openNotifications}
            >
              <Bell size={19} strokeWidth={2} />
              {unreadCount > 0 && <span className="header-notif-dot" />}
            </button>
            {notifOpen && (
              <div className="dropdown-menu" role="menu" style={{ minWidth: 320, maxWidth: 360, maxHeight: 520, overflowY: 'auto', overflowX: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px 10px', fontWeight: 700, fontSize: 13 }}>
                  <span>Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ''}</span>
                  <span style={{ display: 'inline-flex', gap: 10 }}>
                    {unreadCount > 0 && (
                      <button type="button" onClick={markAllNotificationsRead} style={{ border: 0, background: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button type="button" onClick={clearNotifications} style={{ border: 0, background: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                        Clear all
                      </button>
                    )}
                  </span>
                </div>
                <div className="dropdown-divider" />
                {user?.role !== 'student' || notifications.length === 0 ? (
                  <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>You're all caught up.</div>
                ) : <div style={{ maxHeight: 420, overflowY: 'auto' }}>{notifications.map((notification) => (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => markNotificationRead(notification)}
                    style={{ width: '100%', textAlign: 'left', border: 0, borderBottom: '1px solid var(--border)', background: notification.isRead ? 'transparent' : 'rgba(230,126,34,0.08)', padding: '10px 12px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: 12 }}>{notification.subject}</strong>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {!notification.isRead && <span style={{ color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700 }}>UNREAD</span>}
                        <button type="button" aria-label="Clear notification" onClick={(event) => clearNotification(notification, event)} style={{ border: 0, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.4, marginTop: 4 }}>{notification.message}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 5 }}>{notification.type} · {new Date(notification.createdAt).toLocaleString()}</div>
                  </button>
                ))}</div>}
              </div>
            )}
          </div>}

          <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              className="profile-menu-btn"
              onClick={() => setProfileOpen((o) => !o)}
              aria-label="Profile menu"
              aria-expanded={profileOpen}
            >
            <span className="avatar-circle">
  <UserRound size={18} strokeWidth={2} />
</span>
            </button>
            {profileOpen && (
              <div className="dropdown-menu" role="menu">
                <div style={{ padding: '6px 12px 10px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
                </div>
                <div className="dropdown-divider" />
                {user?.role === 'student' && (
                  <button className="dropdown-item" onClick={() => go('/student/profile')}>
                   <UserRound size={16} />
                    Profile
                  </button>
                )}
                <button className="dropdown-item" onClick={() => go('/change-password')}>
                  <KeyRound size={16} />
Change Password
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={logout}>
                  <LogOut size={16} />
                    Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="mobile-drawer" role="dialog" aria-label="Navigation menu">
            <div className="mobile-drawer-header">
              <span className="header-logo">JobLens</span>
              <button
                className="header-icon-btn"
                aria-label="Close navigation menu"
                onClick={() => setDrawerOpen(false)}
              >
                 <X size={20} strokeWidth={2} />
              </button>
            </div>
            <nav className="mobile-drawer-nav" aria-label="Mobile navigation">
              {nav.map((item) => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    className={`mobile-drawer-link ${active ? 'active' : ''}`}
                    onClick={() => go(item.path)}
                    aria-current={active ? 'page' : undefined}
                  >
                   {(() => {
  const Icon = item.icon;
  return <Icon size={17} strokeWidth={2} aria-hidden="true" />;
})()}
{item.label}
                  </button>
                );
              })}
            </nav>
            <div style={{ marginTop: 'auto', padding: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.email}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'capitalize' }}>{user?.role}</div>
              <button className="btn btn-danger" style={{ width: '100%' }} onClick={logout}>
                ⏻ Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
