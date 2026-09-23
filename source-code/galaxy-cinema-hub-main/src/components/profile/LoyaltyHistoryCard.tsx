import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Gift,
  Calendar,
  ShoppingBag,
  Sparkles,
  History,
  PartyPopper,
} from "lucide-react";
import { LoyaltyHistory, LoyaltyHistoryType } from "@/types/cinema";
import { cn } from "@/lib/utils";

interface LoyaltyHistoryCardProps {
  history: LoyaltyHistory[];
  className?: string;
}

const LoyaltyHistoryCard: React.FC<LoyaltyHistoryCardProps> = ({
  history,
  className,
}) => {
  const [filter, setFilter] = useState<"ALL" | "PLUS" | "MINUS">("ALL");

  const getTypeIcon = (type: LoyaltyHistoryType) => {
    switch (type) {
      case "PURCHASE":
        return <ShoppingBag className="w-4 h-4" />;
      case "REDEEM":
        return <Gift className="w-4 h-4" />;
      case "EVENT":
        return <Sparkles className="w-4 h-4" />;
      case "BIRTHDAY":
        return <PartyPopper className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: LoyaltyHistoryType) => {
    switch (type) {
      case "PURCHASE":
        return "Mua vé xem phim";
      case "REDEEM":
        return "Đổi điểm nhận voucher";
      case "EVENT":
        return "Sự kiện / Khuyến mãi";
      case "BIRTHDAY":
        return "Quà tặng sinh nhật";
      default:
        return type;
    }
  };

  const getTypeBadgeStyle = (type: LoyaltyHistoryType) => {
    switch (type) {
      case "PURCHASE":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "REDEEM":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "EVENT":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      case "BIRTHDAY":
        return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const normalized = dateStr.includes("T")
      ? dateStr
      : dateStr.replace(" ", "T");
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Sort by date descending
  const sortedHistory = [...history].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const filteredHistory = sortedHistory.filter((item) => {
    if (filter === "PLUS") return item.pointsChange > 0;
    if (filter === "MINUS") return item.pointsChange < 0;
    return true;
  });

  return (
    <Card className={cn("rounded-3xl border border-border shadow-sm overflow-hidden bg-card", className)}>
      <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border bg-gradient-to-r from-primary/5 via-card to-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-foreground">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <span>Lịch Sử Tích Điểm & Giao Dịch</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Chi tiết các lần tích lũy điểm khi mua vé và sử dụng điểm đổi quà
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                filter === "ALL"
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Tất cả ({sortedHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("PLUS")}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                filter === "PLUS"
                  ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Cộng điểm (+)
            </button>
            <button
              type="button"
              onClick={() => setFilter("MINUS")}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                filter === "MINUS"
                  ? "bg-background text-amber-600 dark:text-amber-400 shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Trừ điểm (-)
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-14 px-4 bg-muted/20 border border-dashed border-border rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <h4 className="font-bold text-base text-foreground">
              Chưa có lịch sử tích điểm
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Khi bạn đặt vé xem phim hoặc mua combo bắp nước tại Galaxy Cinema, điểm thưởng sẽ tự động được cộng vào tài khoản của bạn.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => {
              const isPositive = item.pointsChange > 0;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/40 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Category Icon */}
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
                        isPositive
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md",
                            getTypeBadgeStyle(item.type),
                          )}
                        >
                          {getTypeLabel(item.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.createdAt)}</span>
                        </span>
                      </div>

                      <p className="font-semibold text-sm text-foreground mt-1 line-clamp-1">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        {item.movieTitle && (
                          <span className="font-medium text-primary">
                            🎬 {item.movieTitle}
                          </span>
                        )}
                        {item.bookingAmount != null && item.bookingAmount > 0 && (
                          <span>
                            Thanh toán:{" "}
                            <strong>
                              {item.bookingAmount.toLocaleString("vi-VN")}đ
                            </strong>
                          </span>
                        )}
                        {item.bookingCode && (
                          <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                            {item.bookingCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Points Pill */}
                  <div
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl border text-sm sm:text-base font-extrabold whitespace-nowrap shrink-0 flex items-center gap-1 shadow-sm",
                      isPositive
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}
                      {item.pointsChange.toLocaleString("vi-VN")} điểm
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyHistoryCard;
