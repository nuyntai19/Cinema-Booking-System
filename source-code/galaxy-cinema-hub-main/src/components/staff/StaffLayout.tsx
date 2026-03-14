import React, { useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { QrCode, ShoppingCart, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AppContext";
import NotificationDropdown from "@/components/NotificationDropdown";

const StaffLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // Check authentication and redirect if not logged in or not staff
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    // Check if user is staff, manager, or admin
    if (
      user &&
      user.role !== "staff" &&
      user.role !== "manager" &&
      user.role !== "admin"
    ) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Don't render anything while checking authentication
  if (!isAuthenticated || !user) {
    return null;
  }

  const navItems = [
    { path: "/staff/scanner", label: "Quét Vé", icon: QrCode },
    { path: "/staff/pos", label: "Bán Vé", icon: ShoppingCart },
  ];

  const handleLogout = () => {
    logout();
    // No need to navigate manually, logout() will redirect to home
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#0B1E45] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Galaxy Cinema</h1>
                <p className="text-sm text-white/70">
                  Nhân Viên: {user?.email || "staff@cinema.com"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <Button
                variant="ghost"
                className="text-white hover:text-white hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-2" />
                Đăng Xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default StaffLayout;
