import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  Edit2,
  Save,
  X,
  Key,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MembershipBadge from "@/components/ui/MembershipBadge";
import LoyaltyHistoryCard from "@/components/profile/LoyaltyHistoryCard";
import UserVouchersCard from "@/components/profile/UserVouchersCard";
import { systemConfig } from "@/data/mockData";
import {
  determineMembershipTier,
  getMembershipDiscount,
} from "@/lib/validation";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import type {
  LoyaltyHistory,
  LoyaltyHistoryType,
  MembershipTier as MembershipTierType,
  VoucherStatus,
} from "@/types/cinema";

// ── API response shape ──
interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

// ── Raw backend record shapes (snake_case) ──
interface RawLoyaltyHistory {
  id: number;
  user_id: number;
  points_change: number;
  type: string;
  description: string;
  related_booking_id?: number;
  movie_title?: string;
  booking_amount?: number;
  booking_code?: string;
  created_at: string;
}

interface RawVoucher {
  id: number;
  user_id: number;
  promotion_id: number;
  voucher_code?: string;
  promo_code?: string;
  status: string;
  assigned_at: string;
  used_at?: string;
  end_date?: string;
  description: string;
  discount_amount: number;
  discount_type: string;
  min_order_value?: number;
  max_discount?: number;
}

// ── Mapped frontend voucher shape (camelCase) ──
interface MappedVoucher {
  id: string;
  userId: string;
  promotionId: string;
  code?: string;
  status: VoucherStatus;
  assignedAt: string;
  usedAt?: string;
  expiresAt?: string;
  description: string;
  discountAmount: number;
  discountType: string;
  minOrderValue: number;
  maxDiscount?: number;
}

interface UserTier {
  rank_name: string;
  total_spent: number;
  discount_rate: number;
  min_points_required: number;
}

interface MembershipTierInfo {
  id: number;
  rank_name: string;
  min_points_required: number;
  discount_rate: number;
}

interface RewardTier {
  promotion_id: number;
  code: string;
  description: string;
  discount_amount: number;
  discount_type: string;
  points_required: number;
}

