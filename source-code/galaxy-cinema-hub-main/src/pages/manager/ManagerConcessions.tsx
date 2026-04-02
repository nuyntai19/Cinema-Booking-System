import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Edit,
  AlertTriangle,
  Search,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";

interface ConcessionWithInventory {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  inventory_quantity: number;
}

const IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='12' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const getCategoryLabel = (cat: string | null) => {
  const map: Record<string, string> = {
    combo: "Combo",
    popcorn: "Bắp",
    drink: "Nước",
    snack: "Snack",
  };
  return map[cat?.toLowerCase() || ""] || cat || "Khác";
};

const getCategoryColor = (cat: string | null) => {
  const map: Record<string, string> = {
    combo: "bg-purple-500",
    popcorn: "bg-yellow-500",
    drink: "bg-blue-500",
    snack: "bg-orange-500",
  };
  return map[cat?.toLowerCase() || ""] || "bg-gray-500";
};

const LOW_STOCK_THRESHOLD = 5;

const ManagerConcessions: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<ConcessionWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editItem, setEditItem] = useState<ConcessionWithInventory | null>(
    null,
  );
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiCall<{
        success: boolean;
        data: { concessions: ConcessionWithInventory[]; cinema_id: number };
      }>(API_ENDPOINTS.MANAGER_CONCESSIONS);
      if (res.success && res.data?.concessions) {
        setItems(res.data.concessions);
      }
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description:
          err instanceof Error ? err.message : "Không thể tải danh sách",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleEditOpen = (item: ConcessionWithInventory) => {
    setEditItem(item);
    setEditQuantity(item.inventory_quantity);
    setEditDialogOpen(true);
  };

  const handleSaveInventory = async () => {
    if (!editItem) return;
    try {
      setSaving(true);
      await apiCall(API_ENDPOINTS.MANAGER_CONCESSION_INVENTORY(editItem.id), {
        method: "POST",
        body: JSON.stringify({ quantity: editQuantity }),
      });
      toast({
        title: "Cập nhật thành công",
        description: `Tồn kho "${editItem.name}" đã được cập nhật: ${editQuantity}`,
      });
      setEditDialogOpen(false);
      setEditItem(null);
      fetchItems();
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể cập nhật",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const lowStockItems = items.filter(
    (i) => i.inventory_quantity < LOW_STOCK_THRESHOLD,
  ).length;

  const outOfStockItems = items.filter((i) => i.inventory_quantity <= 0).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Quản Lý Tồn Kho Bắp Nước</h1>
        <p className="text-muted-foreground">
          Theo dõi và cập nhật số lượng tồn kho sản phẩm tại rạp
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Sản Phẩm</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sắp Hết Hàng</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">
              Dưới {LOW_STOCK_THRESHOLD} sản phẩm
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hết Hàng</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {outOfStockItems}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm sản phẩm..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3">Đang tải...</span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isOutOfStock = item.inventory_quantity <= 0;
            const isLowStock =
              item.inventory_quantity > 0 &&
              item.inventory_quantity < LOW_STOCK_THRESHOLD;

            return (
              <Card
                key={item.id}
                className={`overflow-hidden ${
                  isOutOfStock
                    ? "border-red-300 bg-red-50/30"
                    : isLowStock
                      ? "border-orange-300 bg-orange-50/30"
                      : ""
                }`}
              >
                <div className="flex items-center gap-3 p-4">
                  <img
                    src={getImageUrl(item.image_url) || IMAGE_FALLBACK}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = IMAGE_FALLBACK;
                      e.currentTarget.onerror = null;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={`${getCategoryColor(item.category)} text-white text-xs`}
                      >
                        {getCategoryLabel(item.category)}
                      </Badge>
                      <span className="text-sm text-primary font-medium">
                        {Number(item.price).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    {/* Inventory badge */}
                    <div className="flex items-center gap-2 mt-2">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Hết hàng
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Còn{" "}
                          {item.inventory_quantity}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Tồn kho:{" "}
                          {item.inventory_quantity}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleEditOpen(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Inventory Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cập Nhật Số Lượng Tồn Kho</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4 py-2">
              <p className="text-sm font-medium">{editItem.name}</p>
              <div className="space-y-2">
                <Label htmlFor="inv-qty">Số Lượng Tồn Kho</Label>
                <Input
                  id="inv-qty"
                  type="number"
                  min={0}
                  value={editQuantity}
                  onChange={(e) =>
                    setEditQuantity(Math.max(0, Number(e.target.value)))
                  }
                  className={
                    editQuantity < LOW_STOCK_THRESHOLD
                      ? "border-red-400 focus-visible:ring-red-400"
                      : ""
                  }
                />
                {editQuantity < LOW_STOCK_THRESHOLD && editQuantity > 0 && (
                  <p className="text-xs text-orange-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Cảnh báo: Tồn kho dưới {LOW_STOCK_THRESHOLD} sản phẩm
                  </p>
                )}
                {editQuantity <= 0 && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Sản phẩm sẽ bị đánh dấu HẾT HÀNG
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveInventory} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerConcessions;
