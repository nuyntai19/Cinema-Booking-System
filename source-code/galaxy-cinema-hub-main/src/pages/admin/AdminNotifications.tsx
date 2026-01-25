import React, { useState } from "react";
import {
  Bell,
  Send,
  Search,
  Filter,
  Users,
  CheckCircle,
  Clock,
  Trash2,
  UserCheck,
  UsersRound,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  title: string;
  message: string;
  targetAudience: "all" | "members" | "gold" | "silver" | "bronze" | "specific";
  recipientCount: number;
  readCount: number;
  createdAt: string;
  status: "sent" | "scheduled" | "draft";
}

const AdminNotifications: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Khuyến Mãi Tết 2026",
      message:
        "Chào mừng Tết Nguyên Đán! Giảm 30% cho tất cả vé xem phim từ 01/01 - 15/02",
      targetAudience: "all",
      recipientCount: 2543,
      readCount: 1876,
      createdAt: "2026-01-01T10:00:00",
      status: "sent",
    },
    {
      id: 2,
      title: "Phim Mới: Dune Part Two",
      message:
        "Bom tấn Dune: Part Two đã có mặt tại Galaxy! Đặt vé ngay hôm nay!",
      targetAudience: "members",
      recipientCount: 1234,
      readCount: 987,
      createdAt: "2026-01-15T14:30:00",
      status: "sent",
    },
    {
      id: 3,
      title: "Ưu Đãi Gold Member",
      message: "Chúc mừng! Bạn nhận được voucher 100k cho lần đặt vé tiếp theo",
      targetAudience: "gold",
      recipientCount: 156,
      readCount: 145,
      createdAt: "2026-01-20T09:00:00",
      status: "sent",
    },
    {
      id: 4,
      title: "Bảo Trì Hệ Thống",
      message:
        "Hệ thống sẽ bảo trì từ 02:00 - 04:00 ngày 28/01. Vui lòng đặt vé trước.",
      targetAudience: "all",
      recipientCount: 2543,
      readCount: 2301,
      createdAt: "2026-01-25T18:00:00",
      status: "sent",
    },
    {
      id: 5,
      title: "Cuối Tuần Vui Vẻ",
      message: "Giảm 20% cho vé cuối tuần! Áp dụng từ thứ 6 đến chủ nhật.",
      targetAudience: "silver",
      recipientCount: 534,
      readCount: 0,
      createdAt: "2026-01-26T08:00:00",
      status: "scheduled",
    },
  ]);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetAudience: "all" as Notification["targetAudience"],
    sendImmediately: true,
  });

  // Statistics
  const totalNotifs = notifications.length;
  const sentNotifs = notifications.filter((n) => n.status === "sent").length;
  const totalRecipients = notifications.reduce(
    (sum, n) => sum + n.recipientCount,
    0,
  );
  const totalReads = notifications.reduce((sum, n) => sum + n.readCount, 0);
  const readRate =
    totalRecipients > 0 ? (totalReads / totalRecipients) * 100 : 0;

  // Filter
  const filteredNotifs = notifications.filter((notif) => {
    const matchesSearch =
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || notif.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleCreateNotification = () => {
    if (!formData.title || !formData.message) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ tiêu đề và nội dung",
        variant: "destructive",
      });
      return;
    }

    // Calculate recipient count based on target audience
    const recipientCounts: Record<string, number> = {
      all: 2543,
      members: 1234,
      gold: 156,
      silver: 534,
      bronze: 544,
      specific: 50,
    };

    const newNotif: Notification = {
      id: notifications.length + 1,
      title: formData.title,
      message: formData.message,
      targetAudience: formData.targetAudience,
      recipientCount: recipientCounts[formData.targetAudience],
      readCount: 0,
      createdAt: new Date().toISOString(),
      status: formData.sendImmediately ? "sent" : "scheduled",
    };

    setNotifications([newNotif, ...notifications]);

    toast({
      title: formData.sendImmediately ? "Đã gửi thông báo" : "Đã lên lịch",
      description: `Gửi đến ${recipientCounts[formData.targetAudience]} người dùng`,
    });

    setIsCreateDialogOpen(false);
    setFormData({
      title: "",
      message: "",
      targetAudience: "all",
      sendImmediately: true,
    });
  };

  const handleDeleteNotif = (notif: Notification) => {
    setNotifications(notifications.filter((n) => n.id !== notif.id));

    toast({
      title: "Đã xóa",
      description: `Đã xóa thông báo "${notif.title}"`,
    });
  };

  const getAudienceBadge = (audience: string) => {
    const configs: Record<
      string,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      all: {
        color: "bg-purple-500",
        icon: <UsersRound className="w-3 h-3" />,
        label: "Tất cả",
      },
      members: {
        color: "bg-blue-500",
        icon: <UserCheck className="w-3 h-3" />,
        label: "Members",
      },
      gold: {
        color: "bg-yellow-500",
        icon: <UserCheck className="w-3 h-3" />,
        label: "Gold",
      },
      silver: {
        color: "bg-gray-400",
        icon: <UserCheck className="w-3 h-3" />,
        label: "Silver",
      },
      bronze: {
        color: "bg-orange-600",
        icon: <UserCheck className="w-3 h-3" />,
        label: "Bronze",
      },
      specific: {
        color: "bg-green-500",
        icon: <Users className="w-3 h-3" />,
        label: "Specific",
      },
    };
    const config = configs[audience];
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<
      string,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      sent: {
        color: "bg-green-500",
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Đã gửi",
      },
      scheduled: {
        color: "bg-blue-500",
        icon: <Clock className="w-3 h-3" />,
        label: "Đã lên lịch",
      },
      draft: {
        color: "bg-gray-500",
        icon: <Clock className="w-3 h-3" />,
        label: "Nháp",
      },
    };
    const config = configs[status];
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {config.label}
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
            <div className="text-2xl font-bold">{totalNotifs}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã Gửi</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentNotifs}</div>
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
              {totalRecipients.toLocaleString()}
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

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="sent">Đã gửi</SelectItem>
                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="draft">Nháp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch Sử Thông Báo ({filteredNotifs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thông Báo</TableHead>
                <TableHead>Đối Tượng</TableHead>
                <TableHead>Người Nhận</TableHead>
                <TableHead>Đã Đọc</TableHead>
                <TableHead>Thời Gian</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifs.map((notif) => (
                <TableRow key={notif.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{notif.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getAudienceBadge(notif.targetAudience)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {notif.recipientCount}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {notif.readCount}/{notif.recipientCount}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          (
                          {(
                            (notif.readCount / notif.recipientCount) *
                            100
                          ).toFixed(0)}
                          %)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${(notif.readCount / notif.recipientCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(notif.createdAt).toLocaleString("vi-VN")}
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
              <Label htmlFor="create-audience">Đối Tượng Nhận</Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    targetAudience: value as Notification["targetAudience"],
                  })
                }
              >
                <SelectTrigger id="create-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả người dùng (2,543)</SelectItem>
                  <SelectItem value="members">Members (1,234)</SelectItem>
                  <SelectItem value="gold">Gold Members (156)</SelectItem>
                  <SelectItem value="silver">Silver Members (534)</SelectItem>
                  <SelectItem value="bronze">Bronze Members (544)</SelectItem>
                  <SelectItem value="specific">Người dùng cụ thể</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-immediately"
                checked={formData.sendImmediately}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    sendImmediately: checked as boolean,
                  })
                }
              />
              <Label
                htmlFor="send-immediately"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Gửi ngay lập tức
              </Label>
            </div>

            {!formData.sendImmediately && (
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Thời Gian Gửi</Label>
                <Input id="schedule-time" type="datetime-local" />
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
            <Button onClick={handleCreateNotification}>
              <Send className="w-4 h-4 mr-2" />
              {formData.sendImmediately ? "Gửi Ngay" : "Lên Lịch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
