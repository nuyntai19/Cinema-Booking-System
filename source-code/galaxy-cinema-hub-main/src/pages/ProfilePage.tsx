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
  Crown,
  Sparkles,
  ShieldCheck,
  Ticket,
  Gift,
  History,
  Film,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Wifi,
  Zap,
  Tag,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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
    : membershipTier === "platinum"
      ? 15
      : membershipTier === "gold"
        ? 10
        : membershipTier === "silver"
          ? 5
          : 0;

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

  const getMembershipCardConfig = (tier: string) => {
    switch (tier) {
      case "platinum":
        return {
          gradient: "bg-gradient-to-br from-[#1e0836] via-[#3b0764] to-[#0f172a]",
          border: "border-purple-400/40",
          accentColor: "text-purple-300",
          badgeBg: "bg-purple-500/25 text-purple-200 border-purple-400/30",
          glow: "shadow-[0_20px_50px_rgba(147,51,234,0.3)]",
          chipColor: "from-amber-200 via-yellow-400 to-amber-300",
          name: "Kim Cương",
          icon: Crown,
        };
      case "gold":
        return {
          gradient: "bg-gradient-to-br from-[#78350f] via-[#b45309] to-[#451a03]",
          border: "border-amber-400/50",
          accentColor: "text-amber-200",
          badgeBg: "bg-amber-400/25 text-amber-100 border-amber-400/40",
          glow: "shadow-[0_20px_50px_rgba(245,158,11,0.3)]",
          chipColor: "from-amber-100 via-yellow-300 to-amber-400",
          name: "Vàng",
          icon: Crown,
        };
      case "silver":
        return {
          gradient: "bg-gradient-to-br from-[#334155] via-[#475569] to-[#1e293b]",
          border: "border-slate-300/50",
          accentColor: "text-slate-200",
          badgeBg: "bg-slate-300/25 text-slate-100 border-slate-300/40",
          glow: "shadow-[0_20px_50px_rgba(148,163,184,0.25)]",
          chipColor: "from-slate-100 via-gray-300 to-slate-200",
          name: "Bạc",
          icon: Award,
        };
      case "bronze":
      default:
        return {
          gradient: "bg-gradient-to-br from-[#6d2508] via-[#8c370d] to-[#3b1204]",
          border: "border-orange-500/40",
          accentColor: "text-orange-200",
          badgeBg: "bg-orange-500/25 text-orange-100 border-orange-500/30",
          glow: "shadow-[0_20px_50px_rgba(194,65,12,0.3)]",
          chipColor: "from-amber-200 via-yellow-400 to-amber-300",
          name: "Đồng",
          icon: Award,
        };
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

  const cardConfig = getMembershipCardConfig(membershipTier);
  const TierIcon = cardConfig.icon;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
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
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* ── Top Profile Summary Banner ── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-card to-primary/5 border border-border p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-primary/30 shadow-md">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-black">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    title="Tài khoản đã kích hoạt"
                  >
                    ✓
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {user?.name || "Khách Hàng Galaxy"}
                    </h1>
                    <Badge className="bg-primary/15 hover:bg-primary/20 text-primary border border-primary/30 font-bold text-xs px-2.5 py-0.5 rounded-lg shadow-none">
                      {user?.role === "admin" ? "Quản Trị Viên" : "Thành Viên Galaxy"}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                    <span>{user?.email}</span>
                    <span>•</span>
                    <span className="font-semibold text-foreground">
                      Hạng: {getMembershipName(membershipTier)}
                    </span>
                    <span>•</span>
                    <span>Mã TV: GC-{user?.id ? String(user.id).padStart(4, "0") : "0001"}</span>
                  </p>
                </div>
              </div>

              {/* Quick Stat Highlights */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-4 py-2.5 rounded-2xl bg-card/90 border border-border shadow-sm flex items-center gap-3 backdrop-blur-md">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg shrink-0">
                    🪙
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Điểm tích lũy
                    </div>
                    <div className="text-sm sm:text-base font-black text-foreground">
                      {loyaltyPoints.toLocaleString("vi-VN")} điểm
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-card/90 border border-border shadow-sm flex items-center gap-3 backdrop-blur-md">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                    🏷️
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Chiết khấu vé
                    </div>
                    <div className="text-sm sm:text-base font-black text-primary">
                      Giảm {discount}%
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-card/90 border border-border shadow-sm flex items-center gap-3 backdrop-blur-md">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg shrink-0">
                    🎟️
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Kho voucher
                    </div>
                    <div className="text-sm sm:text-base font-black text-foreground">
                      {liveUserVouchers.filter((v) => v.status === "ACTIVE").length} khả dụng
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Grid: Profile Info & Digital VIP Card ── */}
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column (7 cols): Personal Info & Security */}
            <div className="lg:col-span-7 space-y-6">
              {/* Profile Card */}
              <Card className="rounded-3xl border border-border shadow-sm overflow-hidden bg-card">
                <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
                        Thông Tin Cá Nhân
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Thông tin dùng để định danh và nhận ưu đãi tại rạp
                      </p>
                    </div>
                  </div>

                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="rounded-xl font-bold text-xs h-9 px-4 gap-1.5 border-border hover:border-primary hover:text-primary transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="rounded-xl font-semibold text-xs h-9 px-3 gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Hủy</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-xl font-bold text-xs h-9 px-4 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-5 sm:p-6">
                  {!isEditing ? (
                    /* View Mode: Modern Info Tiles */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name Tile */}
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border text-primary flex items-center justify-center shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Họ và tên
                          </div>
                          <div className="text-sm sm:text-base font-bold text-foreground mt-0.5 truncate">
                            {formData.name || "Chưa cập nhật"}
                          </div>
                        </div>
                      </div>

                      {/* Email Tile */}
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border text-primary flex items-center justify-center shrink-0">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Địa chỉ email
                          </div>
                          <div className="text-sm sm:text-base font-bold text-foreground mt-0.5 truncate">
                            {formData.email}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                          </span>
                        </div>
                      </div>

                      {/* Phone Tile */}
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border text-primary flex items-center justify-center shrink-0">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Số điện thoại
                          </div>
                          <div className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                            {formData.phone || "Chưa cập nhật"}
                          </div>
                        </div>
                      </div>

                      {/* Date of Birth Tile */}
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border text-primary flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Ngày sinh
                          </div>
                          <div className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                            {formData.dob
                              ? formData.dob.split("-").reverse().join("/")
                              : "Chưa cập nhật"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Edit Mode: Form Inputs */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">
                          Họ và tên *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nhập họ và tên"
                            className="pl-10 h-11 rounded-xl bg-background border-input focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">
                          Địa chỉ email (Cố định)
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="pl-10 h-11 rounded-xl bg-muted/60 text-muted-foreground cursor-not-allowed border-input"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold uppercase text-muted-foreground">
                          Số điện thoại
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Nhập số điện thoại"
                            className="pl-10 h-11 rounded-xl bg-background border-input focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dob" className="text-xs font-bold uppercase text-muted-foreground">
                          Ngày sinh
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="dob"
                            name="dob"
                            type="date"
                            value={formData.dob}
                            onChange={handleChange}
                            className="pl-10 h-11 rounded-xl bg-background border-input focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security & Password Card */}
              <Card className="rounded-3xl border border-border shadow-sm overflow-hidden bg-card">
                <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
                        Bảo Mật Tài Khoản
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Quản lý mật khẩu đăng nhập và độ an toàn tài khoản
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border text-foreground flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          Mật Khẩu Đăng Nhập
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Đã được mã hóa bảo vệ. Khuyến nghị đổi mật khẩu định kỳ 6 tháng một lần.
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setIsChangePasswordDialogOpen(true)}
                      className="rounded-xl font-bold text-xs sm:text-sm h-10 px-4 shrink-0 gap-2 border-border hover:border-primary hover:text-primary transition-all"
                    >
                      <Key className="w-4 h-4 text-primary" />
                      <span>Đổi Mật Khẩu</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (5 cols): Digital VIP Card & Membership Perks */}
            <div className="lg:col-span-5 space-y-6">
              {/* ── Luxury Digital VIP Membership Card ── */}
              <div className="relative group">
                <div
                  className={cn(
                    "relative aspect-[1.62/1] w-full rounded-3xl p-6 sm:p-7 text-white overflow-hidden transition-all duration-500 hover:scale-[1.02]",
                    cardConfig.gradient,
                    cardConfig.border,
                    cardConfig.glow,
                    "border-2",
                  )}
                >
                  {/* Holographic light sweep & glow reflections */}
                  <div className="absolute -top-24 -right-24 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-black/40 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />

                  {/* Card Header: Cinema branding & Realistic Smart Card EMV Chip */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Film className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-black tracking-widest uppercase opacity-95">
                          GALAXY CINEMA
                        </div>
                        <div className="text-[9px] tracking-wider uppercase opacity-75 font-semibold">
                          VIP MEMBER PASS
                        </div>
                      </div>
                    </div>

                    {/* Realistic EMV Smart Chip */}
                    <div className="flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-white/70 rotate-90" />
                      <div
                        className={cn(
                          "w-11 h-8 rounded-md bg-gradient-to-br border p-1 flex flex-col justify-between shadow-sm opacity-90",
                          cardConfig.chipColor,
                          "border-white/30",
                        )}
                      >
                        <div className="flex justify-between h-2">
                          <div className="w-3 border-b border-black/30" />
                          <div className="w-3 border-b border-black/30" />
                        </div>
                        <div className="flex justify-between h-2">
                          <div className="w-3 border-t border-black/30" />
                          <div className="w-3 border-t border-black/30" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Center: Member Name & Card ID */}
                  <div className="mt-6 sm:mt-8 relative z-10">
                    <div className="text-lg sm:text-xl font-black uppercase tracking-wider drop-shadow-sm truncate">
                      {user?.name || "GALAXY MEMBER"}
                    </div>
                    <div className="text-xs sm:text-sm font-mono tracking-widest opacity-85 mt-1">
                      GC-{user?.id ? String(user.id).padStart(6, "0") : "000001"}
                    </div>
                  </div>

                  {/* Card Footer: Tier Badge & Quick Stats */}
                  <div className="mt-5 pt-3.5 border-t border-white/20 flex items-end justify-between relative z-10">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider opacity-75 font-semibold">
                        Hạng thẻ
                      </div>
                      <div className="text-sm sm:text-base font-extrabold flex items-center gap-1.5 mt-0.5">
                        <TierIcon className="w-4 h-4" />
                        <span>Hạng {cardConfig.name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider opacity-75 font-semibold">
                        Điểm khả dụng
                      </div>
                      <div className="text-sm sm:text-base font-black text-amber-200">
                        {loyaltyPoints.toLocaleString("vi-VN")} điểm
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Next Tier Progress & Benefits Card ── */}
              <Card className="rounded-3xl border border-border shadow-sm overflow-hidden bg-card">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>Tiến Trình Hạng Thành Viên</span>
                    </CardTitle>
                    <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold text-xs">
                      Chiết khấu {discount}%
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-1 space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-3 py-2 border-y border-border">
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                        Tổng chi tiêu
                      </div>
                      <div className="text-base font-extrabold text-foreground mt-0.5">
                        {totalSpent.toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                        Điểm tích lũy
                      </div>
                      <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                        {loyaltyPoints.toLocaleString("vi-VN")} điểm
                      </div>
                    </div>
                  </div>

                  {/* Next Tier Progress Bar */}
                  {nextTierInfo ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">
                          Hạng tiếp theo: <strong>{nextTierInfo.name}</strong>
                        </span>
                        <span className="text-primary font-bold">
                          Còn {nextTierInfo.pointsNeeded.toLocaleString("vi-VN")} điểm
                        </span>
                      </div>

                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-primary h-2.5 rounded-full transition-all duration-500 shadow-sm"
                          style={{
                            width: `${Math.min(100, Math.max(5, (loyaltyPoints / nextTierInfo.minPoints) * 100))}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{loyaltyPoints.toLocaleString("vi-VN")} điểm</span>
                        <span>Mục tiêu: {nextTierInfo.minPoints.toLocaleString("vi-VN")} điểm</span>
                      </div>

                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 shrink-0 text-primary" />
                        <span>
                          Thăng hạng <strong>{nextTierInfo.name}</strong> để nhận chiết khấu{" "}
                          <strong>{nextTierInfo.discount}%</strong> cho mỗi vé xem phim!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-2">
                      <Crown className="w-5 h-5 shrink-0 text-amber-400" />
                      <span>Chúc mừng! Bạn đã đạt hạng thành viên cao nhất (Kim Cương).</span>
                    </div>
                  )}

                  {/* 4 Membership Perks Grid */}
                  <div className="pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Đặc quyền của bạn
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {discount > 0 ? `Giảm ${discount}% giá vé` : "Tích điểm đổi quà"}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          10.000đ = 1 điểm
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <Ticket className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          Đổi điểm lấy voucher
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                          <Gift className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          Voucher sinh nhật
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── Bottom Section: Modern Loyalty & Rewards Hub Tabs ── */}
          <div className="pt-4">
            <Tabs defaultValue="vouchers" className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-border">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <span>Ưu Đãi & Điểm Thưởng Galaxy</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Quản lý kho voucher, đổi quà bằng điểm tích lũy và theo dõi lịch sử giao dịch
                  </p>
                </div>

                <TabsList className="bg-card border border-border p-1 rounded-2xl h-11 self-start sm:self-auto shadow-sm">
                  <TabsTrigger
                    value="vouchers"
                    className="rounded-xl font-bold text-xs sm:text-sm px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 transition-all"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Kho Voucher</span>
                    <Badge className="ml-1 bg-primary/20 text-primary data-[state=active]:bg-white/20 data-[state=active]:text-white text-[10px] px-1.5 py-0 h-4 rounded-full">
                      {liveUserVouchers.length}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="redeem"
                    className="rounded-xl font-bold text-xs sm:text-sm px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 transition-all"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Đổi Điểm Thưởng</span>
                    <Badge className="ml-1 bg-amber-500/20 text-amber-500 data-[state=active]:bg-white/20 data-[state=active]:text-white text-[10px] px-1.5 py-0 h-4 rounded-full">
                      {rewardTiers.length}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="history"
                    className="rounded-xl font-bold text-xs sm:text-sm px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 transition-all"
                  >
                    <History className="w-4 h-4" />
                    <span>Lịch Sử Điểm</span>
                    <Badge className="ml-1 bg-muted text-muted-foreground data-[state=active]:bg-white/20 data-[state=active]:text-white text-[10px] px-1.5 py-0 h-4 rounded-full">
                      {liveLoyaltyHistory.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: Vouchers */}
              <TabsContent value="vouchers" className="mt-0 focus-visible:outline-none">
                <UserVouchersCard
                  showOnly="vouchers"
                  vouchers={liveUserVouchers}
                  currentPoints={liveCurrentPoints}
                  rewardTiers={rewardTiers}
                  isRedeeming={isRedeeming}
                  onRedeemPoints={handleRedeemPoints}
                />
              </TabsContent>

              {/* Tab 2: Redeem Points */}
              <TabsContent value="redeem" className="mt-0 focus-visible:outline-none">
                <UserVouchersCard
                  showOnly="redeem"
                  vouchers={liveUserVouchers}
                  currentPoints={liveCurrentPoints}
                  rewardTiers={rewardTiers}
                  isRedeeming={isRedeeming}
                  onRedeemPoints={handleRedeemPoints}
                />
              </TabsContent>

              {/* Tab 3: Points History */}
              <TabsContent value="history" className="mt-0 focus-visible:outline-none">
                <LoyaltyHistoryCard history={liveLoyaltyHistory} />
              </TabsContent>
            </Tabs>
          </div>
        </main>

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
