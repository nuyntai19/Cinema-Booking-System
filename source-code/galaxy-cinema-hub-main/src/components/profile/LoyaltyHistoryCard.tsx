import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Gift,
  Calendar,
  ShoppingBag,
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
  const getTypeIcon = (type: LoyaltyHistoryType) => {
    switch (type) {
      case "PURCHASE":
        return <ShoppingBag className="w-4 h-4" />;
      case "REDEEM":
        return <TrendingDown className="w-4 h-4" />;
      case "EVENT":
        return <Gift className="w-4 h-4" />;
      case "BIRTHDAY":
        return <Calendar className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: LoyaltyHistoryType) => {
    switch (type) {
      case "PURCHASE":
        return "Mua hàng";
      case "REDEEM":
        return "Đổi điểm";
      case "EVENT":
        return "Sự kiện";
      case "BIRTHDAY":
        return "Sinh nhật";
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: LoyaltyHistoryType) => {
    switch (type) {
      case "PURCHASE":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "REDEEM":
        return "bg-orange-100 text-orange-700 hover:bg-orange-100";
      case "EVENT":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100";
      case "BIRTHDAY":
        return "bg-pink-100 text-pink-700 hover:bg-pink-100";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Lịch Sử Tích Điểm</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Chưa có lịch sử tích điểm</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    item.pointsChange > 0
                      ? "bg-green-100 text-green-600"
                      : "bg-orange-100 text-orange-600",
                  )}
                >
                  {getTypeIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={cn(
                            "text-xs",
                            getTypeBadgeColor(item.type),
                          )}
                        >
                          {getTypeLabel(item.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Points */}
                    <div
                      className={cn(
                        "text-right font-bold whitespace-nowrap",
                        item.pointsChange > 0
                          ? "text-green-600"
                          : "text-orange-600",
                      )}
                    >
                      {item.pointsChange > 0 ? "+" : ""}
                      {item.pointsChange} điểm
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyHistoryCard;
