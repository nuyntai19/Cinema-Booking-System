import React, { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";

interface Cinema {
  id: string;
  name: string;
  address: string;
  hotline: string;
  totalRooms: number;
  totalSeats: number;
  features: string[];
  status: "active" | "maintenance" | "closed";
  manager: string;
}

const AdminCinemas: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [cinemas, setCinemas] = useState<Cinema[]>([
    {
      id: "1",
      name: "Galaxy Nguyễn Du",
      address: "116 Nguyễn Du, Quận 1, TP.HCM",
      hotline: "1900 2224",
      totalRooms: 8,
      totalSeats: 960,
      features: ["IMAX", "4DX", "Standard"],
      status: "active",
      manager: "Nguyễn Văn A",
    },
    {
      id: "2",
      name: "Galaxy Tân Bình",
      address: "246 Nguyễn Hồng Đào, Tân Bình, TP.HCM",
      hotline: "1900 2224",
      totalRooms: 6,
      totalSeats: 720,
      features: ["Standard", "VIP"],
      status: "active",
      manager: "Trần Thị B",
    },
    {
      id: "3",
      name: "Galaxy Quang Trung",
      address: "304A Quang Trung, Gò Vấp, TP.HCM",
      hotline: "1900 2224",
      totalRooms: 5,
      totalSeats: 600,
      features: ["IMAX", "Standard"],
      status: "maintenance",
      manager: "Lê Văn C",
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    hotline: "",
    manager: "",
  });

  const filteredCinemas = cinemas.filter(
    (cinema) =>
      cinema.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cinema.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAdd = () => {
    toast({
      title: "Thêm rạp thành công",
      description: `Đã thêm rạp ${formData.name}`,
    });
    setIsAddDialogOpen(false);
    setFormData({ name: "", address: "", hotline: "", manager: "" });
  };

  const handleDelete = (id: string, name: string) => {
    setCinemas(cinemas.filter((c) => c.id !== id));
    toast({
      title: "Xóa rạp thành công",
      description: `Đã xóa rạp ${name}`,
    });
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
          <DialogContent>
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
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Địa chỉ đầy đủ"
                />
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
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) =>
                    setFormData({ ...formData, manager: e.target.value })
                  }
                  placeholder="Tên quản lý rạp"
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
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm rạp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
                      <Button variant="ghost" size="icon">
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
    </div>
  );
};

export default AdminCinemas;
