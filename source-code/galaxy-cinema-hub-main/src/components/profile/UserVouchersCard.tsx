import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  Calendar,
  Check,
  X,
  Clock,
  Gift,
  Star,
  Loader2,
  Copy,
  CheckCheck,
} from "lucide-react";
import { VoucherStatus } from "@/types/cinema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface MappedVoucher {
  id: string;
  userId: string;
  promotionId: string;
  code?: string;
  status: VoucherStatus;
  assignedAt: string;
  usedAt?: string;
  expiresAt?: string;
  description?: string;
  discountAmount?: number;
  discountType?: string;
  minOrderValue?: number;
  maxDiscount?: number;
}

interface RewardTier {
  promotion_id: number;
  code: string;
  description: string;
  discount_amount: number;
  discount_type: string;
  points_required: number;
}

interface UserVouchersCardProps {
  vouchers: MappedVoucher[];
  currentPoints?: number;
  rewardTiers?: RewardTier[];
  isRedeeming?: string | null;
  onRedeemPoints?: (promoCode: string, pointsRequired: number) => void;
  className?: string;
  showOnly?: "all" | "vouchers" | "redeem";
}

const UserVouchersCard: React.FC<UserVouchersCardProps> = ({
  vouchers,
  currentPoints = 0,
  rewardTiers = [],
  isRedeeming = null,
  onRedeemPoints,
  className,
  showOnly = "all",
}) => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [voucherFilter, setVoucherFilter] = useState<"ALL" | "ACTIVE" | "USED">(
    "ALL",
  );

  const handleCopyCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Đã sao chép mã!",
      description: `Mã voucher "${code}" đã được lưu vào bộ nhớ tạm.`,
    });
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const getStatusBadge = (status: VoucherStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs px-2.5 py-0.5 rounded-lg shadow-none">
            <Check className="w-3 h-3 mr-1" />
            Có thể dùng
          </Badge>
        );
      case "USED":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border text-xs px-2.5 py-0.5 rounded-lg shadow-none">
            <X className="w-3 h-3 mr-1" />
            Đã sử dụng
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge className="bg-destructive/10 text-destructive border border-destructive/20 text-xs px-2.5 py-0.5 rounded-lg shadow-none">
            <Clock className="w-3 h-3 mr-1" />
            Hết hạn
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(
      dateStr + (dateStr.includes("T") ? "" : "T00:00:00"),
    );
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(
      expiresAt + (expiresAt.includes("T") ? "" : "T23:59:59"),
    );
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const formatDiscount = (v: MappedVoucher) => {
    if (!v.discountAmount) return "";
    if (v.discountType === "PERCENT") return `${v.discountAmount}%`;
    return `${v.discountAmount.toLocaleString("vi-VN")}đ`;
  };

  const activeVouchers = vouchers.filter((v) => v.status === "ACTIVE");
  const usedOrExpiredVouchers = vouchers.filter((v) => v.status !== "ACTIVE");

  const filteredVouchers =
    voucherFilter === "ACTIVE"
      ? activeVouchers
      : voucherFilter === "USED"
        ? usedOrExpiredVouchers
        : vouchers;

  const showRedeemSection = showOnly === "all" || showOnly === "redeem";
  const showVouchersSection = showOnly === "all" || showOnly === "vouchers";

  return (
    <div className={cn("space-y-8", className)}>
      {/* ── Đổi Điểm Lấy Voucher ── */}
      {showRedeemSection && rewardTiers.length > 0 && (
        <Card className="rounded-3xl border border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border bg-gradient-to-r from-primary/5 via-card to-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-foreground">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <span>Đổi Điểm Lấy Voucher</span>
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Dùng điểm thành viên tích lũy để đổi vé xem phim và voucher giảm giá
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs sm:text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Khả dụng: {currentPoints.toLocaleString("vi-VN")} điểm</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewardTiers.map((tier) => {
                const canAfford = currentPoints >= tier.points_required;
                const isLoading = isRedeeming === tier.code;

                return (
                  <div
                    key={tier.code}
                    className={cn(
                      "relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-300",
                      canAfford
                        ? "bg-gradient-to-br from-amber-500/10 via-card to-primary/5 border-amber-500/30 hover:border-amber-500/60 shadow-sm hover:shadow-md hover:scale-[1.02]"
                        : "bg-muted/30 border-border opacity-70",
                    )}
                  >
                    <div>
                      {/* Header with Star Icon & Points Required */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            canAfford
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Gift className="w-5 h-5" />
                        </div>
                        <Badge
                          variant={canAfford ? "default" : "outline"}
                          className={cn(
                            "text-xs font-bold px-2.5 py-1 rounded-lg",
                            canAfford
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/30"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {tier.points_required.toLocaleString("vi-VN")} điểm
                        </Badge>
                      </div>

                      {/* Reward Title & Discount */}
                      <h4 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                        {tier.description}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ưu đãi áp dụng trực tiếp vào tổng đơn khi đặt vé
                      </p>
                    </div>

                    {/* Footer / Redeem Button */}
                    <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {canAfford ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đủ điều kiện đổi
                          </span>
                        ) : (
                          <span>
                            Còn thiếu {(tier.points_required - currentPoints).toLocaleString("vi-VN")} điểm
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        disabled={!canAfford || !!isRedeeming}
                        onClick={() =>
                          onRedeemPoints?.(tier.code, tier.points_required)
                        }
                        className={cn(
                          "rounded-xl font-bold text-xs h-9 px-4 transition-all",
                          canAfford
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25"
                            : "bg-muted text-muted-foreground border border-border",
                        )}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Đổi Ngay"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Voucher Của Tôi ── */}
      {showVouchersSection && (
        <Card className="rounded-3xl border border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border bg-gradient-to-r from-primary/5 via-card to-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-foreground">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <span>Kho Voucher Của Tôi</span>
                  <Badge className="bg-primary/15 text-primary border border-primary/30 font-bold text-xs px-2 py-0.5 rounded-lg">
                    {vouchers.length}
                  </Badge>
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Danh sách mã giảm giá bạn đang sở hữu và có thể áp dụng khi thanh toán
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setVoucherFilter("ALL")}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                    voucherFilter === "ALL"
                      ? "bg-background text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Tất cả ({vouchers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherFilter("ACTIVE")}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                    voucherFilter === "ACTIVE"
                      ? "bg-background text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Khả dụng ({activeVouchers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherFilter("USED")}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                    voucherFilter === "USED"
                      ? "bg-background text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Đã dùng ({usedOrExpiredVouchers.length})
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            {filteredVouchers.length === 0 ? (
              <div className="text-center py-14 px-4 bg-muted/20 border border-dashed border-border rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
                  <Ticket className="w-8 h-8 opacity-80" />
                </div>
                <h4 className="font-bold text-base text-foreground">
                  {voucherFilter === "ACTIVE"
                    ? "Không có voucher khả dụng nào"
                    : "Chưa có voucher nào"}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Bạn có thể đổi điểm tích lũy lấy voucher hoặc tham gia các sự kiện khuyến mãi để nhận thêm ưu đãi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVouchers.map((voucher) => {
                  const daysRemaining = getDaysRemaining(voucher.expiresAt);
                  const isExpiring =
                    daysRemaining !== null && daysRemaining <= 3;
                  const isActive = voucher.status === "ACTIVE";

                  return (
                    <div
                      key={voucher.id}
                      className={cn(
                        "relative flex flex-col justify-between rounded-2xl border transition-all duration-300 overflow-hidden",
                        isActive
                          ? "bg-gradient-to-r from-primary/10 via-card to-card border-primary/30 hover:border-primary hover:shadow-lg"
                          : "bg-muted/40 border-border opacity-65",
                      )}
                    >
                      {/* Ticket Stub Top Section */}
                      <div className="p-4 sm:p-5 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Ticket className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                                {formatDiscount(voucher) || "Ưu đãi"}
                              </span>
                              <h4 className="font-bold text-sm text-foreground line-clamp-1">
                                {voucher.description || "Voucher giảm giá Galaxy"}
                              </h4>
                            </div>
                          </div>

                          {getStatusBadge(voucher.status)}
                        </div>

                        {/* Order condition & validity */}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {(voucher.minOrderValue ?? 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-muted font-medium">
                              Đơn tối thiểu: {voucher.minOrderValue!.toLocaleString("vi-VN")}đ
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {voucher.expiresAt
                                ? `HSD: ${formatDate(voucher.expiresAt)}`
                                : "Không giới hạn"}
                            </span>
                          </div>

                          {isActive && isExpiring && (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              (Còn {daysRemaining} ngày)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Perforated Divider Line with Notches */}
                      <div className="relative my-1">
                        <div className="border-t border-dashed border-border" />
                        <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background border-r border-border" />
                        <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background border-l border-border" />
                      </div>

                      {/* Ticket Stub Bottom Section: Code + Copy Button */}
                      <div className="p-4 sm:p-5 pt-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Mã:</span>
                          <span className="font-mono font-bold text-sm bg-muted/80 px-2.5 py-1 rounded-lg border border-border tracking-wider text-foreground">
                            {voucher.code || "—"}
                          </span>
                        </div>

                        {voucher.code && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyCode(voucher.code)}
                            className="h-8 px-3 rounded-xl border-border hover:border-primary hover:text-primary font-bold text-xs gap-1.5 transition-all shadow-none"
                            title="Sao chép mã"
                          >
                            {copiedCode === voucher.code ? (
                              <>
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Sao chép mã</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserVouchersCard;
