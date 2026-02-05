import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, Check, X, Clock } from "lucide-react";
import { UserVoucher, Promo, VoucherStatus } from "@/types/cinema";
import { cn } from "@/lib/utils";

interface UserVouchersCardProps {
  vouchers: UserVoucher[];
  promotions: Promo[];
  onUseVoucher?: (voucherId: string) => void;
  className?: string;
}

const UserVouchersCard: React.FC<UserVouchersCardProps> = ({
  vouchers,
  promotions,
  onUseVoucher,
  className,
}) => {
  const getVoucherPromo = (voucherId: string): Promo | undefined => {
    const voucher = vouchers.find((v) => v.id === voucherId);
    return promotions.find((p) => p.id === voucher?.promotionId);
  };

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
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Voucher Của Tôi</CardTitle>
      </CardHeader>
      <CardContent>
        {vouchers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Bạn chưa có voucher nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vouchers.map((voucher) => {
              const promo = getVoucherPromo(voucher.id);
              if (!promo) return null;

              const daysRemaining = getDaysRemaining(voucher.expiresAt);
              const isExpiring = daysRemaining !== null && daysRemaining <= 3;

              return (
                <div
                  key={voucher.id}
                  className={cn(
                    "relative overflow-hidden rounded-lg border transition-all",
                    voucher.status === "ACTIVE"
                      ? "bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:shadow-md"
                      : "bg-muted/50 opacity-60",
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                          voucher.status === "ACTIVE"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Ticket className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">
                              {promo.description}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Mã:{" "}
                              <span className="font-mono font-medium">
                                {voucher.code || promo.code}
                              </span>
                            </p>
                          </div>
                          {getStatusBadge(voucher.status)}
                        </div>

                        {/* Discount Amount */}
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold text-primary">
                            {promo.type === "percent"
                              ? `${promo.discount}%`
                              : `${promo.discount.toLocaleString("vi-VN")}đ`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Giảm giá
                          </span>
                        </div>

                        {/* Conditions */}
                        {promo.minAmount > 0 && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Đơn tối thiểu:{" "}
                            {promo.minAmount.toLocaleString("vi-VN")}đ
                          </p>
                        )}

                        {/* Expiry */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {voucher.expiresAt ? (
                              <>
                                HSD: {formatDate(voucher.expiresAt)}
                                {isExpiring && voucher.status === "ACTIVE" && (
                                  <span className="ml-1 text-orange-600 font-medium">
                                    (Còn {daysRemaining} ngày)
                                  </span>
                                )}
                              </>
                            ) : (
                              "Không giới hạn"
                            )}
                          </div>

                          {voucher.usedAt && (
                            <div className="text-muted-foreground">
                              Đã dùng: {formatDate(voucher.usedAt)}
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        {voucher.status === "ACTIVE" && onUseVoucher && (
                          <Button
                            size="sm"
                            className="mt-3"
                            onClick={() => onUseVoucher(voucher.id)}
                          >
                            Sử Dụng Ngay
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Decorative Pattern */}
                  {voucher.status === "ACTIVE" && (
                    <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="currentColor"
                          className="text-primary"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserVouchersCard;
