import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Building2,
  Calendar,
  CreditCard,
  Star,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Quản lý Phim', path: '/admin/movies', icon: Film },
    { label: 'Quản lý Rạp', path: '/admin/cinemas', icon: Building2 },
    { label: 'Lịch Chiếu', path: '/admin/scheduler', icon: Calendar },
    { label: 'Giao Dịch', path: '/admin/transactions', icon: CreditCard },
    { label: 'Đánh Giá', path: '/admin/reviews', icon: Star },
    { label: 'Cấu Hình', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-secondary text-secondary-foreground flex flex-col transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-secondary-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
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
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-secondary-foreground/70 hover:bg-sidebar-accent hover:text-secondary-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
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
                <span className="text-sm font-bold">{user?.name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-secondary-foreground/60 truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <Link to="/">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                'w-full text-secondary-foreground/70 hover:bg-sidebar-accent hover:text-secondary-foreground',
                collapsed ? 'px-0 justify-center' : 'justify-start'
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

export default AdminLayout;
