import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Train,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  BarChart3,
  Bookmark,
  Search,
  Radio,
  MapPin,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: <Search size={16} /> },
  { label: 'Search Trains', to: '/search', icon: <Train size={16} /> },
  { label: 'Trains Catalog', to: '/trains', icon: <Train size={16} /> },
  { label: 'Stations', to: '/stations', icon: <MapPin size={16} /> },
  { label: 'PNR Status', to: '/pnr', icon: <BarChart3 size={16} /> },
  { label: 'Live Status', to: '/live-status', icon: <Radio size={16} /> },
  { label: 'My Bookings', to: '/my-bookings', icon: <Bookmark size={16} /> },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
      : 'text-slate-300 hover:text-white hover:bg-slate-700/60',
  ].join(' ');

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-slate-300 hover:text-white hover:bg-slate-700/60',
  ].join(' ');

// ─── Notification Panel ───────────────────────────────────────────────────────

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const handleMarkRead = async (id: number) => {
    await markRead(id);
  };

  const handleMarkAll = async () => {
    await markAllRead();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={28} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <button
              key={n.id}
              onClick={() => handleMarkRead(n.id)}
              className={[
                'w-full text-left px-4 py-3 border-b border-slate-700/60 last:border-0',
                'hover:bg-slate-700/50 transition-colors duration-150',
                !n.is_read ? 'bg-blue-900/20' : '',
              ].join(' ')}
            >
              <div className="flex items-start gap-2">
                {!n.is_read && (
                  <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                )}
                <div className={!n.is_read ? '' : 'pl-4'}>
                  <p className="text-xs text-white leading-snug line-clamp-2">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <div className="px-4 py-2 border-t border-slate-700 text-center">
          <Link
            to="/notifications"
            onClick={onClose}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AppLayout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  // Close mobile menu on route change
  const handleMobileNav = () => setMobileOpen(false);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
  };

  const handleProfileNav = (path: string) => {
    setUserMenuOpen(false);
    navigate(path);
  };

  const displayName =
    user ? (user.full_name || user.email) : 'Account';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Brand ── */}
            <Link
              to="/"
              className="flex items-center gap-2.5 flex-shrink-0 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-900/50 group-hover:bg-blue-500 transition-colors">
                <Train size={18} className="text-white" />
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="text-white font-extrabold text-lg tracking-tight">
                  Rail<span className="text-blue-400">One</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium -mt-1">
                  India's trusted railway booking platform
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-2">

              {/* Notification Bell */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((prev) => !prev);
                    setUserMenuOpen(false);
                  }}
                  aria-label="Notifications"
                  className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all duration-200"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <NotificationPanel onClose={() => setNotifOpen(false)} />
                )}
              </div>

              {/* User Menu */}
              <div ref={userMenuRef} className="relative hidden sm:block">
                <button
                  onClick={() => {
                    setUserMenuOpen((prev) => !prev);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all duration-200 max-w-[180px]"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-blue-400" />
                  </div>
                  <span className="text-sm font-medium truncate hidden lg:block">{displayName}</span>
                  <ChevronDown
                    size={14}
                    className={`flex-shrink-0 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden py-1">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      <p className="text-sm font-semibold text-white truncate mt-0.5">{displayName}</p>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <button
                        onClick={() => handleProfileNav('/profile')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                      >
                        <User size={15} className="text-slate-400" />
                        Profile
                      </button>
                      <button
                        onClick={() => handleProfileNav('/passengers')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                      >
                        <Bookmark size={15} className="text-slate-400" />
                        My Passengers
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleProfileNav('/admin')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 transition-colors"
                        >
                          <BarChart3 size={15} className="text-blue-400" />
                          Admin Dashboard
                        </button>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-700 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={15} className="text-red-400" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all duration-200"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ─────────────────────────────────────────────────── */}
        <div
          className={[
            'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
            mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0',
          ].join(' ')}
        >
          <div className="px-4 pb-4 pt-2 space-y-1 border-t border-slate-800">
            {/* User info strip */}
            <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-800/60 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
                <User size={16} className="text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Nav links */}
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={mobileNavLinkClass}
                onClick={handleMobileNav}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}

            <div className="border-t border-slate-700/60 my-2" />

            {/* Profile links */}
            <Link
              to="/profile"
              onClick={handleMobileNav}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <User size={16} className="text-slate-400" />
              Profile
            </Link>
            <Link
              to="/passengers"
              onClick={handleMobileNav}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <Bookmark size={16} className="text-slate-400" />
              My Passengers
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={handleMobileNav}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 transition-colors"
              >
                <BarChart3 size={16} className="text-blue-400" />
                Admin Dashboard
              </Link>
            )}

            <div className="border-t border-slate-700/60 my-2" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={16} className="text-red-400" />
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page Content ────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Train size={13} />
            <span>RailOne &copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-slate-500 text-xs">
            India's trusted railway booking platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export { AppLayout };
export default AppLayout;
