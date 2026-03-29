import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, MapPin, Phone, Star } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import LocationPickerMap from "@/components/cinema/LocationPickerMap";


interface Cinema {
  id: string;
  name: string;
  address: string;
  street: string;
  district: string;
  city: string;
  lat: number | null;
  lng: number | null;
  hotline: string;
  totalRooms: number;
  totalSeats: number;
  features: string[];
  status: "active" | "maintenance" | "closed";
  manager: string;
  manager_id: number | null;
}

interface ManagerUser {
  id: number;
  email: string;
  full_name: string;
}

interface BackendCinema {
  id: number;
  name: string;
  address: string;
  street?: string;
  district?: string;
  city?: string;
  lat?: number;
  lng?: number;
  hotline?: string;
  status?: string;
  manager_name?: string;
  manager_id?: number | null;
  total_halls?: number;
  total_seats?: number;
  halls?: { id: number; name: string; total_seats: number }[];
}

const VIETNAM_CITIES = [
  "Thành phố Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
];

const HCM_DISTRICTS = [
  "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12",
  "Quận Bình Tân", "Quận Bình Thạnh", "Quận Gò Vấp", "Quận Phú Nhuận", "Quận Tân Bình", "Quận Tân Phú",
  "Thành phố Thủ Đức", "Huyện Bình Chánh", "Huyện Cần Giờ", "Huyện Củ Chi", "Huyện Hóc Môn", "Huyện Nhà Bè"
];

