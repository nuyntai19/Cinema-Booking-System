import React, { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Film,
  Calendar as CalendarIcon,
  Clock,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { movies, cinemas } from "@/data/mockData";

interface Showtime {
  id: string;
  movieId: string;
  movieTitle: string;
  cinemaId: string;
  cinemaName: string;
  room: string;
  date: string;
  time: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
}

const AdminScheduler: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [showtimes, setShowtimes] = useState<Showtime[]>([
    {
      id: "1",
      movieId: "movie-1",
      movieTitle: "MAI",
      cinemaId: "cinema-1",
      cinemaName: "Galaxy Nguyễn Du",
      room: "Phòng 3",
      date: "2026-01-25",
      time: "19:00",
      price: 120000,
      availableSeats: 85,
      totalSeats: 120,
      status: "scheduled",
    },
    {
      id: "2",
      movieId: "movie-2",
      movieTitle: "Kung Fu Panda 4",
      cinemaId: "cinema-2",
      cinemaName: "Galaxy Tân Bình",
      room: "Phòng 1",
      date: "2026-01-25",
      time: "14:00",
      price: 90000,
      availableSeats: 45,
      totalSeats: 120,
      status: "scheduled",
    },
    {
      id: "3",
      movieId: "movie-3",
      movieTitle: "Dune: Part Two",
      cinemaId: "cinema-1",
      cinemaName: "Galaxy Nguyễn Du",
      room: "IMAX",
      date: "2026-01-24",
      time: "20:30",
      price: 150000,
      availableSeats: 0,
      totalSeats: 150,
      status: "completed",
    },
  ]);

  const [formData, setFormData] = useState({
    movieId: "",
    cinemaId: "",
    room: "",
    date: "",
    time: "",
    price: "",
  });

  const filteredShowtimes = showtimes.filter(
    (showtime) =>
      showtime.movieTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      showtime.cinemaName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAdd = () => {
    const movie = movies.find((m) => m.id === formData.movieId);
    const cinema = cinemas.find((c) => c.id === formData.cinemaId);

    if (movie && cinema) {
      toast({
        title: "Thêm lịch chiếu thành công",
        description: `Đã thêm suất chiếu ${movie.title}`,
      });
      setIsAddDialogOpen(false);
      setFormData({
        movieId: "",
        cinemaId: "",
        room: "",
        date: "",
        time: "",
        price: "",
      });
    }
  };

  const handleDelete = (id: string, title: string) => {
    setShowtimes(showtimes.filter((s) => s.id !== id));
    toast({
      title: "Xóa lịch chiếu thành công",
      description: `Đã xóa suất chiếu ${title}`,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: "bg-blue-500",
      ongoing: "bg-green-500",
      completed: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    const labels = {
      scheduled: "Đã xếp",
      ongoing: "Đang chiếu",
      completed: "Đã chiếu",
      cancelled: "Đã hủy",
    };
    return (
      <Badge
        className={`${variants[status as keyof typeof variants]} text-white`}
      >
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Lịch Chiếu</h1>
          <p className="text-muted-foreground">
            Xếp lịch và quản lý suất chiếu phim
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm Suất Chiếu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm Suất Chiếu Mới</DialogTitle>
              <DialogDescription>Xếp lịch chiếu phim cho rạp</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="movie">Phim</Label>
                <Select
                  value={formData.movieId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, movieId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phim" />
                  </SelectTrigger>
                  <SelectContent>
                    {movies
                      .filter((m) => m.isNowShowing)
                      .map((movie) => (
                        <SelectItem key={movie.id} value={movie.id}>
                          {movie.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cinema">Rạp</Label>
                <Select
                  value={formData.cinemaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cinemaId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn rạp" />
                  </SelectTrigger>
                  <SelectContent>
                    {cinemas.map((cinema) => (
                      <SelectItem key={cinema.id} value={cinema.id}>
                        {cinema.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Phòng chiếu</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) =>
                    setFormData({ ...formData, room: e.target.value })
                  }
                  placeholder="VD: Phòng 1, IMAX"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Ngày chiếu</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Giờ chiếu</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Giá vé</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="90000"
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
                <p className="text-sm text-muted-foreground">Tổng suất chiếu</p>
                <p className="text-2xl font-bold">{showtimes.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã xếp lịch</p>
                <p className="text-2xl font-bold">
                  {showtimes.filter((s) => s.status === "scheduled").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang chiếu</p>
                <p className="text-2xl font-bold">
                  {showtimes.filter((s) => s.status === "ongoing").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Film className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tỷ lệ lấp đầy</p>
                <p className="text-2xl font-bold">72%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Danh Sách Lịch Chiếu</CardTitle>
            <div className="flex items-center gap-2">
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
                <TableHead>Phim</TableHead>
                <TableHead>Rạp</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Ngày/Giờ</TableHead>
                <TableHead>Giá Vé</TableHead>
                <TableHead>Ghế Trống</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShowtimes.map((showtime) => (
                <TableRow key={showtime.id}>
                  <TableCell className="font-medium">
                    {showtime.movieTitle}
                  </TableCell>
                  <TableCell>{showtime.cinemaName}</TableCell>
                  <TableCell>{showtime.room}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(showtime.date)}</div>
                      <div className="text-muted-foreground">
                        {showtime.time}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {showtime.price.toLocaleString("vi-VN")}đ
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {showtime.availableSeats}/{showtime.totalSeats}
                      <div className="text-xs text-muted-foreground">
                        {Math.round(
                          (showtime.availableSeats / showtime.totalSeats) * 100,
                        )}
                        %
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(showtime.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDelete(showtime.id, showtime.movieTitle)
                        }
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

export default AdminScheduler;
