import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, Check, X, Clock, Gift, Star, Loader2 } from "lucide-react";
import { VoucherStatus } from "@/types/cinema";
import { cn } from "@/lib/utils";

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
  promotions: any[];
  currentPoints?: number;
  rewardTiers?: RewardTier[];
  isRedeeming?: string | null;
  onRedeemPoints?: (promoCode: string, pointsRequired: number) => void;
  onUseVoucher?: (voucherId: string) => void;
  className?: string;
}

const UserVouchersCard: React.FC<UserVouchersCardProps> = ({
  vouchers,
  promotions,
  currentPoints = 0,
  rewardTiers = [],
  isRedeeming = null,
  onRedeemPoints,
  onUseVoucher,
  className,
}) => {
  const getStatusBadge = (status: VoucherStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <Check className="w-3 h-3 mr-1" />
            Có thể dùng
          </Badge>
        );
      case "USED":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <X className="w-3 h-3 mr-1" />
            Đã sử dụng
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
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
    const date = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
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
    const expires = new Date(expiresAt + (expiresAt.includes("T") ? "" : "T23:59:59"));
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

  return (
    <div className={cn("space-y-6", className)}>
      {/* Đổi Điểm Lấy Voucher */}
      {rewardTiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Đổi Điểm Lấy Voucher
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Điểm hiện tại: <span className="font-bold text-primary">{currentPoints.toLocaleString("vi-VN")} điểm</span>
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {rewardTiers.map((tier) => {
                const canAfford = currentPoints >= tier.points_required;
                const isLoading = isRedeeming === tier.code;
                return (
                  <div
                    key={tier.code}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-all",
                      canAfford
                        ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800"
                        : "bg-muted/30 border-muted opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        canAfford ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
                      )}>
                        <Star className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{tier.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Cần <span className="font-bold">{tier.points_required}</span> điểm
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={canAfford ? "default" : "outline"}
                      disabled={!canAfford || !!isRedeeming}
                      onClick={() => onRedeemPoints?.(tier.code, tier.points_required)}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Đổi"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voucher Của Tôi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voucher Của Tôi</CardTitle>
        </CardHeader>
        <CardContent>
          {vouchers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Bạn chưa có voucher nào</p>
              <p className="text-xs mt-1">Đổi điểm hoặc tham gia sự kiện để nhận voucher</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active vouchers first */}
              {activeVouchers.map((voucher) => {
                const daysRemaining = getDaysRemaining(voucher.expiresAt);
                const isExpiring = daysRemaining !== null && daysRemaining <= 3;

                return (
                  <div
                    key={voucher.id}
                    className="relative overflow-hidden rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:shadow-md transition-all"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                          <Ticket className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-semibold text-sm mb-1">
                                {voucher.description || "Voucher giảm giá"}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Mã: <span className="font-mono font-medium">{voucher.code}</span>
                              </p>
                            </div>
                            {getStatusBadge(voucher.status)}
                          </div>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-bold text-primary">
                              {formatDiscount(voucher)}
                            </span>
                            <span className="text-xs text-muted-foreground">Giảm giá</span>
                          </div>
                          {(voucher.minOrderValue ?? 0) > 0 && (
                            <p className="text-xs text-muted-foreground mb-2">
                              Đơn tối thiểu: {voucher.minOrderValue!.toLocaleString("vi-VN")}đ
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {voucher.expiresAt ? (
                                <>
                                  HSD: {formatDate(voucher.expiresAt)}
                                  {isExpiring && (
                                    <span className="ml-1 text-orange-600 font-medium">
                                      (Còn {daysRemaining} ngày)
                                    </span>
                                  )}
                                </>
                              ) : (
                                "Không giới hạn"
                              )}
                            </div>
                          </div>
                          {onUseVoucher && (
                            <Button size="sm" className="mt-3" onClick={() => onUseVoucher(voucher.id)}>
                              Sử Dụng Ngay
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="40" fill="currentColor" className="text-primary" />
                      </svg>
                    </div>
                  </div>
                );
              })}

              {/* Used / Expired vouchers */}
              {usedOrExpiredVouchers.length > 0 && (
                <>
                  {activeVouchers.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Đã sử dụng / Hết hạn</p>
                    </div>
                  )}
                  {usedOrExpiredVouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      className="rounded-lg border bg-muted/50 opacity-60 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-sm">{voucher.description || "Voucher"}</h4>
                              <p className="text-xs text-muted-foreground">
                                {formatDiscount(voucher)} giảm giá
                              </p>
                            </div>
                            {getStatusBadge(voucher.status)}
                          </div>
                          {voucher.usedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Đã dùng: {formatDate(voucher.usedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserVouchersCard;
