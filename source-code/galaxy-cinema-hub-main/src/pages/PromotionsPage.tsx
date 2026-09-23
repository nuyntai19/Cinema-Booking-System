import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Gift,
  Tag,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Sparkles,
  Percent,
  ArrowRight,
  Search,
  X,
  Flame,
  Ticket,
  ChevronRight,
  Info,
  ShieldCheck,
  Award,
  HelpCircle,
  RotateCcw,
  SlidersHorizontal,
  Film,
  Zap,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AppContext";

interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  discountAmount: number;
  type: "percentage" | "fixed";
  minOrder?: number;
  validFrom: string;
  validTo: string;
  image: string;
  terms: string[];
  isActive: boolean;
  isAutoApply?: boolean;
}

interface UserVoucherApiItem {
  promotion_id: number;
  status: "ACTIVE" | "USED" | "EXPIRED";
}

interface PromotionApiItem {
  id: number;
  code: string;
  title?: string;
  description?: string;
  discount_type: "PERCENT" | "FIXED";
  discount_amount: number | string;
  min_order_value?: number | string;
  start_date?: string;
  end_date?: string;
  is_auto_apply?: boolean | number;
  image?: string;
  terms?: string[];
}

interface PromotionsApiResponse {
  success?: boolean;
  data?: {
    promotions?: PromotionApiItem[];
  };
  promotions?: PromotionApiItem[];
}

interface UserVouchersApiResponse {
  success?: boolean;
  data?: {
    vouchers?: UserVoucherApiItem[];
  };
}

type PromotionWithRawEnd = Promotion & { _rawEnd: Date | null };

// Dynamic category categorizer based on code and description
const getPromoCategory = (p: Promotion): { label: string; key: string; color: string; badgeBg: string } => {
  const code = p.code.toUpperCase();
  const desc = (p.description || "").toLowerCase();

  if (code.includes("WELCOME") || desc.includes("mới") || desc.includes("đầu tiên")) {
    return {
      label: "Khách Hàng Mới",
      key: "new",
      color: "from-emerald-500 to-teal-600",
      badgeBg: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    };
  }
  if (
    code.includes("MEMBER") ||
    code.includes("TIER") ||
    desc.includes("hội viên") ||
    desc.includes("thành viên") ||
    desc.includes("hạng")
  ) {
    return {
      label: "Hội Viên VIP",
      key: "member",
      color: "from-purple-500 to-indigo-600",
      badgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    };
  }
  if (code.includes("WEEKEND") || desc.includes("cuối tuần") || desc.includes("thứ 7") || desc.includes("chủ nhật")) {
    return {
      label: "Vé Cuối Tuần",
      key: "weekend",
      color: "from-amber-500 to-orange-600",
      badgeBg: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    };
  }
  if (code.includes("BIRTHDAY") || desc.includes("sinh nhật")) {
    return {
      label: "Sinh Nhật",
      key: "birthday",
      color: "from-pink-500 to-rose-600",
      badgeBg: "bg-pink-500/15 text-pink-500 border-pink-500/30",
    };
  }
  if (code.includes("REWARD") || desc.includes("điểm") || desc.includes("đổi")) {
    return {
      label: "Đổi Điểm Thưởng",
      key: "reward",
      color: "from-cyan-500 to-blue-600",
      badgeBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    };
  }
  return {
    label: "Ưu Đãi Chung",
    key: "general",
    color: "from-primary to-orange-600",
    badgeBg: "bg-primary/15 text-primary border-primary/30",
  };
};

// Curated high-res imagery matching cinema promotion themes
const getPromoImage = (p: Promotion): string => {
  if (p.image && !p.image.includes("unsplash.com/photo-1489599849927-2ee91cede3ba")) {
    return p.image;
  }
  const code = p.code.toUpperCase();
  const desc = (p.description || "").toLowerCase();

  if (code.includes("WELCOME") || desc.includes("mới")) {
    return "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&auto=format&fit=crop&q=80";
  }
  if (code.includes("WEEKEND") || desc.includes("cuối tuần")) {
    return "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80";
  }
  if (code.includes("MEMBER") || code.includes("TIER") || desc.includes("hội viên")) {
    return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80";
  }
  if (code.includes("BIRTHDAY") || desc.includes("sinh nhật")) {
    return "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80";
  }
  if (code.includes("REWARD") || desc.includes("điểm")) {
    return "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80";
};

const CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Khách Hàng Mới" },
  { key: "weekend", label: "Vé Cuối Tuần" },
  { key: "member", label: "Hội Viên VIP" },
  { key: "birthday", label: "Sinh Nhật" },
  { key: "reward", label: "Đổi Điểm Thưởng" },
];

const PromotionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Filters & State
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedOutPromotionIds, setUsedOutPromotionIds] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search & Filter Bar
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "upcoming">("all");
  const [sortBy, setSortBy] = useState<"newest" | "discount_desc" | "expiring_soon">("newest");

  // Detail Modal
  const [selectedPromoForModal, setSelectedPromoForModal] = useState<Promotion | null>(null);

  // Newsletter Email
  const [newsletterEmail, setNewsletterEmail] = useState("");

  // Load promotions from backend API
  useEffect(() => {
    const loadPromotionsData = async () => {
      setLoading(true);
      try {
        const requests: Promise<unknown>[] = [apiCall(API_ENDPOINTS.PROMOTIONS)];
        if (isAuthenticated && user?.id) {
          requests.push(
            apiCall(`${API_ENDPOINTS.USER_VOUCHERS(parseInt(user.id))}?status=all`)
          );
        }

        const [promoRes, voucherRes] = await Promise.all(requests);
        const res = promoRes as PromotionsApiResponse;
        const promos = res?.data?.promotions || res?.promotions || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mapped: Promotion[] = promos
          .map((p): PromotionWithRawEnd => {
            const rawAmount = Number(p.discount_amount || 0);
            const discount =
              p.discount_type === "PERCENT"
                ? `${rawAmount}%`
                : `${rawAmount.toLocaleString("vi-VN")}đ`;
            const start = p.start_date ? new Date(p.start_date + "T00:00:00") : null;
            const end = p.end_date ? new Date(p.end_date + "T23:59:59") : null;
            const isExpired = end ? end < today : false;

            return {
              id: String(p.id),
              code: p.code,
              title: p.title || p.code,
              description: p.description || "",
              discount,
              discountAmount: rawAmount,
              type: p.discount_type === "PERCENT" ? "percentage" : "fixed",
              minOrder: Number(p.min_order_value || 0),
              validFrom: p.start_date || "",
              validTo: p.end_date || "",
              image: p.image || "",
              terms: p.terms || (p.description ? [p.description] : ["Áp dụng tại hệ thống rạp Galaxy Cinema toàn quốc"]),
              isActive: start && end ? start <= today && end >= today : !isExpired,
              isAutoApply: Boolean(p.is_auto_apply),
              _rawEnd: end,
            };
          })
          .filter((pm) => {
            if (!pm._rawEnd) return true;
            return pm._rawEnd >= today;
          })
          .map(({ _rawEnd, ...rest }) => rest as Promotion);

        setPromotions(mapped);

        // Process used out status for logged in users
        const voucherResponse = voucherRes as UserVouchersApiResponse | undefined;
        if (isAuthenticated && user?.id && voucherResponse?.success) {
          const vouchers: UserVoucherApiItem[] = voucherResponse?.data?.vouchers || [];
          const voucherStats = new Map<string, { active: number; used: number }>();
          vouchers.forEach((v) => {
            const key = String(v.promotion_id);
            const prev = voucherStats.get(key) || { active: 0, used: 0 };
            if (v.status === "ACTIVE") prev.active += 1;
            if (v.status === "USED") prev.used += 1;
            voucherStats.set(key, prev);
          });

          const usedOut = new Set<string>();
          voucherStats.forEach((stats, promoId) => {
            if (stats.used > 0 && stats.active === 0) {
              usedOut.add(promoId);
            }
          });
          setUsedOutPromotionIds(usedOut);
        } else {
          setUsedOutPromotionIds(new Set());
        }
      } catch (err) {
        console.error("Failed to load promotions", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách khuyến mãi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPromotionsData();
  }, [isAuthenticated, toast, user?.id]);

  const isPromoUsedOut = (promoId: string) =>
    isAuthenticated && usedOutPromotionIds.has(promoId);

  // Copy code with instant feedback
  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Đã sao chép mã thành công!",
      description: `Mã "${code}" đã lưu vào bộ nhớ tạm. Hãy dán mã vào ô khuyến mãi tại bước thanh toán.`,
    });
    setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2500);
  };

  // Direct CTA: copy code & navigate to schedule
  const handleUseNow = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast({
      title: "Mã đã được sao chép!",
      description: `Đang chuyển đến lịch chiếu. Mã "${code}" sẽ được áp dụng khi thanh toán.`,
    });
    navigate("/schedule");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Không thời hạn";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate days remaining
  const getRemainingDays = (validToStr: string): number | null => {
    if (!validToStr) return null;
    const end = new Date(validToStr + "T23:59:59");
    const today = new Date();
    const diffMs = end.getTime() - today.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Filtered and sorted promotions
  const filteredPromotions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return promotions
      .filter((promo) => {
        // 1. Status Filter
        if (statusFilter === "active" && (!promo.isActive || isPromoUsedOut(promo.id))) {
          return false;
        }
        if (statusFilter === "upcoming" && (promo.isActive || isPromoUsedOut(promo.id))) {
          return false;
        }

        // 2. Category Filter
        if (selectedCategory !== "all") {
          const cat = getPromoCategory(promo);
          if (cat.key !== selectedCategory) return false;
        }

        // 3. Search Query (code, title, description)
        if (q) {
          const matchCode = promo.code.toLowerCase().includes(q);
          const matchTitle = promo.title.toLowerCase().includes(q);
          const matchDesc = promo.description.toLowerCase().includes(q);
          if (!matchCode && !matchTitle && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "discount_desc") {
          return b.discountAmount - a.discountAmount;
        }
        if (sortBy === "expiring_soon") {
          const daysA = getRemainingDays(a.validTo) ?? 999;
          const daysB = getRemainingDays(b.validTo) ?? 999;
          return daysA - daysB;
        }
        // Default: newest by ID
        return parseInt(b.id) - parseInt(a.id);
      });
  }, [promotions, searchQuery, selectedCategory, statusFilter, sortBy, usedOutPromotionIds, isAuthenticated]);

  // Top featured deals (hot promotions)
  const spotlightDeals = useMemo(() => {
    return promotions.filter((p) => p.isActive && !isPromoUsedOut(p.id)).slice(0, 3);
  }, [promotions, usedOutPromotionIds, isAuthenticated]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setStatusFilter("all");
    setSortBy("newest");
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast({
        title: "Email không hợp lệ",
        description: "Vui lòng nhập địa chỉ email hợp lệ để nhận ưu đãi.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Đăng ký thành công!",
      description: `Cảm ơn bạn! Các ưu đãi độc quyền từ Galaxy Cinema sẽ được gửi tới ${newsletterEmail}.`,
    });
    setNewsletterEmail("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      <Header />

      <main className="flex-1 pb-16">
        {/* ========================================================================= */}
        {/* HERO BANNER SECTION (CINEMATIC GLOW) */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 bg-gradient-to-b from-primary/10 via-card/50 to-background border-b border-border/40">
          {/* Ambient decorative glowing spots */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl text-left space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Ưu Đãi & Khuyến Mãi Độc Quyền 2026</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                Săn Voucher Cực Hot,{" "}
                <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Xem Phim Cực Đã
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                Tận hưởng hàng loạt mã giảm giá vé xem phim, bắp nước và đặc quyền hội viên Galaxy Cinema. Sao chép mã và nhận ưu đãi tức thì khi đặt vé!
              </p>

              {/* Quick Summary Pill Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-start gap-3 sm:gap-5 text-xs text-foreground/80 font-medium">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/80 shadow-sm">
                  <Ticket className="w-4 h-4 text-primary" />
                  <span>
                    <strong>{promotions.length}</strong> Mã ưu đãi
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/80 shadow-sm">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>
                    Giảm tới <strong>100.000đ</strong> / <strong>20%</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/80 shadow-sm">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>Áp dụng thanh toán ngay</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SPOTLIGHT HOT DEALS (TOP 3 HIGHLIGHTS) */}
        {/* ========================================================================= */}
        {spotlightDeals.length > 0 && (
          <section className="container mx-auto px-4 -mt-6 sm:-mt-8 mb-12 relative z-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {spotlightDeals.map((deal) => {
                const cat = getPromoCategory(deal);
                const isCopied = copiedCode === deal.code;
                const remaining = getRemainingDays(deal.validTo);

                return (
                  <div
                    key={`spotlight-${deal.id}`}
                    className="relative group bg-card/90 backdrop-blur-md border border-border/80 hover:border-primary/50 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Top background accent subtle gradient glow */}
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${cat.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}
                    />

                    <div>
                      {/* Badge row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          <Flame className="w-3 h-3" />
                          <span>Hot Deal</span>
                        </span>

                        {remaining !== null && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Còn {remaining} ngày</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Discount Highlight */}
                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {deal.title}
                        </h3>
                        <span className="text-xl font-black text-primary shrink-0">
                          {deal.discount}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {deal.description}
                      </p>
                    </div>

                    {/* Voucher Code Box & Quick Copy */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-muted border border-dashed border-border flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <span className="font-mono font-bold text-xs text-foreground tracking-wider">
                          {deal.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleCopyCode(deal.code, e)}
                          className="h-8 px-2.5 text-xs rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Sao chép mã"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          onClick={(e) => handleUseNow(deal.code, e)}
                          className="h-8 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm"
                        >
                          Dùng ngay
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* MAIN PROMOTIONS SECTION & CONTROLS */}
        {/* ========================================================================= */}
        <section className="container mx-auto px-4 mb-14">
          {/* Control Bar: Search + Category Chips + Sort + Status */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 mb-8">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã voucher, tên ưu đãi hoặc nội dung..."
                  className="pl-10 pr-9 h-11 rounded-xl bg-background border-border text-sm focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Controls: Status Toggle & Sort */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Status Toggle */}
                <div className="inline-flex items-center p-1 rounded-xl bg-muted border border-border text-xs">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === "all"
                        ? "bg-card text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setStatusFilter("active")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      statusFilter === "active"
                        ? "bg-card text-emerald-500 shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Đang diễn ra</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter("upcoming")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      statusFilter === "upcoming"
                        ? "bg-card text-blue-500 shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Sắp diễn ra</span>
                  </button>
                </div>

                {/* Sort dropdown */}
                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <SelectTrigger className="w-[170px] h-11 rounded-xl bg-background border-border text-xs">
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="newest" className="text-xs">
                      Mới nhất
                    </SelectItem>
                    <SelectItem value="discount_desc" className="text-xs">
                      Mức giảm cao nhất
                    </SelectItem>
                    <SelectItem value="expiring_soon" className="text-xs">
                      Sắp hết hạn
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="pt-2 border-t border-border/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 flex items-center gap-1 mr-1">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>Danh mục:</span>
              </span>

              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}

              {(searchQuery || selectedCategory !== "all" || statusFilter !== "all" || sortBy !== "newest") && (
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 hover:bg-muted ml-auto transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROMOTIONS LIST / GRID */}
          {/* ========================================================================= */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground text-sm font-medium">
                Đang tải danh sách khuyến mãi Galaxy Cinema...
              </p>
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-card border border-border p-8 shadow-sm">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                Không tìm thấy ưu đãi phù hợp
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Không có chương trình khuyến mãi nào khớp với bộ lọc hoặc từ khóa của bạn.
              </p>
              <Button
                onClick={handleResetFilters}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold px-6"
              >
                Xem tất cả ưu đãi
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPromotions.map((promo) => {
                const cat = getPromoCategory(promo);
                const promoImg = getPromoImage(promo);
                const isCopied = copiedCode === promo.code;
                const isUsedOut = isPromoUsedOut(promo.id);
                const remainingDays = getRemainingDays(promo.validTo);

                return (
                  <Card
                    key={promo.id}
                    className="group relative bg-card text-card-foreground border border-border hover:border-primary/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header / Visual banner with gradient accent */}
                      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                        <img
                          src={promoImg}
                          alt={promo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Category Badge (Top Left) */}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md border ${cat.badgeBg}`}
                          >
                            {cat.label}
                          </span>
                        </div>

                        {/* Status Badge (Top Right) */}
                        <div className="absolute top-3 right-3">
                          {isUsedOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-gray-300">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>Đã dùng hết</span>
                            </span>
                          ) : promo.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                              <span>Đang diễn ra</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-400">
                              <Clock className="w-3 h-3 text-blue-400" />
                              <span>Sắp diễn ra</span>
                            </span>
                          )}
                        </div>

                        {/* Big Discount Tag (Bottom Left) */}
                        <div className="absolute bottom-3 left-3">
                          <div className="inline-flex items-baseline gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white font-black text-lg sm:text-xl shadow-lg border border-white/20">
                            <span>GIẢM</span>
                            <span>{promo.discount}</span>
                          </div>
                        </div>

                        {/* Expiry countdown badge if <= 15 days */}
                        {remainingDays !== null && remainingDays > 0 && remainingDays <= 15 && !isUsedOut && (
                          <div className="absolute bottom-3 right-3">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/90 text-white text-[11px] font-bold backdrop-blur-md shadow-md flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Còn {remainingDays} ngày</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Ticket Cutout Notch & Dashed Perforation Line */}
                      <div className="relative py-2 select-none pointer-events-none">
                        {/* Left semi-circle cutout notch */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-border shadow-inner" />
                        {/* Dashed perforated line */}
                        <div className="border-t-2 border-dashed border-border/80 mx-5" />
                        {/* Right semi-circle cutout notch */}
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-border shadow-inner" />
                      </div>

                      {/* Card Body Details */}
                      <CardContent className="p-5 pt-1 space-y-3">
                        {/* Title */}
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {promo.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {promo.description}
                        </p>

                        {/* Info Badges (Min order & Expiry) */}
                        <div className="space-y-1.5 pt-1 text-xs text-muted-foreground">
                          {/* Validity date */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>
                              Hạn dùng: <strong>{formatDate(promo.validTo)}</strong>
                            </span>
                          </div>

                          {/* Min Order Condition */}
                          {promo.minOrder !== undefined && promo.minOrder > 0 ? (
                            <div className="flex items-center gap-2">
                              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>
                                Đơn tối thiểu:{" "}
                                <strong>{promo.minOrder.toLocaleString("vi-VN")}đ</strong>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Không giới hạn đơn tối thiểu</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-5 pt-0 space-y-3">
                      {/* Coupon Code Pill with Copy Action */}
                      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/80 border border-dashed border-border group-hover:border-primary/50 transition-colors">
                        <div className="flex-1 flex items-center gap-2 pl-2">
                          <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-foreground">
                            {promo.code}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleCopyCode(promo.code, e)}
                          className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                            isCopied
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "hover:bg-primary hover:text-primary-foreground text-foreground"
                          }`}
                        >
                          {isCopied ? (
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã chép</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép</span>
                            </span>
                          )}
                        </Button>
                      </div>

                      {/* Action buttons: Details & Use Now */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPromoForModal(promo)}
                          className="h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground border-border hover:bg-muted font-medium"
                        >
                          Xem điều kiện
                        </Button>

                        <Button
                          size="sm"
                          disabled={isUsedOut}
                          onClick={(e) => handleUseNow(promo.code, e)}
                          className="h-9 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex items-center justify-center gap-1"
                        >
                          <span>Dùng ngay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* MEMBERSHIP & LOYALTY REWARDS INTEGRATION */}
        {/* ========================================================================= */}
        <section className="container mx-auto px-4 mb-14">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 sm:p-8 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                  <Award className="w-3.5 h-3.5" />
                  <span>Galaxy Cinema Rewards</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  {isAuthenticated
                    ? `Chào mừng thành viên, ${user?.name || "Bạn"}!`
                    : "Đăng Ký Thành Viên Nhận Thêm Ưu Đãi Độc Quyền"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                  {isAuthenticated
                    ? "Tích điểm tới 10% mỗi đơn vé và bắp nước. Đổi voucher giảm giá 20K, 50K hoặc vé xem phim hoàn toàn miễn phí."
                    : "Trở thành hội viên Galaxy Cinema ngay hôm nay để nhận voucher giảm 50K cho khách hàng mới cùng quà tặng sinh nhật hấp dẫn."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {isAuthenticated ? (
                  <Link to="/profile">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs sm:text-sm h-10 px-5 shadow-sm flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      <span>Kho Voucher Của Tôi</span>
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs sm:text-sm h-10 px-5 shadow-sm">
                        Đăng ký thành viên
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button
                        variant="outline"
                        className="rounded-xl text-xs sm:text-sm h-10 px-5 border-border hover:bg-muted"
                      >
                        Đăng nhập
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* HOW TO USE GUIDE (3-STEP INFOGRAPHIC) */}
        {/* ========================================================================= */}
        <section className="container mx-auto px-4 mb-14">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Hướng Dẫn Đơn Giản
            </span>
            <h2 className="text-2xl font-bold text-foreground mt-1">
              3 Bước Sử Dụng Mã Khuyến Mãi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3 shadow-sm hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg mx-auto shadow-inner">
                1
              </div>
              <h4 className="font-bold text-foreground">Chọn & Sao Chép Mã</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Khám phá các ưu đãi phù hợp, nhấn nút <strong>"Sao chép"</strong> để lưu mã voucher vào bộ nhớ tạm.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3 shadow-sm hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-lg mx-auto shadow-inner">
                2
              </div>
              <h4 className="font-bold text-foreground">Chọn Suất Chiếu & Ghế</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lựa chọn bộ phim bom tấn, cụm rạp Galaxy gần nhất và các ghế ngồi ưng ý của bạn.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3 shadow-sm hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-lg mx-auto shadow-inner">
                3
              </div>
              <h4 className="font-bold text-foreground">Áp Dụng Tại Thanh Toán</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dán mã voucher vào ô <strong>"Mã giảm giá"</strong> ở bước thanh toán để nhận ngay chiết khấu trực tiếp.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* NEWSLETTER SUBSCRIPTION SECTION */}
        {/* ========================================================================= */}
        <section className="container mx-auto px-4">
          <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/10 p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="max-w-2xl mx-auto text-center space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto shadow-sm">
                <Gift className="w-6 h-6" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                Nhận Thông Báo Khuyến Mãi Sớm Nhất
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Đăng ký email để không bỏ lỡ các đợt tặng vé 0đ, combo bắp nước miễn phí và mã giảm giá đặc quyền chỉ có tại Galaxy Cinema.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <Input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của bạn..."
                  className="h-11 rounded-xl bg-background border-border text-sm"
                />
                <Button
                  type="submit"
                  className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs sm:text-sm shrink-0 shadow-sm"
                >
                  Đăng Ký Ngay
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* VOUCHER DETAIL & TERMS DIALOG MODAL */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(selectedPromoForModal)}
        onOpenChange={(open) => {
          if (!open) setSelectedPromoForModal(null);
        }}
      >
        <DialogContent className="max-w-md bg-card text-card-foreground border-border rounded-2xl shadow-xl">
          {selectedPromoForModal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                    Chi Tiết Ưu Đãi
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Mã: <strong>{selectedPromoForModal.code}</strong>
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {selectedPromoForModal.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selectedPromoForModal.description}
                </DialogDescription>
              </DialogHeader>

              {/* Coupon Highlight Box */}
              <div className="p-4 rounded-xl bg-muted/60 border border-dashed border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Mức giảm:</span>
                  <span className="text-lg font-black text-primary">
                    {selectedPromoForModal.discount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Đơn tối thiểu:</span>
                  <span className="font-semibold text-foreground">
                    {selectedPromoForModal.minOrder && selectedPromoForModal.minOrder > 0
                      ? `${selectedPromoForModal.minOrder.toLocaleString("vi-VN")}đ`
                      : "Không giới hạn"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Thời hạn áp dụng:</span>
                  <span className="font-semibold text-foreground">
                    {formatDate(selectedPromoForModal.validFrom)} -{" "}
                    {formatDate(selectedPromoForModal.validTo)}
                  </span>
                </div>
              </div>

              {/* Terms List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Điều kiện & Điều khoản áp dụng</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Áp dụng khi đặt vé online qua ứng dụng hoặc website Galaxy Cinema.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Áp dụng tại tất cả các cụm rạp Galaxy Cinema trên toàn quốc.</span>
                  </li>
                  {selectedPromoForModal.terms.map((term, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{term}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Không áp dụng đồng thời với một số chương trình đại tiệc vé đặc biệt khác.</span>
                  </li>
                </ul>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-border flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopyCode(selectedPromoForModal.code)}
                  className="flex-1 h-10 rounded-xl text-xs font-semibold border-border hover:bg-muted"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  <span>Sao chép mã</span>
                </Button>

                <Button
                  onClick={() => {
                    handleUseNow(selectedPromoForModal.code);
                    setSelectedPromoForModal(null);
                  }}
                  className="flex-1 h-10 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  <span>Đặt vé ngay</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PromotionsPage;
