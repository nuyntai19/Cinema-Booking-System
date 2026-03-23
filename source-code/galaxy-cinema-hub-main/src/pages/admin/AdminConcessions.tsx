import React, { useState, useEffect } from "react";
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
  Loader2,
  Upload,
  X,
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
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";

interface Concession {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  created_at?: string;
}

const IMAGE_FALLBACK_TEMPLATE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150' viewBox='0 0 100 150'%3E%3Crect fill='%23ddd' width='100' height='150'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='12' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const AdminConcessions: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<Concession | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [concessions, setConcessions] = useState<Concession[]>([]);

  // Fetch concessions from API
  useEffect(() => {
    fetchConcessions();
  }, []);

  const fetchConcessions = async () => {
    try {
      setLoading(true);
      const response = await apiCall<{
        success: boolean;
        data: Concession[];
      }>(API_ENDPOINTS.CONCESSIONS, {
        method: "GET",
      });
      if (response.success && response.data) {
        setConcessions(response.data);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách bắp nước";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    category: "combo" as string,
    price: 0,
    image_url: "",
    is_available: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "combo",
      price: 0,
      image_url: "",
      is_available: true,
    });
    setImageFile(null);
  };

  const handleImageFileChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file ảnh JPG, PNG, GIF hoặc WebP",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước file không được vượt quá 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
  };

  const uploadConcessionImage = async (
    file: File,
    concessionId: number,
  ): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const uploadData = new FormData();
      uploadData.append("image", file);

      const response = await fetch(
        API_ENDPOINTS.CONCESSION_UPLOAD_IMAGE(concessionId),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: uploadData,
        },
      );

      const result = await response.json();
      if (result.success && result.data?.image_url) {
        return result.data.image_url;
      }

      throw new Error(result.message || "Upload ảnh thất bại");
    } catch (error) {
      toast({
        title: "Lỗi upload ảnh",
        description:
          error instanceof Error ? error.message : "Không thể upload ảnh",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadConcessionImageFromUrl = async (
    imageUrl: string,
    concessionId: number,
  ): Promise<string | null> => {
    try {
      setUploadingImage(true);

      const response = await fetch(
        API_ENDPOINTS.CONCESSION_UPLOAD_IMAGE_FROM_URL(concessionId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ image_url: imageUrl }),
        },
      );

      const result = await response.json();
      if (result.success && result.data?.image_url) {
        return result.data.image_url;
      }

      throw new Error(result.message || "Upload ảnh từ URL thất bại");
    } catch (error) {
      toast({
        title: "Lỗi upload URL",
        description:
          error instanceof Error ? error.message : "Không thể upload ảnh từ URL",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value.trim());

  // Statistics
  const totalItems = concessions.length;
  const availableItems = concessions.filter((c) => c.is_available).length;

  // Filter
  const filteredConcessions = concessions.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === "all" ||
      item.category?.toLowerCase() === filterCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleEditItem = (item: Concession) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category || "combo",
      price: item.price,
      image_url: item.image_url || "",
      is_available: item.is_available,
    });
    setImageFile(null);
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;

    try {
      setLoading(true);
      let imageUrl = formData.image_url || null;

      if (imageFile) {
        const uploadedImageUrl = await uploadConcessionImage(
          imageFile,
          selectedItem.id,
        );
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      } else if (imageUrl && isHttpUrl(imageUrl)) {
        const uploadedImageUrl = await uploadConcessionImageFromUrl(
          imageUrl,
          selectedItem.id,
        );
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }

      await apiCall(API_ENDPOINTS.CONCESSIONS + `/${selectedItem.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...formData, image_url: imageUrl }),
      });

      toast({
        title: "Cập nhật thành công",
        description: `Đã cập nhật ${formData.name}`,
      });

      setIsEditDialogOpen(false);
      setSelectedItem(null);
      setImageFile(null);
      fetchConcessions(); // Reload data
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật sản phẩm";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const shouldUploadUrl = !imageFile && isHttpUrl(formData.image_url || "");
      const createResponse = await apiCall<{
        success: boolean;
        data?: { id?: number };
      }>(API_ENDPOINTS.CONCESSIONS, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          image_url: shouldUploadUrl ? null : formData.image_url || null,
        }),
      });

      const createdConcessionId = Number(createResponse?.data?.id || 0);
      if (imageFile && createdConcessionId > 0) {
        const uploadedImageUrl = await uploadConcessionImage(
          imageFile,
          createdConcessionId,
        );

        if (uploadedImageUrl) {
          await apiCall(API_ENDPOINTS.CONCESSIONS + `/${createdConcessionId}`, {
            method: "PUT",
            body: JSON.stringify({ image_url: uploadedImageUrl }),
          });
        }
      } else if (shouldUploadUrl && createdConcessionId > 0) {
        await uploadConcessionImageFromUrl(formData.image_url, createdConcessionId);
      }

      toast({
        title: "Tạo thành công",
        description: `Đã thêm ${formData.name}`,
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchConcessions(); // Reload data
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tạo sản phẩm";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item: Concession) => {
    try {
      setLoading(true);
      await apiCall(API_ENDPOINTS.CONCESSIONS + `/${item.id}`, {
        method: "DELETE",
      });

      toast({
        title: "Đã xóa",
        description: `Đã xóa ${item.name}`,
      });

      fetchConcessions(); // Reload data
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể xóa sản phẩm";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string | null) => {
    const configs: Record<string, { color: string; label: string }> = {
      combo: { color: "bg-purple-500", label: "Combo" },
      popcorn: { color: "bg-yellow-500", label: "Bắp" },
      drink: { color: "bg-blue-500", label: "Nước" },
      snack: { color: "bg-orange-500", label: "Snack" },
    };
    const config = configs[category?.toLowerCase() || "combo"];
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
        <Button
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
          disabled={loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Sản Phẩm
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
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
                src={getImageUrl(item.image_url) || IMAGE_FALLBACK_TEMPLATE}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = IMAGE_FALLBACK_TEMPLATE;
                  e.currentTarget.onerror = null;
                }}
              />
              <div className="absolute top-2 right-2">
                {getCategoryBadge(item.category)}
              </div>
              {!item.is_available && (
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
                    Danh mục: {item.category || "Không xác định"}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">
                    {item.price.toLocaleString("vi-VN")}đ
                  </span>
                  <Badge variant={item.is_available ? "default" : "destructive"}>
                    {item.is_available ? "Còn hàng" : "Hết hàng"}
                  </Badge>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="edit-category">Danh Mục</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value,
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
              <Label htmlFor="edit-image_url">URL Hình Ảnh</Label>
              <Input
                id="edit-image_url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Preview ảnh hiện tại</Label>
              {formData.image_url && !imageFile && (
                <div className="relative w-fit">
                  <img
                    src={getImageUrl(formData.image_url) || IMAGE_FALLBACK_TEMPLATE}
                    alt="Preview"
                    className="w-24 h-36 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.src = IMAGE_FALLBACK_TEMPLATE;
                      e.currentTarget.onerror = null;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: "" })}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {imageFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{imageFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="ml-auto text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image_file">Hoặc tải ảnh lên</Label>
              <Input
                id="edit-image_file"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={(e) =>
                  handleImageFileChange(e.target.files?.[0] || null)
                }
                disabled={loading || uploadingImage}
              />
              <p className="text-xs text-muted-foreground">
                Định dạng: JPG, PNG, GIF, WebP. Tối đa 5MB
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-is_available">Trạng thái</Label>
              <Select
                value={formData.is_available ? "true" : "false"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    is_available: value === "true",
                  })
                }
              >
                <SelectTrigger id="edit-is_available">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Còn hàng</SelectItem>
                  <SelectItem value="false">Hết hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setImageFile(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdateItem} disabled={uploadingImage}>
              {uploadingImage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cập Nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="create-category">Danh Mục</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value,
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
              <Label htmlFor="create-image_url">URL Hình Ảnh</Label>
              <Input
                id="create-image_url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Preview ảnh</Label>
              {formData.image_url && !imageFile && (
                <div className="relative w-fit">
                  <img
                    src={getImageUrl(formData.image_url) || IMAGE_FALLBACK_TEMPLATE}
                    alt="Preview"
                    className="w-24 h-36 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.src = IMAGE_FALLBACK_TEMPLATE;
                      e.currentTarget.onerror = null;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: "" })}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {imageFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{imageFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="ml-auto text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-image_file">Hoặc tải ảnh lên</Label>
              <Input
                id="create-image_file"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={(e) =>
                  handleImageFileChange(e.target.files?.[0] || null)
                }
                disabled={loading || uploadingImage}
              />
              <p className="text-xs text-muted-foreground">
                Định dạng: JPG, PNG, GIF, WebP. Tối đa 5MB
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-is_available">Trạng thái</Label>
              <Select
                value={formData.is_available ? "true" : "false"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    is_available: value === "true",
                  })
                }
              >
                <SelectTrigger id="create-is_available">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Còn hàng</SelectItem>
                  <SelectItem value="false">Hết hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateItem} disabled={uploadingImage}>
              {uploadingImage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tạo Sản Phẩm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminConcessions;