const AdminCinemas: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCategory, setSearchCategory] = useState<"name" | "address" | "manager">("name");
  const [managers, setManagers] = useState<ManagerUser[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const fetchManagers = async () => {
    setLoadingManagers(true);
    try {
      const res = await apiCall<{ success: boolean; data: { users: { id: number; email: string; full_name: string; role_name?: string }[] } }>(
        `${API_ENDPOINTS.USERS}?limit=100&role_id=4`
      );
      const list = (res.data?.users || []).map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name || u.email,
      }));
      setManagers(list);
    } catch {
      // fallback: silent
    } finally {
      setLoadingManagers(false);
    }
  };

  // Hall Management State
  const [isHallsDialogOpen, setIsHallsDialogOpen] = useState(false);
  const [halls, setHalls] = useState<BackendCinema["halls"]>([]);

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      const response = await apiCall<{ success: boolean; data: { cinemas: BackendCinema[] } }>(
        API_ENDPOINTS.CINEMAS
      );
      const backendCinemas = response.data?.cinemas || [];
      const mapped: Cinema[] = backendCinemas.map((c) => ({
        id: String(c.id),
        name: c.name,
        address: c.address,
        street: c.street || "",
        district: c.district || "",
        city: c.city || "",
        lat: c.lat ? Number(c.lat) : null,
        lng: c.lng ? Number(c.lng) : null,
        hotline: c.hotline || "1900 2224",
        totalRooms: Number(c.total_halls || c.halls?.length || 0),
        totalSeats: Number(c.total_seats || c.halls?.reduce((sum, h) => sum + h.total_seats, 0) || 0),
        features: c.halls?.map((h) => h.name) || [],
        status: (c.status as "active" | "maintenance" | "closed") || "active",
        manager: c.manager_name || "Chưa gán",
        manager_id: c.manager_id || null,
      }));
      setCinemas(mapped);
    } catch (error) {
      console.error("Failed to fetch cinemas:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách rạp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCinemas();
    fetchManagers();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    street: "",
    district: "",
    city: "Thành phố Hồ Chí Minh",
    hotline: "",
    manager_id: "" as string,
    lat: null as number | null,
    lng: null as number | null,
  });

  const filteredCinemas = cinemas.filter((cinema) => {
    const value = searchQuery.toLowerCase();
    switch (searchCategory) {
      case "address":
        return cinema.address.toLowerCase().includes(value);
      case "manager":
        return cinema.manager.toLowerCase().includes(value);
      default:
        return cinema.name.toLowerCase().includes(value);
    }
  });

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên rạp không được để trống",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.street.trim() || !formData.district || !formData.city) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ địa chỉ (Tên đường, Quận, Thành phố)",
        variant: "destructive",
      });
      return false;
    }
    // Validate Hotline: Only digits and spaces allowed
    if (formData.hotline && !/^[0-9\s]+$/.test(formData.hotline)) {
      toast({
        title: "Lỗi",
        description: "Hotline chỉ được chứa số và khoảng trắng",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      const fullAddress = `${formData.street}, ${formData.district}, ${formData.city}`;
      await apiCall(API_ENDPOINTS.CINEMAS, {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          address: fullAddress,
          street: formData.street,
          district: formData.district,
          city: formData.city,
          hotline: formData.hotline,
          lat: formData.lat,
          lng: formData.lng,
          manager_id: formData.manager_id && formData.manager_id !== "none" ? Number(formData.manager_id) : null,
        }),
      });
      toast({
        title: "Thêm rạp thành công",
        description: `Đã thêm rạp ${formData.name}`,
      });
      setIsAddDialogOpen(false);
      setFormData({ name: "", street: "", district: "", city: "Thành phố Hồ Chí Minh", hotline: "", manager_id: "", lat: null, lng: null });
      // Refresh the list
      await fetchCinemas();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm rạp",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cinema: Cinema) => {
    setSelectedCinema(cinema);
    setFormData({
      name: cinema.name,
      street: cinema.street,
      district: cinema.district,
      city: cinema.city || "Thành phố Hồ Chí Minh",
      hotline: cinema.hotline,
      manager_id: cinema.manager_id ? String(cinema.manager_id) : "",
      lat: cinema.lat,
      lng: cinema.lng,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (selectedCinema) {
      if (!validateForm()) return;

      try {
        const fullAddress = `${formData.street}, ${formData.district}, ${formData.city}`;
        await apiCall(`${API_ENDPOINTS.CINEMAS}/${selectedCinema.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formData.name,
            address: fullAddress,
            street: formData.street,
            district: formData.district,
            city: formData.city,
            hotline: formData.hotline,
            lat: formData.lat,
            lng: formData.lng,
            manager_id: formData.manager_id && formData.manager_id !== "none" ? Number(formData.manager_id) : null,
          }),
        });
        toast({
          title: "Cập nhật thành công",
          description: `Đã cập nhật rạp ${formData.name}`,
        });
        setIsEditDialogOpen(false);
        setFormData({ name: "", street: "", district: "", city: "Thành phố Hồ Chí Minh", hotline: "", manager_id: "", lat: null, lng: null });
        // Re-fetch from server to ensure UI shows the actual saved data
        await fetchCinemas();
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật rạp",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await apiCall(`${API_ENDPOINTS.CINEMAS}/${id}`, {
        method: "DELETE",
      });
      setCinemas(cinemas.filter((c) => c.id !== id));
      toast({
        title: "Xóa rạp thành công",
        description: `Đã xóa rạp ${name}`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa rạp",
        variant: "destructive",
      });
    }
  };

  const handleManageHalls = async (cinema: Cinema) => {
    setSelectedCinema(cinema);
    try {
      const response = await apiCall<{ data: { halls: any[] } }>(
        API_ENDPOINTS.CINEMA_HALLS(Number(cinema.id))
      );
      setHalls(response.data.halls);
      setIsHallsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách phòng chiếu",
        variant: "destructive",
      });
    }
  };

  const handleOpenConfig = (hall: any) => {
    navigate(`/admin/seats?hallId=${hall.id}&cinemaId=${selectedCinema?.id}`);
  };

  const handleCreateHall = async () => {
    const name = prompt("Nhập tên phòng chiếu (VD: Phòng 5, IMAX...):");
    if (!name || !selectedCinema) return;

    try {
      await apiCall(API_ENDPOINTS.HALLS, {
        method: "POST",
        body: JSON.stringify({ cinema_id: selectedCinema.id, name }),
      });
      handleManageHalls(selectedCinema);
      toast({ title: "Thành công", description: "Đã thêm phòng chiếu" });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể thêm phòng", variant: "destructive" });
    }
  };

  const handleDeleteHall = async (hallId: number) => {
    if (!confirm("Bạn có chắc muốn xóa phòng chiếu này?")) return;
    try {
      await apiCall(API_ENDPOINTS.HALL_DETAIL(hallId), { method: "DELETE" });
      if (selectedCinema) handleManageHalls(selectedCinema);
      toast({ title: "Thành công", description: "Đã xóa phòng" });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể xóa phòng. Có thể phòng đã có suất chiếu.", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-500",
      maintenance: "bg-yellow-500",
      closed: "bg-red-500",
    };
    const labels = {
      active: "Hoạt động",
      maintenance: "Bảo trì",
      closed: "Đóng cửa",
    };
    return (
      <Badge
        className={`${variants[status as keyof typeof variants]} text-white`}
      >
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const assignedManagerIds = cinemas.map(c => c.manager_id).filter((id): id is number => id !== null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Rạp</h1>
          <p className="text-muted-foreground">
            Quản lý hệ thống rạp chiếu phim
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm Rạp
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm Rạp Mới</DialogTitle>
              <DialogDescription>
                Thêm rạp chiếu phim mới vào hệ thống
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên rạp</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="VD: Galaxy Nguyễn Du"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="city">Thành phố</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => setFormData({ ...formData, city: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thành phố" />
                    </SelectTrigger>
                    <SelectContent>
                      {VIETNAM_CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">Quận/Huyện</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(value) => setFormData({ ...formData, district: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quận/huyện" />
                    </SelectTrigger>
                    <SelectContent>
                      {HCM_DISTRICTS.map(district => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Tên đường</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) =>
                      setFormData({ ...formData, street: e.target.value })
                    }
                    placeholder="VD: 116 Nguyễn Du"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hotline">Hotline</Label>
                <Input
                  id="hotline"
                  value={formData.hotline}
                  onChange={(e) =>
                    setFormData({ ...formData, hotline: e.target.value })
                  }
                  placeholder="1900 xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Quản lý</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
                >
                  <SelectTrigger id="manager">
                    <SelectValue placeholder={loadingManagers ? "Đang tải..." : "Chọn quản lý rạp"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Chưa gán quản lý --</SelectItem>
                    {managers.map((m) => {
                      const isAssigned = assignedManagerIds.includes(m.id);
                      return (
                        <SelectItem key={m.id} value={String(m.id)} disabled={isAssigned}>
                          {m.full_name} {isAssigned && "(Đã gán rạp khác)"}
                          <span className="text-xs text-muted-foreground ml-1">({m.email})</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 pt-2">
                <LocationPickerMap 
                  lat={formData.lat} 
                  lng={formData.lng} 
                  onChange={(lat, lng) => setFormData({ ...formData, lat, lng })}
                  addressToSearch={[formData.street, formData.district, formData.city].filter(Boolean).join(", ")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleAdd}>Thêm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng số rạp</p>
                <p className="text-2xl font-bold">{cinemas.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                <p className="text-2xl font-bold">
                  {cinemas.filter((c) => c.status === "active").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Tổng phòng chiếu
                </p>
                <p className="text-2xl font-bold">
                  {cinemas.reduce((sum, c) => sum + c.totalRooms, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng ghế ngồi</p>
                <p className="text-2xl font-bold">
                  {cinemas.reduce((sum, c) => sum + c.totalSeats, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh Sách Rạp</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={searchCategory}
                onValueChange={(value: any) => setSearchCategory(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tìm theo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Tên rạp</SelectItem>
                  <SelectItem value="address">Địa chỉ</SelectItem>
                  <SelectItem value="manager">Quản lý</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Rạp</TableHead>
                <TableHead>Địa Chỉ</TableHead>
                <TableHead>Hotline</TableHead>
                <TableHead>Phòng/Ghế</TableHead>
                <TableHead>Tiện Ích</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Quản Lý</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCinemas.map((cinema) => (
                <TableRow key={cinema.id}>
                  <TableCell className="font-medium">{cinema.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{cinema.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{cinema.hotline}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{cinema.totalRooms} phòng</div>
                      <div className="text-muted-foreground">
                        {cinema.totalSeats} ghế
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {cinema.features.map((feature) => (
                        <Badge
                          key={feature}
                          variant="secondary"
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(cinema.status)}</TableCell>
                  <TableCell className="text-sm">{cinema.manager}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(cinema)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cinema.id, cinema.name)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Cinema Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Rạp Chiếu</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin rạp {selectedCinema?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Tên rạp *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Galaxy Nguyễn Du"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-city">Thành phố</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thành phố" />
                  </SelectTrigger>
                  <SelectContent>
                    {VIETNAM_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-district">Quận/Huyện</Label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => setFormData({ ...formData, district: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn quận/huyện" />
                  </SelectTrigger>
                  <SelectContent>
                    {HCM_DISTRICTS.map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-street">Tên đường</Label>
                <Input
                  id="edit-street"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  placeholder="116 Nguyễn Du"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-hotline">Hotline</Label>
              <Input
                id="edit-hotline"
                value={formData.hotline}
                onChange={(e) =>
                  setFormData({ ...formData, hotline: e.target.value })
                }
                placeholder="1900 2224"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-manager">Quản lý</Label>
              <Select
                value={formData.manager_id}
                onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
              >
                <SelectTrigger id="edit-manager">
                  <SelectValue placeholder={loadingManagers ? "Đang tải..." : "Chọn quản lý rạp"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Chưa gán quản lý --</SelectItem>
                  {managers.map((m) => {
                    const isAssigned = assignedManagerIds.includes(m.id) && m.id !== selectedCinema?.manager_id;
                    return (
                      <SelectItem key={m.id} value={String(m.id)} disabled={isAssigned}>
                        {m.full_name} {isAssigned && "(Đã gán rạp khác)"}
                        <span className="text-xs text-muted-foreground ml-1">({m.email})</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 col-span-2 pt-2">
              <LocationPickerMap 
                lat={formData.lat} 
                lng={formData.lng} 
                onChange={(lat, lng) => setFormData({ ...formData, lat, lng })}
                addressToSearch={[formData.street, formData.district, formData.city].filter(Boolean).join(", ")}
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
            <Button onClick={handleUpdate}>Cập Nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hall Management Dialog */}
      <Dialog open={isHallsDialogOpen} onOpenChange={setIsHallsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Quản lý Phòng Chiếu - {selectedCinema?.name}</DialogTitle>
            <DialogDescription> Thêm, xóa phòng và thiết lập sơ đồ ghế </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleCreateHall} className="gap-2">
                <Plus className="w-4 h-4" /> Thêm Phòng
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên Phòng</TableHead>
                    <TableHead>Tổng số ghế</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {halls?.map((hall) => (
                    <TableRow key={hall.id}>
                      <TableCell className="font-medium">{hall.name}</TableCell>
                      <TableCell>{hall.total_seats} ghế</TableCell>
                      <TableCell>
                        <Badge variant="outline">Sẵn sàng</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/seats/${hall.id}`)}>
                          Thiết lập sơ đồ
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteHall(hall.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!halls || halls.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Chưa có phòng chiếu nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default AdminCinemas;
