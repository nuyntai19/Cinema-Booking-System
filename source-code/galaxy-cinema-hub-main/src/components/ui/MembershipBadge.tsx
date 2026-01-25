import React from "react";
import { Crown, Star, Award, Gem } from "lucide-react";
import { MembershipTier } from "@/types/cinema";
import { Badge } from "@/components/ui/badge";

interface MembershipBadgeProps {
  tier: MembershipTier;
  points?: number;
  showPoints?: boolean;
  size?: "sm" | "md" | "lg";
}

const MembershipBadge: React.FC<MembershipBadgeProps> = ({
  tier,
  points,
  showPoints = false,
  size = "md",
}) => {
  const config = {
    bronze: {
      label: "Đồng",
      icon: Award,
      color: "bg-orange-700 hover:bg-orange-700",
      textColor: "text-white",
    },
    silver: {
      label: "Bạc",
      icon: Star,
      color: "bg-gray-400 hover:bg-gray-400",
      textColor: "text-gray-900",
    },
    gold: {
      label: "Vàng",
      icon: Crown,
      color: "bg-yellow-500 hover:bg-yellow-500",
      textColor: "text-yellow-950",
    },
    platinum: {
      label: "Kim Cương",
      icon: Gem,
      color: "bg-purple-600 hover:bg-purple-600",
      textColor: "text-white",
    },
  };

  const tierConfig = config[tier];
  const Icon = tierConfig.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        className={`${tierConfig.color} ${tierConfig.textColor} ${sizeClasses[size]} flex items-center gap-1.5 font-semibold`}
      >
        <Icon className={iconSizeClasses[size]} />
        {tierConfig.label}
      </Badge>
      {showPoints && points !== undefined && (
        <span className="text-sm text-muted-foreground">
          {points.toLocaleString("vi-VN")} điểm
        </span>
      )}
    </div>
  );
};

export default MembershipBadge;
