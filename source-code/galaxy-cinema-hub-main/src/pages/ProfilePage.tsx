import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MembershipBadge from "@/components/ui/MembershipBadge";
import { systemConfig } from "@/data/mockData";
import {
  determineMembershipTier,
  getMembershipDiscount,
} from "@/lib/validation";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dob: user?.dob || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Simulate save
    toast({
      title: "Cập nhật thành công",
      description: "Thông tin của bạn đã được cập nhật",
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      dob: user?.dob || "",
    });
    setIsEditing(false);
  };

  const membershipTier = user?.membershipTier || "bronze";
  const totalSpent = user?.totalSpent || 0;
  const loyaltyPoints = user?.loyaltyPoints || 0;
  const discount = getMembershipDiscount(membershipTier, systemConfig);

  const getMembershipColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "bg-gradient-to-br from-purple-600 to-purple-800";
      case "gold":
        return "bg-gradient-to-br from-yellow-500 to-yellow-700";
      case "silver":
        return "bg-gradient-to-br from-gray-400 to-gray-600";
      case "bronze":
        return "bg-gradient-to-br from-orange-700 to-orange-900";
      default:
        return "bg-gradient-to-br from-gray-500 to-gray-700";
    }
  };

  const getMembershipName = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "Kim Cương";
      case "gold":
        return "Vàng";
      case "silver":
        return "Bạc";
      case "bronze":
        return "Đồng";
      default:
        return "Thành viên";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tài Khoản Của Tôi
          </h1>
          <p className="text-muted-foreground">
            Quản lý thông tin cá nhân và hạng thành viên
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Thông tin cá nhân</CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Chỉnh sửa
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Hủy
                    </Button>
                    <Button size="sm" onClick={handleSave} className="gap-2">
                      <Save className="w-4 h-4" />
                      Lưu
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Họ và tên</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dob">Ngày sinh</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="dob"
                        name="dob"
                        type="date"
                        value={formData.dob}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card>
              <CardHeader>
                <CardTitle>Bảo mật</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Mật khẩu</h4>
                    <p className="text-sm text-muted-foreground">
                      Đổi mật khẩu định kỳ để bảo mật tài khoản
                    </p>
                  </div>
                  <Button variant="outline">Đổi mật khẩu</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Membership Card */}
          <div className="space-y-6">
            <Card
              className={`${getMembershipColor(membershipTier)} text-white overflow-hidden relative`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-12 h-12" />
                  <MembershipBadge tier={membershipTier} size="md" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Hạng Thành Viên</h3>
                <p className="text-white/90 text-sm mb-4">
                  Bạn đang ở hạng {getMembershipName(membershipTier)}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tổng chi tiêu:</span>
                    <span className="font-bold">
                      {totalSpent.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Điểm tích lũy:</span>
                    <span className="font-bold">{loyaltyPoints} điểm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Giảm giá:</span>
                    <span className="font-bold">{discount}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ưu đãi thành viên</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                  <p className="text-sm">
                    Giảm giá {discount}% cho tất cả vé phim
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                  <p className="text-sm">
                    Tích điểm tự động:{" "}
                    {systemConfig.loyaltyPointsRate.toLocaleString("vi-VN")}đ =
                    1 điểm
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                  <p className="text-sm">Ưu tiên đặt vé sớm</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                  <p className="text-sm">Quà tặng sinh nhật đặc biệt</p>
                </div>
                {membershipTier !== "bronze" && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-xs font-medium text-primary">
                      🎉 Thăng hạng tiếp theo:
                      {membershipTier === "silver" &&
                        ` Vàng (${systemConfig.membershipTiers.gold.minSpent.toLocaleString("vi-VN")}đ)`}
                      {membershipTier === "gold" &&
                        ` Kim Cương (${systemConfig.membershipTiers.platinum.minSpent.toLocaleString("vi-VN")}đ)`}
                      {membershipTier === "platinum" &&
                        " Bạn đã đạt hạng cao nhất!"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;
