import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Film,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Armchair,
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import {
  detectScheduleConflict,
  checkVietnameseQuota,
  calculateShowtimeEnd,
} from "@/lib/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Showtime {
  id: string;
  movieId: string;
  movieTitle: string;
  cinemaId: string;
  cinemaName: string;
  hallId: string;
  room: string;
  date: string;
  time: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  duration: number;
}

interface BackendMovie {
  id: number;
  title: string;
  duration_minutes: number;
  status: string;
  origin: string;
}

interface BackendCinema {
  id: number;
  name: string;
  address: string;
}

interface BackendHall {
  id: number;
  name: string;
  total_seats: number;
}

interface BackendShowtime {
  id: number;
  movie_title: string;
  movie_id: number;
  cinema_id: number;
  cinema_name: string;
  cinema_hall_id: number;
  hall_name: string;
  start_time: string;
  total_seats: number;
  base_price?: number;
  duration_minutes: number;
}

const AdminScheduler: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(
    null,
  );
  const [searchCategory, setSearchCategory] = useState<"movie" | "cinema" | "room">("movie");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [moviesList, setMoviesList] = useState<BackendMovie[]>([]);
  const [cinemasList, setCinemasList] = useState<BackendCinema[]>([]);
  const [hallsList, setHallsList] = useState<BackendHall[]>([]);
  const [loadingHalls, setLoadingHalls] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [moviesRes, cinemasRes, showtimesRes] = await Promise.all([
        apiCall<{ success: boolean; data: { movies: BackendMovie[]; pagination: unknown } }>(`${API_ENDPOINTS.MOVIES}?limit=200`),
        apiCall<{ success: boolean; data: { cinemas: BackendCinema[] } }>(API_ENDPOINTS.CINEMAS),
        apiCall<{ success: boolean; data: { showtimes: BackendShowtime[] } }>(`${API_ENDPOINTS.SHOWTIMES}?limit=200`),
      ]);

      setMoviesList(moviesRes.data?.movies || []);
      setCinemasList(cinemasRes.data?.cinemas || []);

      const backendShowtimes = showtimesRes.data?.showtimes || [];
      const mapped: Showtime[] = backendShowtimes.map((s) => {
        const startDate = new Date(s.start_time);
        return {
          id: String(s.id),
          movieId: String(s.movie_id),
          movieTitle: s.movie_title,
          cinemaId: String(s.cinema_id),
          cinemaName: s.cinema_name,
          hallId: String(s.cinema_hall_id),
          room: s.hall_name,
          date: startDate.toISOString().split("T")[0],
          time: startDate.toTimeString().slice(0, 5),
          price: s.base_price || 90000,
          availableSeats: s.total_seats || 0,
          totalSeats: s.total_seats || 0,
          status: startDate > new Date() ? "scheduled" : "completed",
          duration: s.duration_minutes || 0,
        };
      });
      setShowtimes(mapped);
    } catch (error) {
      console.error("Failed to fetch scheduler data:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu lịch chiếu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [formData, setFormData] = useState({
    movieId: "",
    cinemaId: "",
    hallId: "",
    date: "",
    time: "",
    price: "",
  });

  // Load halls when cinema changes
  useEffect(() => {
    if (!formData.cinemaId) {
      setHallsList([]);
      setFormData(prev => ({ ...prev, hallId: "" }));
      return;
    }
    const loadHalls = async () => {
      setLoadingHalls(true);
      try {
        const res = await apiCall<{ success: boolean; data: { halls: BackendHall[] } }>(
          API_ENDPOINTS.CINEMA_HALLS(Number(formData.cinemaId))
        );
        setHallsList(res.data?.halls || []);
      } catch {
        setHallsList([]);
      } finally {
        setLoadingHalls(false);
      }
    };
    loadHalls();
  }, [formData.cinemaId]);

  // Clear errors when form data changes
  useEffect(() => {
    setConflictError(null);
    setQuotaWarning(null);
  }, [formData]);

  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const filteredShowtimes = showtimes
    .filter((showtime) => {
      const query = searchQuery.toLowerCase();
      switch (searchCategory) {
        case "cinema":
          return showtime.cinemaName.toLowerCase().includes(query);
        case "room":
          return showtime.room.toLowerCase().includes(query);
        default:
          return showtime.movieTitle.toLowerCase().includes(query);
      }
    })
    .sort((a, b) => {
      const priority = {
        ongoing: 1,
        scheduled: 2,
        completed: 3,
        cancelled: 4,
      };
      return priority[a.status] - priority[b.status];
    });

  const totalPages = Math.ceil(filteredShowtimes.length / itemsPerPage);
  const paginatedShowtimes = filteredShowtimes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchCategory, filterDate]);

  const handleAdd = async () => {
    const movie = moviesList.find((m) => String(m.id) === formData.movieId);
    const cinema = cinemasList.find((c) => String(c.id) === formData.cinemaId);

    if (!movie || !cinema || !formData.hallId) return;

    setConflictError(null);

    try {
      const startTime = `${formData.date} ${formData.time}:00`;
      await apiCall(API_ENDPOINTS.SHOWTIMES, {
        method: "POST",
        body: JSON.stringify({
          movie_id: movie.id,
          cinema_hall_id: Number(formData.hallId),
          start_time: startTime,
          base_price: Number(formData.price) || 90000,
        }),
      });

      toast({
        title: "Thêm lịch chiếu thành công",
        description: `Đã thêm suất chiếu ${movie.title}`,
      });
      setIsAddDialogOpen(false);
      setFormData({
        movieId: "",
        cinemaId: "",
        hallId: "",
        date: "",
        time: "",
        price: "",
      });
      setHallsList([]);
      await fetchData();
    } catch (error: any) {
      const message = error?.message || "Không thể thêm suất chiếu";
      if (message.includes("Trùng lịch") || message.includes("conflict")) {
        setConflictError(message);
      } else {
        toast({
          title: "Lỗi",
          description: message,
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await apiCall(`${API_ENDPOINTS.SHOWTIMES}/${id}`, {
        method: "DELETE",
      });
      setShowtimes(showtimes.filter((s) => s.id !== id));
      toast({
        title: "Xóa lịch chiếu thành công",
        description: `Đã xóa suất chiếu ${title}`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa suất chiếu",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (selectedShowtime) {
      try {
        const startTime = `${selectedShowtime.date} ${selectedShowtime.time}:00`;
        await apiCall(`${API_ENDPOINTS.SHOWTIMES}/${selectedShowtime.id}`, {
          method: "PUT",
          body: JSON.stringify({
            movie_id: Number(selectedShowtime.movieId),
            start_time: startTime,
            base_price: selectedShowtime.price,
          }),
        });
        toast({
          title: "Cập nhật lịch chiếu thành công",
          description: `Đã cập nhật suất chiếu ${selectedShowtime.movieTitle}`,
        });
        setIsEditDialogOpen(false);
        setSelectedShowtime(null);
        await fetchData();
      } catch (error: any) {
        const message = error?.message || "Không thể cập nhật suất chiếu";
        toast({
          title: "Lỗi",
          description: message,
          variant: "destructive",
        });
      }
    }
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
                    {moviesList.map((movie) => (
                      <SelectItem key={movie.id} value={String(movie.id)}>
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
                    {cinemasList.map((cinema) => (
                      <SelectItem key={cinema.id} value={String(cinema.id)}>
                        {cinema.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hall">Phòng chiếu</Label>
                <Select
                  value={formData.hallId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, hallId: value })
                  }
                  disabled={!formData.cinemaId || loadingHalls}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.cinemaId ? "Chọn rạp trước" :
                        loadingHalls ? "Đang tải..." :
                          hallsList.length === 0 ? "Không có phòng" :
                            "Chọn phòng chiếu"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {hallsList.map((hall) => (
                      <SelectItem key={hall.id} value={String(hall.id)}>
                        {hall.name} ({hall.total_seats} ghế)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {/* Conflict Error Alert */}
              {conflictError && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    {conflictError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Quota Warning Alert */}
              {quotaWarning && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    {quotaWarning}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleAdd} disabled={!!conflictError}>
                Thêm
              </Button>
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
              <Select
                value={searchCategory}
                onValueChange={(value: any) => setSearchCategory(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tìm theo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Tên phim</SelectItem>
                  <SelectItem value="cinema">Tên rạp</SelectItem>
                  <SelectItem value="room">Tên phòng</SelectItem>
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
              {paginatedShowtimes.map((showtime) => (
                <TableRow key={showtime.id}>
                  <TableCell className="font-medium">
                    {showtime.movieTitle}
                  </TableCell>
                  <TableCell>{showtime.cinemaName}</TableCell>
                  <TableCell>{showtime.room}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(showtime.date)}</div>
                      <div className="text-muted-foreground font-medium">
                        {showtime.time} - {new Date(new Date(showtime.date + 'T' + showtime.time).getTime() + showtime.duration * 60000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xem sơ đồ ghế"
                        onClick={() =>
                          navigate(`/admin/seats?hallId=${showtime.hallId}&cinemaId=${showtime.cinemaId}`)
                        }
                      >
                        <Armchair className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(showtime)}
                      >
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

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === i + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(i + 1);
                        }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Showtime Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Suất Chiếu</DialogTitle>
          </DialogHeader>
          {selectedShowtime && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-movie">Phim</Label>
                  <Select
                    value={selectedShowtime.movieId}
                    onValueChange={(value) =>
                      setSelectedShowtime({
                        ...selectedShowtime,
                        movieId: value,
                        movieTitle:
                          moviesList.find((m) => String(m.id) === value)?.title || "",
                      })
                    }
                  >
                    <SelectTrigger id="edit-movie">
                      <SelectValue placeholder="Chọn phim" />
                    </SelectTrigger>
                    <SelectContent>
                      {moviesList.map((movie) => (
                        <SelectItem key={movie.id} value={String(movie.id)}>
                          {movie.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cinema">Rạp</Label>
                  <Select
                    value={selectedShowtime.cinemaId}
                    onValueChange={(value) =>
                      setSelectedShowtime({
                        ...selectedShowtime,
                        cinemaId: value,
                        cinemaName:
                          cinemasList.find((c) => String(c.id) === value)?.name || "",
                      })
                    }
                  >
                    <SelectTrigger id="edit-cinema">
                      <SelectValue placeholder="Chọn rạp" />
                    </SelectTrigger>
                    <SelectContent>
                      {cinemasList.map((cinema) => (
                        <SelectItem key={cinema.id} value={String(cinema.id)}>
                          {cinema.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-room">Phòng</Label>
                  <Input
                    id="edit-room"
                    value={selectedShowtime.room}
                    onChange={(e) =>
                      setSelectedShowtime({
                        ...selectedShowtime,
                        room: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Ngày Chiếu</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={selectedShowtime.date}
                    onChange={(e) =>
                      setSelectedShowtime({
                        ...selectedShowtime,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Giờ Chiếu</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={selectedShowtime.time}
                    onChange={(e) =>
                      setSelectedShowtime({
                        ...selectedShowtime,
                        time: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Giá Vé (VNĐ)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={selectedShowtime.price}
                    onChange={(e) =>
                      setSelectedShowtime({
                        ...selectedShowtime,
                        price: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-total-seats">Tổng Ghế</Label>
                  <Input
                    id="edit-total-seats"
                    type="number"
                    value={selectedShowtime.totalSeats}
                    onChange={(e) =>
                      setSelectedShowtime({
                        ...selectedShowtime,
                        totalSeats: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Trạng Thái</Label>
                <Select
                  value={selectedShowtime.status}
                  onValueChange={(
                    value: "scheduled" | "ongoing" | "completed" | "cancelled",
                  ) =>
                    setSelectedShowtime({
                      ...selectedShowtime,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Đã Lên Lịch</SelectItem>
                    <SelectItem value="ongoing">Đang Chiếu</SelectItem>
                    <SelectItem value="completed">Hoàn Thành</SelectItem>
                    <SelectItem value="cancelled">Đã Hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
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
    </div>
  );
};

export default AdminScheduler;