interface PromotionItem {
  id: number;
  [key: string]: unknown;
}

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dob: user?.dob || "",
  });

  // Change password dialog state
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] =
    useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [permissionDenied, setPermissionDenied] = useState(false);

  // Load user profile data on mount — also check users.view_own permission
  useEffect(() => {
    const loadUserProfile = async () => {
      if (refreshUser) {
        await refreshUser();
      }
      // Check users.view_own permission via gated endpoint
      if (user?.id) {
        try {
          await apiCall(API_ENDPOINTS.USER_PROFILE(parseInt(user.id)));
        } catch (err: unknown) {
          if (err instanceof Error && err.message?.includes("quyền")) {
            setPermissionDenied(true);
          }
        }
      }
    };
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live data states
  const [liveLoyaltyHistory, setLiveLoyaltyHistory] = useState<
    LoyaltyHistory[]
  >([]);
  const [liveUserVouchers, setLiveUserVouchers] = useState<MappedVoucher[]>([]);
  const [livePromotions, setLivePromotions] = useState<PromotionItem[]>([]);
  const [liveCurrentPoints, setLiveCurrentPoints] = useState<number>(0);
  const [liveUserTier, setLiveUserTier] = useState<UserTier | null>(null);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [allMembershipTiers, setAllMembershipTiers] = useState<
    MembershipTierInfo[]
  >([]);

  // Helper to reload points + vouchers + tier after redeem
  const refreshProfileData = async () => {
    if (!user?.id) return;
    const uid = parseInt(user.id);
    try {
      const cpJson = await apiCall<ApiResponse>(
        API_ENDPOINTS.LOYALTY_POINTS(uid),
      );
      if (cpJson.success)
        setLiveCurrentPoints((cpJson.data?.current_points as number) || 0);
      const uvJson = await apiCall<ApiResponse>(
        `${API_ENDPOINTS.USER_VOUCHERS(uid)}?status=all`,
      );
      if (uvJson.success)
        setLiveUserVouchers(
          mapVouchers((uvJson.data?.vouchers as RawVoucher[]) || []),
        );
      const lhJson = await apiCall<ApiResponse>(
        API_ENDPOINTS.LOYALTY_HISTORY(uid),
      );
      if (lhJson.success)
        setLiveLoyaltyHistory(
          mapHistory((lhJson.data?.history as RawLoyaltyHistory[]) || []),
        );
      // Re-fetch tier (may have changed after point deduction)
      const utJson = await apiCall<ApiResponse>(
        API_ENDPOINTS.MEMBERSHIP_USER_TIER(uid),
      );
      if (utJson.success)
        setLiveUserTier((utJson.data?.tier as UserTier) || null);
    } catch {
      /* silent */
    }
  };

  // Map backend snake_case → frontend camelCase
  const mapHistory = (items: RawLoyaltyHistory[]): LoyaltyHistory[] =>
    items.map((h) => ({
      id: String(h.id),
      userId: String(h.user_id),
      pointsChange: Number(h.points_change),
      type: h.type as LoyaltyHistoryType,
      description: h.description,
      bookingId: h.related_booking_id
        ? String(h.related_booking_id)
        : undefined,
      movieTitle: h.movie_title || undefined,
      bookingAmount: h.booking_amount ? Number(h.booking_amount) : undefined,
      bookingCode: h.booking_code || undefined,
      createdAt: h.created_at,
    }));

  const mapVouchers = (items: RawVoucher[]): MappedVoucher[] =>
    items.map((v) => ({
      id: String(v.id),
      userId: String(v.user_id),
      promotionId: String(v.promotion_id),
      code: v.voucher_code || v.promo_code,
      status: v.status as VoucherStatus,
      assignedAt: v.assigned_at,
      usedAt: v.used_at || undefined,
      expiresAt: v.end_date || undefined,
      // Carry promo details for display
      description: v.description,
      discountAmount: Number(v.discount_amount),
      discountType: v.discount_type,
      minOrderValue: Number(v.min_order_value || 0),
      maxDiscount: v.max_discount ? Number(v.max_discount) : undefined,
    }));

  // Fetch loyalty history, vouchers, promotions, points and tier for current user
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      const uid = parseInt(user.id);
      try {
        // Check and auto-upgrade tier first
        try {
          await apiCall(API_ENDPOINTS.MEMBERSHIP_CHECK_UPGRADE(uid));
        } catch {
          /* silent */
        }

        // Loyalty history
        const lhJson = await apiCall<ApiResponse>(
          API_ENDPOINTS.LOYALTY_HISTORY(uid),
        );
        if (lhJson.success)
          setLiveLoyaltyHistory(
            mapHistory((lhJson.data?.history as RawLoyaltyHistory[]) || []),
          );

        // Current points
        const cpJson = await apiCall<ApiResponse>(
          API_ENDPOINTS.LOYALTY_POINTS(uid),
        );
        if (cpJson.success)
          setLiveCurrentPoints((cpJson.data?.current_points as number) || 0);

        // User tier (after upgrade check)
        const utJson = await apiCall<ApiResponse>(
          API_ENDPOINTS.MEMBERSHIP_USER_TIER(uid),
        );
        if (utJson.success)
          setLiveUserTier((utJson.data?.tier as UserTier) || null);

        // All membership tiers (for next-tier calculation)
        const allTiersJson = await apiCall<ApiResponse>(
          API_ENDPOINTS.MEMBERSHIPS,
        );
        if (allTiersJson.success)
          setAllMembershipTiers(
            (allTiersJson.data?.memberships as MembershipTierInfo[]) || [],
          );

        // User vouchers (all statuses for profile)
        const uvJson = await apiCall<ApiResponse>(
          `${API_ENDPOINTS.USER_VOUCHERS(uid)}?status=all`,
        );
        if (uvJson.success)
          setLiveUserVouchers(
            mapVouchers((uvJson.data?.vouchers as RawVoucher[]) || []),
          );

        // Promotions
        const pJson = await apiCall<ApiResponse>(API_ENDPOINTS.PROMOTIONS);
        if (pJson.success)
          setLivePromotions((pJson.data?.promotions as PromotionItem[]) || []);

        // Reward tiers
        const rtJson = await apiCall<ApiResponse>(API_ENDPOINTS.REWARD_TIERS);
        if (rtJson.success)
          setRewardTiers((rtJson.data?.tiers as RewardTier[]) || []);
      } catch (err) {
        console.error("Error fetching profile related data", err);
      }
    };
    fetchData();
  }, [user?.id]);

  // Redeem points for voucher
  const handleRedeemPoints = async (
    promoCode: string,
    pointsRequired: number,
  ) => {
    if (!user?.id) return;
    setIsRedeeming(promoCode);
    try {
      const res = await apiCall<ApiResponse>(
        API_ENDPOINTS.REDEEM_POINTS_VOUCHER,
        {
          method: "POST",
          body: JSON.stringify({
            user_id: parseInt(user.id),
            promotion_code: promoCode,
          }),
        },
      );
      if (res.success) {
        toast({
          title: "Đổi voucher thành công!",
          description: `Bạn đã dùng ${pointsRequired} điểm để đổi voucher. Kiểm tra phần Voucher Của Tôi.`,
        });
        await refreshProfileData();
      } else {
        toast({
          title: "Không thể đổi voucher",
          description: res.message || "Vui lòng thử lại",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description:
          err instanceof Error ? err.message : "Không thể đổi voucher",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(null);
    }
  };

  // Sync formData when user data loads/changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        dob: user.dob || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập lại",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    console.log("💾 Saving profile...", formData);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Chưa đăng nhập");
      }

      // Call API to update profile
      const response = await fetch(
        `${API_ENDPOINTS.USERS}/${user.id}/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: formData.name,
            phone: formData.phone,
            dob: formData.dob,
          }),
        },
      );

      const data = await response.json();
      console.log("📦 Profile update response:", data);

      if (data.success) {
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin của bạn đã được cập nhật",
        });
        setIsEditing(false);

        // Refresh user data if available
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        throw new Error(data.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      toast({
        title: "Lỗi cập nhật",
        description:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật thông tin",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

  const handleChangePassword = async () => {
    if (!user?.id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập lại",
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới không khớp",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    console.log("🔐 Changing password...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Chưa đăng nhập");
      }

      const response = await fetch(
        API_ENDPOINTS.CHANGE_PASSWORD(parseInt(user.id)),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            old_password: passwordData.oldPassword,
            new_password: passwordData.newPassword,
          }),
        },
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Non-JSON response:", text.substring(0, 200));
        throw new Error(
          "Server trả về lỗi. Vui lòng kiểm tra lại hoặc liên hệ admin.",
        );
      }

      const data = await response.json();
      console.log("📦 Change password response:", data);

      if (data.success) {
        toast({
          title: "Đổi mật khẩu thành công",
          description:
            "Mật khẩu của bạn đã được cập nhật. Email thông báo đã được gửi đến hộp thư của bạn.",
        });
        setIsChangePasswordDialogOpen(false);
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        throw new Error(data.message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      console.error("❌ Error changing password:", error);
      toast({
        title: "Lỗi đổi mật khẩu",
        description:
          error instanceof Error ? error.message : "Không thể đổi mật khẩu",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const membershipTier = (liveUserTier?.rank_name?.toLowerCase() ||
    user?.membershipTier ||
    "bronze") as MembershipTierType;
  const totalSpent = liveUserTier?.total_spent || 0;
  const loyaltyPoints = liveCurrentPoints || user?.loyaltyPoints || 0;
  const discount = liveUserTier?.discount_rate
    ? Number(liveUserTier.discount_rate)
    : getMembershipDiscount(membershipTier, systemConfig);

  // Calculate next tier info
  const getNextTierInfo = () => {
    if (!liveUserTier || allMembershipTiers.length === 0) return null;
    const currentMinPoints = Number(liveUserTier.min_points_required);
    // Find the next tier with higher min_points_required
    const sorted = [...allMembershipTiers].sort(
      (a, b) => Number(a.min_points_required) - Number(b.min_points_required),
    );
    const nextTier = sorted.find(
      (t) => Number(t.min_points_required) > currentMinPoints,
    );
    if (!nextTier) return null; // Already at highest tier
    const pointsNeeded = Number(nextTier.min_points_required) - loyaltyPoints;
    return {
      name: nextTier.rank_name,
      pointsNeeded: Math.max(0, pointsNeeded),
      minPoints: Number(nextTier.min_points_required),
      discount: Number(nextTier.discount_rate),
    };
  };
  const nextTierInfo = getNextTierInfo();

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

      {permissionDenied ? (
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Không có quyền truy cập
          </h1>
          <p className="text-muted-foreground">
            Bạn không có quyền xem trang cá nhân. Vui lòng liên hệ quản trị
            viên.
          </p>
        </div>
      ) : (
        <>
          <div className="container mx-auto px-4 py-6 md:py-8">
            {/* Page Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Tài Khoản Của Tôi
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Quản lý thông tin cá nhân và hạng thành viên
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {/* Profile Info Card */}
              <div className="md:col-span-2 space-y-4 md:space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3 md:pb-6">
                    <CardTitle className="text-lg md:text-xl">
                      Thông tin cá nhân
                    </CardTitle>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-1 md:gap-2 text-xs md:text-sm"
                      >
                        <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Chỉnh sửa</span>
                        <span className="sm:hidden">Sửa</span>
                      </Button>
                    ) : (
                      <div className="flex gap-1 md:gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="gap-1 text-xs md:text-sm"
                        >
                          <X className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Hủy</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving}
                          className="gap-1 text-xs md:text-sm"
                        >
                          <Save className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">
                            {isSaving ? "Đang lưu..." : "Lưu"}
                          </span>
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3 md:gap-4 pb-3 md:pb-4 border-b">
                      <Avatar className="w-16 h-16 md:w-20 md:h-20">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="text-xl md:text-2xl">
                          {user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold">
                          {user?.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground">
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
                      <Button
                        variant="outline"
                        onClick={() => setIsChangePasswordDialogOpen(true)}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Đổi mật khẩu
                      </Button>
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
                        <span className="font-bold">
                          {loyaltyPoints.toLocaleString("vi-VN")} điểm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giảm giá:</span>
                        <span className="font-bold">{discount}%</span>
                      </div>
                    </div>

                    {/* Next tier progress */}
                    {nextTierInfo ? (
                      <div className="mt-4 pt-3 border-t border-white/20">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Hạng tiếp theo: {nextTierInfo.name}</span>
                          <span>
                            Còn{" "}
                            {nextTierInfo.pointsNeeded.toLocaleString("vi-VN")}{" "}
                            điểm
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-white rounded-full h-2 transition-all"
                            style={{
                              width: `${Math.min(100, (loyaltyPoints / nextTierInfo.minPoints) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-white/70 mt-1">
                          {loyaltyPoints.toLocaleString("vi-VN")} /{" "}
                          {nextTierInfo.minPoints.toLocaleString("vi-VN")} điểm
                        </p>
                      </div>
                    ) : membershipTier === "platinum" ? (
                      <div className="mt-4 pt-3 border-t border-white/20">
                        <p className="text-xs text-white/90 font-medium">
                          🏆 Bạn đã đạt hạng cao nhất!
                        </p>
                      </div>
                    ) : null}
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
                        Giảm giá {discount}% cho tất cả vé xem phim
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                      <p className="text-sm">
                        Tích điểm tự động:{" "}
                        {systemConfig.loyaltyPointsRate.toLocaleString("vi-VN")}
                        đ = 1 điểm
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
                    {nextTierInfo && (
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                        <p className="text-xs font-medium text-primary">
                          🎉 Thăng hạng tiếp theo: {nextTierInfo.name} — cần
                          thêm{" "}
                          {nextTierInfo.pointsNeeded.toLocaleString("vi-VN")}{" "}
                          điểm (giảm {nextTierInfo.discount}% mỗi vé)
                        </p>
                      </div>
                    )}
                    {!nextTierInfo && membershipTier === "platinum" && (
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                        <p className="text-xs font-medium text-primary">
                          🏆 Bạn đã đạt hạng cao nhất!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Loyalty History & Vouchers */}
              <div className="md:col-span-3 grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-6">
                  {/* User Vouchers */}
                  <UserVouchersCard
                    vouchers={liveUserVouchers}
                    promotions={livePromotions}
                    currentPoints={liveCurrentPoints}
                    rewardTiers={rewardTiers}
                    isRedeeming={isRedeeming}
                    onRedeemPoints={handleRedeemPoints}
                    onUseVoucher={(voucherId) => {
                      toast({
                        title: "Sử dụng voucher",
                        description: "Hãy áp dụng mã voucher khi thanh toán",
                      });
                    }}
                  />
                </div>

                <div className="space-y-6">
                  {/* Loyalty History */}
                  <LoyaltyHistoryCard history={liveLoyaltyHistory} />
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Dialog */}
          <Dialog
            open={isChangePasswordDialogOpen}
            onOpenChange={setIsChangePasswordDialogOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Đổi Mật Khẩu
                </DialogTitle>
                <DialogDescription>
                  Nhập mật khẩu cũ và mật khẩu mới để thay đổi
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="old-password">Mật khẩu cũ *</Label>
                  <Input
                    id="old-password"
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        oldPassword: e.target.value,
                      })
                    }
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Mật khẩu mới *</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Xác nhận mật khẩu mới *
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>ℹ️ Lưu ý:</strong> Sau khi đổi mật khẩu thành công,
                    một email thông báo sẽ được gửi đến địa chỉ email của bạn.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangePasswordDialogOpen(false);
                    setPasswordData({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  disabled={isChangingPassword}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      <Footer />
    </div>
  );
};

export default ProfilePage;
