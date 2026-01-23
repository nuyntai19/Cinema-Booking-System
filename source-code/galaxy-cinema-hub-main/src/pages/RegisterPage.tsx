import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Film,
  Eye,
  EyeOff,
  Mail,
  User as UserIcon,
  Phone,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập họ tên",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: "Lỗi",
        description: "Email không hợp lệ",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.phone.match(/^[0-9]{10,11}$/)) {
      toast({
        title: "Lỗi",
        description: "Số điện thoại không hợp lệ (10-11 số)",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.dob) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập ngày sinh",
        variant: "destructive",
      });
      return false;
    }

    // Validate age (must be at least 13 years old and not more than 100 years old)
    const birthDate = new Date(formData.dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const calculatedAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (calculatedAge < 13) {
      toast({
        title: "Lỗi",
        description: "Bạn phải đủ 13 tuổi để đăng ký tài khoản",
        variant: "destructive",
      });
      return false;
    }

    if (calculatedAge > 100) {
      toast({
        title: "Lỗi",
        description: "Ngày sinh không hợp lệ",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return false;
    }

    if (!acceptTerms) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đồng ý với điều khoản sử dụng",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Đăng ký thành công!",
        description: "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
      });
      navigate("/login");
      setIsLoading(false);
    }, 1500);
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
            Tham gia cộng đồng yêu điện ảnh lớn nhất Việt Nam và nhận ngay ưu
            đãi hấp dẫn
          </p>

          <div className="mt-8 space-y-3 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>Đặt vé nhanh chóng, tiện lợi</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>Tích điểm và nhận ưu đãi</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>Thông tin phim mới nhất</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Film className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                Galaxy Cinema
              </span>
            </Link>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Đăng Ký Tài Khoản
            </h2>
            <p className="text-muted-foreground">
              Tạo tài khoản mới để bắt đầu
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className="h-12 pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="h-12 pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0912345678"
                  className="h-12 pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Ngày sinh</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="h-12 pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ngày sinh dùng để kiểm tra độ tuổi khi đặt vé phim
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="h-12 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 rounded border-border"
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Tôi đồng ý với{" "}
                <a href="#" className="text-primary hover:underline">
                  Điều khoản dịch vụ
                </a>{" "}
                và{" "}
                <a href="#" className="text-primary hover:underline">
                  Chính sách bảo mật
                </a>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading ? "Đang đăng ký..." : "Đăng Ký"}
            </Button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Đăng nhập ngay
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

export default RegisterPage;
