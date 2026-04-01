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
  RefreshCw,
  Package,
} from "lucide-react";
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
    { label: "Dashboard",   path: "/manager",              icon: LayoutDashboard, exact: true },
    { label: "Lịch Chiếu",  path: "/manager/showtimes",    icon: Calendar,        exact: false },
    { label: "Nhân Viên",   path: "/manager/staff",        icon: Users,           exact: false },
    { label: "Bắp Nước",   path: "/manager/concessions", icon: Package,         exact: false },
    { label: "Báo Cáo",    path: "/manager/reports",      icon: BarChart3,       exact: false },
  ];

  const isActive = (item: typeof navItems[0]) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const handleLogout = () => { logout(); };

  // Sidebar content
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
        {!collapsed && (
          <Link to="/manager" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg flex items-center justify-center shadow-md shadow-orange-200">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-800 text-sm">Galaxy</span>
              <span className="font-light text-orange-500 text-sm ml-1">Manager</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg flex items-center justify-center mx-auto shadow-md shadow-orange-200">
            <Film className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Cinema name badge */}
      {!collapsed && cinemaInfo && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-orange-50 border border-orange-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="text-xs font-semibold text-orange-600 truncate">{cinemaInfo.name}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate pl-5">{cinemaInfo.address}</p>
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
                      ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md shadow-orange-200"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-300 rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-all",
                      active ? "text-white" : "text-gray-400 group-hover:text-gray-700"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + Logout section */}
      <div className="p-3 border-t border-gray-200 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm">
              {(user.name || user.email || "M").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user.name || "Manager"}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200",
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar – Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col transition-all duration-300 ease-in-out",
          "bg-white border-r border-gray-200 shadow-sm",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar – Mobile Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full flex flex-col w-72 lg:hidden",
          "bg-white border-r border-gray-200 shadow-lg",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-gray-200 bg-white shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Cinema badge in header */}
            {cinemaInfo ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200">
                <Building2 className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-sm font-semibold text-orange-600">{cinemaInfo.name}</span>
                <span className="text-xs text-gray-400 hidden md:block">·</span>
                <span className="text-xs text-gray-400 hidden md:block">{cinemaInfo.hall_count} phòng chiếu</span>
              </div>
            ) : (
              <div className="h-8 w-40 rounded-lg bg-gray-100 animate-pulse" />
            )}
          </div>

          {/* Right: chỉ giữ nút Refresh */}
          <button
            onClick={() => void loadCinema()}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;
