import React, { useState } from "react";
import {
  Ticket,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall } from "@/lib/api";

interface Promotion {
  id: number;
  code: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountAmount: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  totalDiscount: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "inactive";
}

const AdminPromotions: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Load promotions from backend on mount
  React.useEffect(() => {
    const loadPromotions = async () => {
      try {
        const data: {
          data?: { promotions?: unknown[] };
          promotions?: unknown[];
        } = await apiCall(API_ENDPOINTS.PROMOTIONS);
        const promos = data?.data?.promotions || data?.promotions || [];
        if (promos && promos.length) {
          // Map backend fields -> frontend shape
          const mapped = promos.map(
            (p: {
              id: number;
              code: string;
              title?: string;
              description: string;
              discount_type: string;
              discount_amount: number | string;
              min_order_value?: number | string;
              max_discount?: number | string;
              usage_limit?: number;
              used_count?: number;
              total_discount?: number;
              start_date: string;
              end_date: string;
              [key: string]: unknown;
            }) => ({
              id: p.id,
              code: p.code,
              title: p.title || p.code,
              description: p.description,
              discountType: (p.discount_type === "PERCENT"
                ? "percentage"
                : "fixed") as "percentage" | "fixed",
              discountAmount: Number(p.discount_amount),
              minOrderValue: Number(p.min_order_value || 0),
              maxDiscount: Number(p.max_discount || 0),
              usageLimit: p.usage_limit || 0,
              usedCount: Number(p.used_count) || 0,
              totalDiscount: Number(p.total_discount) || 0,
              startDate: p.start_date,
              endDate: p.end_date,
              status: (p.end_date &&
              new Date(p.end_date + "T23:59:59") < new Date()
                ? "expired"
                : "active") as "active" | "expired" | "inactive",
            }),
          );
          setPromotions(mapped);
        }
      } catch (err) {
        console.error("Failed to load promotions", err);
      }
    };
    loadPromotions();
  }, []);

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountAmount: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 100,
    startDate: "",
    endDate: "",
  });

  // Statistics
  const totalPromos = promotions.length;
  const activePromos = promotions.filter((p) => p.status === "active").length;
  const totalUsed = promotions.reduce((sum, p) => sum + p.usedCount, 0);
  const totalDiscount = promotions.reduce((sum, p) => sum + p.totalDiscount, 0);

  // Filter
  const filteredPromos = promotions.filter((promo) => {
    const matchesSearch =
      promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || promo.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleEditPromo = (promo: Promotion) => {
    setSelectedPromo(promo);
    setFormData({
      code: promo.code,
      title: promo.title,
      description: promo.description,
      discountType: promo.discountType,
      discountAmount: promo.discountAmount,
      minOrderValue: promo.minOrderValue,
      maxDiscount: promo.maxDiscount || 0,
      usageLimit: promo.usageLimit,
      startDate: promo.startDate,
      endDate: promo.endDate,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePromo = () => {
    if (!selectedPromo) return;

    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      toast({
        title: "Lỗi",
        description: "Ngày kết thúc không được trước ngày bắt đầu",
        variant: "destructive",
      });
      return;
    }

    const updateServer = async () => {
      try {
        const payload = {
          code: formData.code,
          description: formData.description || formData.title,
          discount_amount: formData.discountAmount,
          discount_type:
            formData.discountType === "percentage" ? "PERCENT" : "FIXED",
          min_order_value: formData.minOrderValue,
          max_discount:
            formData.discountType === "fixed"
              ? null
              : formData.maxDiscount || null,
          start_date: formData.startDate,
          end_date: formData.endDate,
          is_auto_apply: false,
          usage_limit: formData.usageLimit,
        };

        await apiCall(`${API_ENDPOINTS.PROMOTIONS}/${selectedPromo.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setPromotions(
          promotions.map((p) =>
            p.id === selectedPromo.id ? { ...p, ...formData } : p,
          ),
        );

        toast({
          title: "Cập nhật thành công",
          description: `Đã cập nhật ${formData.code}`,
        });
      } catch (err) {
        console.error("Update promo failed", err);
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật khuyến mãi",
          variant: "destructive",
        });
      } finally {
        setIsEditDialogOpen(false);
        setSelectedPromo(null);
      }
    };

    updateServer();
  };

  const handleCreatePromo = () => {
    if (
      !formData.code ||
      !formData.title ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    if (formData.discountAmount <= 0) {
      toast({
        title: "Lỗi",
        description: "Giá trị giảm phải lớn hơn 0",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.discountType === "percentage" &&
      formData.discountAmount > 100
    ) {
      toast({
        title: "Lỗi",
        description: "Giá trị giảm theo % không được vượt quá 100",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast({
        title: "Lỗi",
        description: "Ngày kết thúc không được trước ngày bắt đầu",
        variant: "destructive",
      });
      return;
    }

    const createServer = async () => {
      try {
        const payload = {
          code: formData.code,
          description: formData.description || formData.title,
          discount_amount: formData.discountAmount,
          discount_type:
            formData.discountType === "percentage" ? "PERCENT" : "FIXED",
          min_order_value: formData.minOrderValue,
          max_discount:
            formData.discountType === "fixed"
              ? null
              : formData.maxDiscount || null,
          start_date: formData.startDate,
          end_date: formData.endDate,
          is_auto_apply: false,
          usage_limit: formData.usageLimit,
        };

        const data: { data?: { id?: number }; id?: number } = await apiCall(
          API_ENDPOINTS.PROMOTIONS,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

        const createdId = data?.data?.id || data?.id || Date.now();
        const created: Promotion = {
          id: createdId,
          code: formData.code,
          title: formData.title || formData.code,
          description: formData.description,
          discountType: formData.discountType,
          discountAmount: formData.discountAmount,
          minOrderValue: formData.minOrderValue,
          maxDiscount: formData.maxDiscount,
          usageLimit: formData.usageLimit,
          usedCount: 0,
          totalDiscount: 0,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: "active",
        };

        setPromotions((prev) => [created, ...prev]);

        toast({
          title: "Tạo thành công",
          description: `Đã tạo mã ${formData.code}`,
        });
      } catch (err) {
        console.error("Create promo failed", err);
        toast({
          title: "Lỗi",
          description: "Không thể tạo khuyến mãi",
          variant: "destructive",
        });
      } finally {
        setIsCreateDialogOpen(false);
        setFormData({
          code: "",
          title: "",
          description: "",
          discountType: "percentage",
          discountAmount: 0,
          minOrderValue: 0,
          maxDiscount: 0,
          usageLimit: 100,
          startDate: "",
          endDate: "",
        });
      }
    };

    createServer();
  };

  const handleDeletePromo = (promo: Promotion) => {
    const doDelete = async () => {
      try {
        await apiCall(`${API_ENDPOINTS.PROMOTIONS}/${promo.id}`, {
          method: "DELETE",
        });
        setPromotions(promotions.filter((p) => p.id !== promo.id));
        toast({ title: "Đã xóa", description: `Đã xóa ${promo.code}` });
      } catch (err) {
        console.error("Delete promo failed", err);
        toast({
          title: "Lỗi",
          description: "Không thể xóa khuyến mãi",
          variant: "destructive",
        });
      }
    };

    doDelete();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Đã sao chép",
      description: `Mã ${code} đã được sao chép`,
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode }> = {
      active: {
        color: "bg-green-500",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      expired: { color: "bg-red-500", icon: <XCircle className="w-3 h-3" /> },
      inactive: { color: "bg-gray-500", icon: <XCircle className="w-3 h-3" /> },
    };
    const config = configs[status];
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {status === "active"
          ? "Hoạt động"
          : status === "expired"
            ? "Hết hạn"
            : "Tạm dừng"}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Khuyến Mãi</h1>
          <p className="text-muted-foreground">Tạo và quản lý mã giảm giá</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo Khuyến Mãi
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng Khuyến Mãi
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPromos}</div>
            <p className="text-xs text-muted-foreground">Tất cả mã</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang Hoạt Động
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePromos}</div>
            <p className="text-xs text-muted-foreground">Active promos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt Sử Dụng</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total redemptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Giảm Giá</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalDiscount / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng giảm giá thực tế
            </p>
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
                placeholder="Tìm theo mã hoặc tên..."
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
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Promotions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Khuyến Mãi ({filteredPromos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã KM</TableHead>
                <TableHead>Tiêu Đề</TableHead>
                <TableHead>Giảm Giá</TableHead>
                <TableHead>Đơn Tối Thiểu</TableHead>
                <TableHead>Sử Dụng</TableHead>
                <TableHead>Thời Gian</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromos.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                        {promo.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(promo.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{promo.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {promo.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-primary">
                      {promo.discountType === "percentage"
                        ? `${promo.discountAmount}%`
                        : `${promo.discountAmount.toLocaleString("vi-VN")}đ`}
                      {promo.maxDiscount > 0 && (
                        <span className="text-xs text-muted-foreground block">
                          Max: {promo.maxDiscount.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {promo.minOrderValue.toLocaleString("vi-VN")}đ
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          Đã dùng: {promo.usedCount}
                        </span>
                        {promo.usageLimit && promo.usageLimit > 0 ? (
                          <span className="text-sm font-medium text-green-600">
                            Còn:{" "}
                            {Math.max(0, promo.usageLimit - promo.usedCount)}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-blue-600">
                            Không giới hạn
                          </span>
                        )}
                      </div>
                      {promo.usageLimit && promo.usageLimit > 0 ? (
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (promo.usedCount / promo.usageLimit) * 100)}%`,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full bg-blue-100 dark:bg-blue-900/20 rounded-full h-2">
                          <div className="w-full bg-blue-500 h-2 rounded-full" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(promo.startDate).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(promo.endDate).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(promo.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleEditPromo(promo)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopyCode(promo.code)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Sao chép mã
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeletePromo(promo)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Khuyến Mãi</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin mã khuyến mãi
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Mã Khuyến Mãi *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="NEWYEAR2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Tiêu Đề *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Khuyến mãi tết"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-description">Mô Tả</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Giảm giá cho dịp tết..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-discountType">Loại Giảm Giá</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    discountType: value as "percentage" | "fixed",
                    maxDiscount: value === "fixed" ? 0 : formData.maxDiscount,
                  })
                }
              >
                <SelectTrigger id="edit-discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                  <SelectItem value="fixed">Số tiền cố định (đ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-discountAmount">
                Giá Trị Giảm *{" "}
                {formData.discountType === "percentage" && (
                  <span className="text-muted-foreground text-xs">
                    (1 – 100%)
                  </span>
                )}
              </Label>
              <Input
                id="edit-discountAmount"
                type="number"
                min={1}
                max={formData.discountType === "percentage" ? 100 : undefined}
                value={formData.discountAmount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountAmount: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-minOrder">Đơn Tối Thiểu (đ)</Label>
              <Input
                id="edit-minOrder"
                type="number"
                min={0}
                value={formData.minOrderValue || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minOrderValue: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-maxDiscount">
                Giảm Tối Đa (đ){" "}
                {formData.discountType === "fixed" && (
                  <span className="text-muted-foreground text-xs">
                    (Không áp dụng)
                  </span>
                )}
              </Label>
              <Input
                id="edit-maxDiscount"
                type="number"
                min={0}
                disabled={formData.discountType === "fixed"}
                placeholder={formData.discountType === "fixed" ? "—" : ""}
                value={
                  formData.discountType === "fixed"
                    ? ""
                    : formData.maxDiscount || ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDiscount: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-usageLimit">Giới Hạn Sử Dụng</Label>
              <Input
                id="edit-usageLimit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-startDate">Ngày Bắt Đầu *</Label>
              <Input
                id="edit-startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-endDate">Ngày Kết Thúc *</Label>
              <Input
                id="edit-endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdatePromo}>Cập Nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo Khuyến Mãi Mới</DialogTitle>
            <DialogDescription>
              Thêm mã giảm giá mới cho khách hàng
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-code">Mã Khuyến Mãi *</Label>
              <Input
                id="create-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="NEWYEAR2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-title">Tiêu Đề *</Label>
              <Input
                id="create-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Khuyến mãi tết"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="create-description">Mô Tả</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Giảm giá cho dịp tết..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-discountType">Loại Giảm Giá</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    discountType: value as "percentage" | "fixed",
                    maxDiscount: value === "fixed" ? 0 : formData.maxDiscount,
                  })
                }
              >
                <SelectTrigger id="create-discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                  <SelectItem value="fixed">Số tiền cố định (đ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-discountAmount">
                Giá Trị Giảm *{" "}
                {formData.discountType === "percentage" && (
                  <span className="text-muted-foreground text-xs">
                    (1 – 100%)
                  </span>
                )}
              </Label>
              <Input
                id="create-discountAmount"
                type="number"
                min={1}
                max={formData.discountType === "percentage" ? 100 : undefined}
                value={formData.discountAmount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountAmount: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-minOrder">Đơn Tối Thiểu (đ)</Label>
              <Input
                id="create-minOrder"
                type="number"
                min={0}
                value={formData.minOrderValue || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minOrderValue: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-maxDiscount">
                Giảm Tối Đa (đ){" "}
                {formData.discountType === "fixed" && (
                  <span className="text-muted-foreground text-xs">
                    (Không áp dụng)
                  </span>
                )}
              </Label>
              <Input
                id="create-maxDiscount"
                type="number"
                min={0}
                disabled={formData.discountType === "fixed"}
                placeholder={formData.discountType === "fixed" ? "—" : ""}
                value={
                  formData.discountType === "fixed"
                    ? ""
                    : formData.maxDiscount || ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDiscount: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-usageLimit">Giới Hạn Sử Dụng</Label>
              <Input
                id="create-usageLimit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-startDate">Ngày Bắt Đầu *</Label>
              <Input
                id="create-startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-endDate">Ngày Kết Thúc *</Label>
              <Input
                id="create-endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleCreatePromo}>Tạo Khuyến Mãi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPromotions;
