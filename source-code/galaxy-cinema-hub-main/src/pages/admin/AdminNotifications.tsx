import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Send,
  Search,
  Filter,
  Users,
  CheckCircle,
  Clock,
  Trash2,
  Loader2,
  UserRound,
  UserCog,
  Shield,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  NotificationCampaign,
  NotificationService,
} from "@/services/notification.service";

type FilterType = "all" | "BOOKING" | "PROMOTION" | "SYSTEM";

const AdminNotifications: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [notifications, setNotifications] = useState<NotificationCampaign[]>(
    [],
  );
  const [stats, setStats] = useState({
    total_notifications: 0,
    total_recipients: 0,
    total_reads: 0,
    sent_notifications: 0,
    scheduled_notifications: 0,
  });

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "SYSTEM" as "BOOKING" | "PROMOTION" | "SYSTEM",
    targetAudience: "ALL" as "ALL" | "GUEST" | "USER" | "STAFF" | "ADMIN",
    sendMode: "immediate" as "immediate" | "scheduled",
    scheduledAt: "",
  });

  const readRate = useMemo(() => {
    if (stats.total_recipients <= 0) return 0;
    return (stats.total_reads / stats.total_recipients) * 100;
  }, [stats.total_reads, stats.total_recipients]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await NotificationService.getAdminNotifications(
        searchQuery,
        filterType,
      );

      console.log("📩 Admin Notifications API Response:", res);

      if (!res.success) {
        toast({
          title: "Lỗi",
          description: res.message || "API trả về lỗi",
          variant: "destructive",
        });
        return;
      }

      setNotifications(res.data.items || []);
      const apiStats = res.data.stats;
      setStats({
        total_notifications: apiStats?.total_notifications ?? 0,
        total_recipients: apiStats?.total_recipients ?? 0,
        total_reads: apiStats?.total_reads ?? 0,
        sent_notifications: apiStats?.sent_notifications ?? 0,
        scheduled_notifications: apiStats?.scheduled_notifications ?? 0,
      });
    } catch (error) {
      console.error("❌ LoadNotifications Error:", error);
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách thông báo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType, toast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleCreateNotification = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ tiêu đề và nội dung",
        variant: "destructive",
      });
      return;
    }

    if (formData.sendMode === "scheduled" && !formData.scheduledAt) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn thời gian hẹn gửi thông báo",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await NotificationService.createAdminNotification({
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        target_audience: formData.targetAudience,
        scheduled_at:
          formData.sendMode === "scheduled" && formData.scheduledAt
            ? formData.scheduledAt
            : undefined,
      });

      if (res.success) {
        toast({
          title:
            res.data.status === "SCHEDULED"
              ? "Đã hẹn lịch thông báo"
              : "Đã gửi thông báo",
          description:
            res.data.status === "SCHEDULED"
              ? `Sẽ gửi lúc ${new Date(formData.scheduledAt).toLocaleString("vi-VN")}`
              : `Gửi đến ${res.data.recipient_count} người dùng`,
        });

        setIsCreateDialogOpen(false);
        setFormData({
          title: "",
          message: "",
          type: "SYSTEM",
          targetAudience: "ALL",
          sendMode: "immediate",
          scheduledAt: "",
        });

        await loadNotifications();
      }
    } catch (error) {
      toast({
        title: "Gửi thông báo thất bại",
        description:
          error instanceof Error ? error.message : "Đã có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotif = async (notif: NotificationCampaign) => {
    try {
      await NotificationService.deleteAdminNotification(Number(notif.id));
      toast({
        title: "Đã xóa",
        description: `Đã xóa thông báo "${notif.title}"`,
      });
      await loadNotifications();
    } catch (error) {
      toast({
        title: "Xóa thất bại",
        description:
          error instanceof Error ? error.message : "Đã có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  const getTypeBadge = (type: string) => {
    const configs: Record<
      string,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      BOOKING: {
        color: "bg-blue-500",
        icon: <Bell className="w-3 h-3" />,
        label: "Booking",
      },
      PROMOTION: {
        color: "bg-orange-500",
        icon: <Bell className="w-3 h-3" />,
        label: "Promotion",
      },
      SYSTEM: {
        color: "bg-purple-500",
        icon: <Bell className="w-3 h-3" />,
        label: "System",
      },
    };
    const config = configs[type] || configs.SYSTEM;
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getAudienceBadge = (audience: string) => {
    const configs: Record<
      string,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      ALL: {
        color: "bg-indigo-500",
        icon: <Globe className="w-3 h-3" />,
        label: "Tất cả",
      },
      GUEST: {
        color: "bg-slate-500",
        icon: <UserRound className="w-3 h-3" />,
        label: "Chưa đăng nhập",
      },
      USER: {
        color: "bg-blue-500",
        icon: <UserRound className="w-3 h-3" />,
        label: "Người dùng",
      },
      STAFF: {
        color: "bg-amber-500",
        icon: <UserCog className="w-3 h-3" />,
        label: "Nhân viên",
      },
      ADMIN: {
        color: "bg-rose-500",
        icon: <Shield className="w-3 h-3" />,
        label: "Admin",
      },
    };
    const config = configs[audience] || configs.ALL;
    return (
      <Badge
        className={`${config.color} text-white flex items-center gap-1 w-fit`}
      >
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleSearch = async () => {
    await loadNotifications();
  };

  const getStatusBadge = (status: string) => {
    const normalized = (status || "SENT").toUpperCase();
    if (normalized === "SCHEDULED") {
      return (
        <Badge className="bg-blue-500 text-white flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3" />
          Đã hẹn lịch
        </Badge>
      );
    }

    if (normalized === "CANCELLED") {
      return (
        <Badge className="bg-gray-500 text-white flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3" />
          Đã hủy
        </Badge>
      );
    }

    return (
      <Badge className="bg-green-500 text-white flex items-center gap-1 w-fit">
        <CheckCircle className="w-3 h-3" />
        Đã gửi
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Thông Báo</h1>
          <p className="text-muted-foreground">Gửi thông báo đến người dùng</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Send className="w-4 h-4 mr-2" />
          Gửi Thông Báo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng Thông Báo
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_notifications}
            </div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã Gửi</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.sent_notifications ?? stats.total_notifications}
            </div>
            <p className="text-xs text-muted-foreground">Sent notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người Nhận</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_recipients.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total recipients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ Lệ Đọc</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Read rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tiêu đề hoặc nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Tìm
            </Button>

            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as FilterType)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="BOOKING">Booking</SelectItem>
                <SelectItem value="PROMOTION">Promotion</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch Sử Thông Báo ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thông Báo</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Nhóm Nhận</TableHead>
                <TableHead>Người Nhận</TableHead>
                <TableHead>Đã Đọc</TableHead>
                <TableHead>Thời Gian</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notif) => (
                <TableRow key={notif.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{notif.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(notif.type)}</TableCell>
                  <TableCell>
                    {getAudienceBadge(notif.target_audience)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {notif.recipient_count}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {notif.read_count}/{notif.recipient_count}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          (
                          {(
                            ((notif.read_count || 0) /
                              Math.max(1, notif.recipient_count || 1)) *
                            100
                          ).toFixed(0)}
                          %)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              ((notif.read_count || 0) /
                                Math.max(1, notif.recipient_count || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(
                      notif.status === "SCHEDULED"
                        ? notif.scheduled_at || notif.created_at
                        : notif.sent_at || notif.created_at,
                    ).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell>{getStatusBadge(notif.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNotif(notif)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo Thông Báo Mới</DialogTitle>
            <DialogDescription>
              Gửi thông báo đến người dùng theo đối tượng
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Tiêu Đề *</Label>
              <Input
                id="create-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Khuyến mãi đặc biệt..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-message">Nội Dung *</Label>
              <Textarea
                id="create-message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Nội dung thông báo chi tiết..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {formData.message.length}/500 ký tự
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-type">Loại Thông Báo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as "BOOKING" | "PROMOTION" | "SYSTEM",
                  })
                }
              >
                <SelectTrigger id="create-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SYSTEM">System</SelectItem>
                  <SelectItem value="PROMOTION">Promotion</SelectItem>
                  <SelectItem value="BOOKING">Booking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-audience">Đối Tượng Nhận</Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    targetAudience: value as
                      | "ALL"
                      | "GUEST"
                      | "USER"
                      | "STAFF"
                      | "ADMIN",
                  })
                }
              >
                <SelectTrigger id="create-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="GUEST">
                    Người dùng chưa đăng nhập
                  </SelectItem>
                  <SelectItem value="USER">Người dùng</SelectItem>
                  <SelectItem value="STAFF">Nhân viên</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="send-mode">Thời Điểm Gửi</Label>
              <Select
                value={formData.sendMode}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    sendMode: value as "immediate" | "scheduled",
                  })
                }
              >
                <SelectTrigger id="send-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Gửi ngay</SelectItem>
                  <SelectItem value="scheduled">Hẹn giờ gửi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.sendMode === "scheduled" && (
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Thời Gian Hẹn *</Label>
                <Input
                  id="schedule-time"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateNotification} disabled={submitting}>
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Gửi Ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
