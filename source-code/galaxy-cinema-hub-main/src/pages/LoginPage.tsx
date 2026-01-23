import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Film, Eye, EyeOff, User, Shield, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      toast({
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn đến với Galaxy Cinema",
      });

      // Redirect based on role
      if (email === "admin@cinema.com") {
        navigate("/admin");
      } else if (email === "staff@cinema.com") {
        navigate("/staff");
      } else {
        navigate("/");
      }
    } else {
      toast({
        title: "Đăng nhập thất bại",
        description: "Email hoặc mật khẩu không chính xác",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const quickLogin = (role: "admin" | "staff" | "client") => {
    const credentials = {
      admin: { email: "admin@cinema.com", password: "admin123" },
      staff: { email: "staff@cinema.com", password: "staff123" },
      client: { email: "client@gmail.com", password: "client123" },
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-cinema relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 w-full">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 glow-orange">
            <Film className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 text-center">
            Galaxy Cinema
          </h1>
          <p className="text-white/80 text-lg max-w-md text-center mx-auto">
            Trải nghiệm điện ảnh đỉnh cao với hệ thống rạp chiếu phim hiện đại
            nhất Việt Nam
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Film className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                Galaxy Cinema
              </span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Đăng Nhập
            </h2>
            <p className="text-muted-foreground">Chào mừng bạn trở lại!</p>
          </div>

          {/* Quick Login Buttons */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Demo - Chọn vai trò:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin("admin")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs">Admin</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin("staff")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Headphones className="w-4 h-4 text-primary" />
                <span className="text-xs">Staff</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin("client")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <User className="w-4 h-4 text-primary" />
                <span className="text-xs">Client</span>
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-muted-foreground">Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="text-primary hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
            </Button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
            >
              Đăng ký ngay
            </Link>
          </p>

          <Link
            to="/"
            className="block text-center mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
