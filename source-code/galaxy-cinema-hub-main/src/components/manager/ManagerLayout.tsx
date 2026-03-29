import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Film,
  Users,
  BarChart3,
  Calendar,
  LogOut,
  Menu,
  ChevronLeft,
  Building2,
  Bell,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { apiCall, API_ENDPOINTS } from "@/lib/api";

interface CinemaInfo {
  id: number;
  name: string;
  address: string;
  hall_count: number;
}

const ManagerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cinemaInfo, setCinemaInfo] = useState<CinemaInfo | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (user && user.role !== "manager" && user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Load cinema info for header
  const loadCinema = useCallback(async () => {
    try {
      const res = await apiCall<{ success: boolean; data: { cinema: CinemaInfo } }>(
        API_ENDPOINTS.MANAGER_CINEMA_INFO
      );
      if (res.success) setCinemaInfo(res.data.cinema);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) void loadCinema();
  }, [isAuthenticated, user, loadCinema]);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (!isAuthenticated || !user) return null;

  const navItems = [
    { label: "Dashboard",   path: "/manager",           icon: LayoutDashboard, exact: true },
    { label: "Lịch Chiếu",  path: "/manager/showtimes", icon: Calendar,        exact: false },
    { label: "Nhân Viên",   path: "/manager/staff",     icon: Users,           exact: false },
    { label: "Báo Cáo",     path: "/manager/reports",   icon: BarChart3,       exact: false },
  ];

  const isActive = (item: typeof navItems[0]) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const handleLogout = () => {
    logout();
  };

  // Sidebar content reused in both desktop and mobile views
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        {!collapsed && (
          <Link to="/manager" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Film className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Galaxy</span>
              <span className="font-light text-orange-400 text-sm ml-1">Manager</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30">
            <Film className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white/60"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Cinema name badge */}
      {!collapsed && cinemaInfo && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="text-xs font-semibold text-orange-400 truncate">{cinemaInfo.name}</span>
          </div>
          <p className="text-xs text-white/40 mt-0.5 truncate pl-5">{cinemaInfo.address}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                    active
                      ? "bg-gradient-to-r from-orange-500/90 to-amber-500/80 text-white shadow-lg shadow-orange-500/20"
                      : "text-white/50 hover:text-white hover:bg-white/8"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-300 rounded-r-full" />
                  )}
                  <item.icon className={cn("w-4.5 h-4.5 shrink-0 transition-all", active ? "text-white" : "text-white/40 group-hover:text-white/80")} />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-white/10">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/10 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-md">
              {(user.name || user.email || "M").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name || "Manager"}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Đăng xuất</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#0f0f18]">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar – Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col transition-all duration-300 ease-in-out",
          "bg-gradient-to-b from-[#12121f] to-[#0d0d1a] border-r border-white/5",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar – Mobile Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full flex flex-col w-72 lg:hidden",
          "bg-gradient-to-b from-[#12121f] to-[#0d0d1a] border-r border-white/5",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-white/5 bg-[#12121f]/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/60 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Cinema name in header */}
            <div className="flex items-center gap-2">
              {cinemaInfo ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <Building2 className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-sm font-semibold text-orange-400">{cinemaInfo.name}</span>
                    <span className="text-xs text-white/30 hidden md:block">·</span>
                    <span className="text-xs text-white/40 hidden md:block">{cinemaInfo.hall_count} phòng chiếu</span>
                  </div>
                </>
              ) : (
                <div className="h-8 w-40 rounded-lg bg-white/5 animate-pulse" />
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={() => void loadCinema()}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"
              title="Làm mới"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/8 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                  {(user.name || user.email || "M").charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white leading-none">{user.name || "Manager"}</p>
                  <p className="text-xs text-white/40 mt-0.5">Cinema Manager</p>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-white/40 transition-transform hidden sm:block", showUserMenu && "rotate-180")} />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-white/40 truncate">{user.email}</p>
                    </div>
                    {cinemaInfo && (
                      <div className="p-3 border-b border-white/10">
                        <p className="text-xs text-white/40 mb-1">Rạp quản lý</p>
                        <p className="text-sm text-orange-400 font-medium">{cinemaInfo.name}</p>
                      </div>
                    )}
                    <button
                      onClick={() => { setShowUserMenu(false); handleLogout(); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0f0f18]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;
