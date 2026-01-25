import React, { useState } from "react";
import {
  Coffee,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Image as ImageIcon,
  TrendingUp,
  Package,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface Concession {
  id: number;
  name: string;
  description: string;
  category: "combo" | "popcorn" | "drink" | "snack";
  price: number;
  imageUrl: string;
  stock: number;
  soldCount: number;
  status: "available" | "out-of-stock";
}

const AdminConcessions: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<Concession | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [concessions, setConcessions] = useState<Concession[]>([
    {
      id: 1,
      name: "Combo Couple",
      description: "2 Bắp Lớn + 2 Nước Lớn",
      category: "combo",
      price: 189000,
      imageUrl:
        "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400",
      stock: 50,
      soldCount: 234,
      status: "available",
    },
    {
      id: 2,
      name: "Combo Solo",
      description: "1 Bắp Vừa + 1 Nước Vừa",
      category: "combo",
      price: 99000,
      imageUrl:
        "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400",
      stock: 80,
      soldCount: 567,
      status: "available",
    },
    {
      id: 3,
      name: "Bắp Ngọt Lớn",
      description: "Bắp rang bơ size L",
      category: "popcorn",
      price: 70000,
      imageUrl:
        "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400",
      stock: 120,
      soldCount: 892,
      status: "available",
    },
    {
      id: 4,
      name: "Pepsi Lớn",
      description: "Pepsi size L (32oz)",
      category: "drink",
      price: 45000,
      imageUrl:
        "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400",
      stock: 200,
      soldCount: 1245,
      status: "available",
    },
    {
      id: 5,
      name: "Nước Cam Ép",
      description: "Nước cam tươi ép 100%",
      category: "drink",
      price: 55000,
      imageUrl:
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400",
      stock: 0,
      soldCount: 456,
      status: "out-of-stock",
    },
    {
      id: 6,
      name: "Nachos Phô Mai",
      description: "Nachos với sốt phô mai",
      category: "snack",
      price: 65000,
      imageUrl:
        "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400",
      stock: 45,
      soldCount: 334,
      status: "available",
    },
    {
      id: 7,
      name: "Hot Dog",
      description: "Xúc xích nướng kẹp bánh mì",
      category: "snack",
      price: 50000,
      imageUrl:
        "https://images.unsplash.com/photo-1612392062798-2e264e5a2789?w=400",
      stock: 60,
      soldCount: 278,
      status: "available",
    },
    {
      id: 8,
      name: "Combo Gia Đình",
      description: "3 Bắp Lớn + 3 Nước Lớn + 1 Nachos",
      category: "combo",
      price: 299000,
      imageUrl:
        "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400",
      stock: 30,
      soldCount: 145,
      status: "available",
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "combo" as Concession["category"],
    price: 0,
    imageUrl: "",
    stock: 0,
  });

  // Statistics
  const totalItems = concessions.length;
  const availableItems = concessions.filter(
    (c) => c.status === "available",
  ).length;
  const totalSold = concessions.reduce((sum, c) => sum + c.soldCount, 0);
  const totalRevenue = concessions.reduce(
    (sum, c) => sum + c.soldCount * c.price,
    0,
  );

  // Filter
  const filteredConcessions = concessions.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const handleEditItem = (item: Concession) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      imageUrl: item.imageUrl,
      stock: item.stock,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = () => {
    if (!selectedItem) return;

    setConcessions(
      concessions.map((c) =>
        c.id === selectedItem.id
          ? {
              ...c,
              ...formData,
              status: formData.stock > 0 ? "available" : "out-of-stock",
            }
          : c,
      ),
    );

    toast({
      title: "Cập nhật thành công",
      description: `Đã cập nhật ${formData.name}`,
    });

    setIsEditDialogOpen(false);
    setSelectedItem(null);
  };

  const handleCreateItem = () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    const newItem: Concession = {
      id: concessions.length + 1,
      ...formData,
      soldCount: 0,
      status: formData.stock > 0 ? "available" : "out-of-stock",
    };

    setConcessions([...concessions, newItem]);

    toast({
      title: "Tạo thành công",
      description: `Đã thêm ${formData.name}`,
    });

    setIsCreateDialogOpen(false);
    setFormData({
      name: "",
      description: "",
      category: "combo",
      price: 0,
      imageUrl: "",
      stock: 0,
    });
  };

  const handleDeleteItem = (item: Concession) => {
    setConcessions(concessions.filter((c) => c.id !== item.id));

    toast({
      title: "Đã xóa",
      description: `Đã xóa ${item.name}`,
    });
  };

  const getCategoryBadge = (category: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      combo: { color: "bg-purple-500", label: "Combo" },
      popcorn: { color: "bg-yellow-500", label: "Bắp" },
      drink: { color: "bg-blue-500", label: "Nước" },
      snack: { color: "bg-orange-500", label: "Snack" },
    };
    const config = configs[category];
    return (
      <Badge className={`${config.color} text-white`}>{config.label}</Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Bắp Nước</h1>
          <p className="text-muted-foreground">
            Quản lý sản phẩm và tồn kho concessions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Sản Phẩm
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Sản Phẩm</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Tất cả items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Còn Hàng</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableItems}</div>
            <p className="text-xs text-muted-foreground">Available items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã Bán</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSold.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh Thu</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">Total revenue</p>
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
                placeholder="Tìm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="combo">Combo</SelectItem>
                <SelectItem value="popcorn">Bắp</SelectItem>
                <SelectItem value="drink">Nước</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredConcessions.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative h-48 bg-muted">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                {getCategoryBadge(item.category)}
              </div>
              {item.status === "out-of-stock" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg">
                    Hết Hàng
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">
                    {item.price.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tồn kho:</span>
                    <span className="font-medium">{item.stock}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Đã bán:</span>
                    <span className="font-medium">{item.soldCount}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEditItem(item)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Sửa
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEditItem(item)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteItem(item)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Sản Phẩm</DialogTitle>
            <DialogDescription>Cập nhật thông tin sản phẩm</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên Sản Phẩm *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô Tả</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Danh Mục</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as Concession["category"],
                  })
                }
              >
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combo">Combo</SelectItem>
                  <SelectItem value="popcorn">Bắp</SelectItem>
                  <SelectItem value="drink">Nước</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Giá (đ) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-stock">Tồn Kho</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">URL Hình Ảnh</Label>
              <Input
                id="edit-imageUrl"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://..."
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
            <Button onClick={handleUpdateItem}>Cập Nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Sản Phẩm Mới</DialogTitle>
            <DialogDescription>Tạo sản phẩm concession mới</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Tên Sản Phẩm *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Combo Solo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Mô Tả</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="1 Bắp + 1 Nước..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-category">Danh Mục</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as Concession["category"],
                  })
                }
              >
                <SelectTrigger id="create-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combo">Combo</SelectItem>
                  <SelectItem value="popcorn">Bắp</SelectItem>
                  <SelectItem value="drink">Nước</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-price">Giá (đ) *</Label>
                <Input
                  id="create-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-stock">Tồn Kho</Label>
                <Input
                  id="create-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-imageUrl">URL Hình Ảnh</Label>
              <Input
                id="create-imageUrl"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://..."
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
            <Button onClick={handleCreateItem}>Tạo Sản Phẩm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminConcessions;
