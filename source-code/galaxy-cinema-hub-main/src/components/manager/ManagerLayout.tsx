import React, { useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Film,
  Users,
  Building2,
  Ticket,
  Coffee,
  Calendar,
  CreditCard,
  Star,
  Bell,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ManagerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Check authentication and redirect if not logged in or not manager
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Check if user is manager or admin
    if (user && user.role !== 'manager' && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Don't render anything while checking authentication
  if (!isAuthenticated || !user) {
    return null;
  }

  const navItems = [
    { label: "Dashboard", path: "/manager", icon: LayoutDashboard },
    { label: "Quản lý Phim", path: "/manager/movies", icon: Film },
    { label: "Quản lý Rạp", path: "/manager/cinemas", icon: Building2 },
    { label: "Lịch Chiếu", path: "/manager/scheduler", icon: Calendar },
    { label: "Bắp Nước", path: "/manager/concessions", icon: Coffee },
    { label: "Khuyến Mãi", path: "/manager/promotions", icon: Ticket },
    { label: "Giao Dịch", path: "/manager/transactions", icon: CreditCard },
    { label: "Đánh Giá", path: "/manager/reviews", icon: Star },
    { label: "Thông Báo", path: "/manager/notifications", icon: Bell },
    { label: "Nhân Viên", path: "/manager/staff", icon: Users },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-secondary text-secondary-foreground flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link to="/manager" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Manager</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-secondary-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-secondary-foreground/70 hover:bg-sidebar-accent hover:text-secondary-foreground",
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-bold">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-secondary-foreground/60 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          )}
          <Link to="/">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full text-secondary-foreground/70 hover:bg-sidebar-accent hover:text-secondary-foreground",
                collapsed ? "px-0 justify-center" : "justify-start",
              )}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="ml-3">Đăng xuất</span>}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;
