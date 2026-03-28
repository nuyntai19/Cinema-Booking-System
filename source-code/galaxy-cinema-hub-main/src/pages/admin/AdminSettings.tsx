import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Clock, Shield, TrendingUp, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { systemConfig } from "@/data/mockData";
import { SystemConfig } from "@/types/cinema";

import { AdminHeroBanner } from "@/components/admin/AdminHeroBanner";

const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<SystemConfig>(systemConfig);

  const handleSave = () => {
    Object.assign(systemConfig, config);
    toast({
      title: "Đã lưu cấu hình",
      description: "Các thay đổi đã được áp dụng thành công",
    });
    console.log("Updated system config:", systemConfig);
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateMembershipTier = (tier: string, field: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      membershipTiers: {
        ...prev.membershipTiers,
        [tier]: {
          ...prev.membershipTiers[tier as keyof typeof prev.membershipTiers],
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cấu Hình Hệ Thống</h1>
        <p className="text-muted-foreground">
          Điều chỉnh các thông số hoạt động của hệ thống và giao diện
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Hero Banner Manager */}
        <AdminHeroBanner />

        {/* Legal Compliance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Cấu Hình Tuân Thủ Pháp Luật</CardTitle>
                <CardDescription>
                  Các quy định về phân loại phim và giờ giới nghiêm
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="curfewU13">
                  Giờ giới nghiêm dưới 13 tuổi (HH:mm)
                </Label>
                <Input
                  id="curfewU13"
                  type="time"
                  value={config.curfewTimeU13}
                  onChange={(e) =>
                    updateConfig("curfewTimeU13", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Khách dưới 13 tuổi không được xem phim kết thúc sau giờ này
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="curfewU16">
                  Giờ giới nghiêm dưới 16 tuổi (HH:mm)
                </Label>
                <Input
                  id="curfewU16"
                  type="time"
                  value={config.curfewTimeU16}
                  onChange={(e) =>
                    updateConfig("curfewTimeU16", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Khách dưới 16 tuổi không được xem phim kết thúc sau giờ này
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vnQuota">Tỷ lệ phim Việt tối thiểu (%)</Label>
              <Input
                id="vnQuota"
                type="number"
                min="0"
                max="100"
                value={config.minVietnameseQuota}
                onChange={(e) =>
                  updateConfig("minVietnameseQuota", Number(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                Tỷ lệ tối thiểu suất chiếu phim Việt Nam theo quy định pháp luật
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Booking Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Cấu Hình Đặt Vé</CardTitle>
                <CardDescription>
                  Các thông số liên quan đến quy trình đặt vé
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="seatHold">Thời gian giữ ghế (phút)</Label>
                <Input
                  id="seatHold"
                  type="number"
                  value={config.seatHoldDuration}
                  onChange={(e) =>
                    updateConfig("seatHoldDuration", Number(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Thời gian tối đa người dùng có thể giữ ghế trước khi thanh
                  toán
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cleanupTime">Thời gian dọn phòng (phút)</Label>
                <Input
                  id="cleanupTime"
                  type="number"
                  value={config.defaultCleanupDuration}
                  onChange={(e) =>
                    updateConfig(
                      "defaultCleanupDuration",
                      Number(e.target.value),
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Khoảng thời gian cần thiết để dọn dẹp giữa các suất chiếu
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Program Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Chương Trình Thành Viên</CardTitle>
                <CardDescription>
                  Cấu hình điểm tích lũy và hạng thành viên
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="pointsRate">
                Tỷ lệ quy đổi điểm (VNĐ = 1 điểm)
              </Label>
              <Input
                id="pointsRate"
                type="number"
                value={config.loyaltyPointsRate}
                onChange={(e) =>
                  updateConfig("loyaltyPointsRate", Number(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                Số tiền chi tiêu để nhận được 1 điểm tích lũy
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Cấu hình hạng thành viên</h4>

              {/* Bronze */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                <h5 className="font-medium text-orange-900">Hạng Đồng</h5>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs">Chi tiêu tối thiểu (VNĐ)</Label>
                    <Input
                      type="number"
                      value={config.membershipTiers.bronze.minSpent}
                      onChange={(e) =>
                        updateMembershipTier(
                          "bronze",
                          "minSpent",
                          Number(e.target.value),
                        )
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Giảm giá (%)</Label>
                    <Input
                      type="number"
                      value={config.membershipTiers.bronze.discount}
                      onChange={(e) =>
                        updateMembershipTier(
                          "bronze",
                          "discount",
                          Number(e.target.value),
                        )
                      }
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Silver */}
              <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg space-y-3">
                <h5 className="font-medium text-gray-900">Hạng Bạc</h5>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs">Chi tiêu tối thiểu (VNĐ)</Label>
                    <Input
                      type="number"
                      value={config.membershipTiers.silver.minSpent}
                      onChange={(e) =>
                        updateMembershipTier(
                          "silver",
                          "minSpent",
                          Number(e.target.value),
                        )
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Giảm giá (%)</Label>
                    <Input
                      type="number"
                      value={config.membershipTiers.silver.discount}
                      onChange={(e) =>
                        updateMembershipTier(
                          "silver",
                          "discount",
                          Number(e.target.value),
                        )
                      }
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Gold */}
              <div className="p-4 bg-yellow-50 border border-yellow-400 rounded-lg space-y-3">
                <h5 className="font-medium text-yellow-900">Hạng Vàng</h5>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs">Chi tiêu tối thiểu (VNĐ)</Label>
                    <Input
                      type="number"
                      value={config.membershipTiers.gold.minSpent}
                      onChange={(e) =>
                        updateMembershipTier(
                          "gold",
                          "minSpent",
                          Number(e.target.value),
                        )
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Giảm giá (%)</Label>
                    <Input
                      type="number"
                      value={config.membershipTiers.gold.discount}
                      onChange={(e) =>
                        updateMembershipTier(
                          "gold",
                          "discount",
                          Number(e.target.value),
                        )
                      }
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Platinum */}
              <div className="p-4 bg-purple-50 border border-purple-400 rounded-lg space-y-3">
                <h5 className="font-medium text-purple-900">Hạng Kim Cương</h5>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs">Chi tiêu tối thiểu (VNĐ)</Label>
                    <Input
                      type="number"
                      value={config.membershipTiers.platinum.minSpent}
                      onChange={(e) =>
                        updateMembershipTier(
                          "platinum",
                          "minSpent",
                          Number(e.target.value),
                        )
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Giảm giá (%)</Label>
                    <Input
                      type="number"
                      value={config.membershipTiers.platinum.discount}
                      onChange={(e) =>
                        updateMembershipTier(
                          "platinum",
                          "discount",
                          Number(e.target.value),
                        )
                      }
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="gap-2">
            <Save className="w-4 h-4" />
            Lưu Cấu Hình
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
