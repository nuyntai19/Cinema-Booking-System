import React, { useState } from "react";
import { Search, Star, Trash2, CheckCircle, XCircle, Flag } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  movieId: string;
  movieTitle: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: "approved" | "pending" | "rejected" | "reported";
  helpful: number;
}

const AdminReviews: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "1",
      movieId: "movie-1",
      movieTitle: "MAI",
      userId: "user-1",
      userName: "Nguyễn Văn A",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
      rating: 5,
      comment:
        "Phim rất hay, diễn xuất tốt. Câu chuyện cảm động và ý nghĩa. Đáng xem!",
      createdAt: "2026-01-23T10:30:00",
      status: "approved",
      helpful: 24,
    },
    {
      id: "2",
      movieId: "movie-2",
      movieTitle: "Kung Fu Panda 4",
      userId: "user-2",
      userName: "Trần Thị B",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
      rating: 4,
      comment: "Phim vui nhộn, phù hợp với cả gia đình. Đồ họa đẹp mắt.",
      createdAt: "2026-01-22T15:20:00",
      status: "approved",
      helpful: 18,
    },
    {
      id: "3",
      movieId: "movie-3",
      movieTitle: "Dune: Part Two",
      userId: "user-3",
      userName: "Lê Văn C",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
      rating: 5,
      comment:
        "Siêu phẩm điện ảnh! Hình ảnh hoành tráng, âm nhạc đỉnh cao. Must watch!",
      createdAt: "2026-01-21T09:15:00",
      status: "pending",
      helpful: 0,
    },
    {
      id: "4",
      movieId: "movie-1",
      movieTitle: "MAI",
      userId: "user-4",
      userName: "Phạm Thị D",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user4",
      rating: 2,
      comment: "Phim không hay, nội dung chán. Lãng phí tiền.",
      createdAt: "2026-01-20T14:45:00",
      status: "reported",
      helpful: 3,
    },
    {
      id: "5",
      movieId: "movie-4",
      movieTitle: "Đào, Phở và Piano",
      userId: "user-5",
      userName: "Hoàng Văn E",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user5",
      rating: 4,
      comment: "Phim hay, tái hiện lịch sử tốt. Diễn xuất xuất sắc.",
      createdAt: "2026-01-19T11:20:00",
      status: "approved",
      helpful: 15,
    },
  ]);

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.movieTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || review.status === filterStatus;
    const matchesRating =
      filterRating === "all" || review.rating.toString() === filterRating;
    return matchesSearch && matchesStatus && matchesRating;
  });

  const handleApprove = (id: string, movieTitle: string) => {
    setReviews(
      reviews.map((r) =>
        r.id === id ? { ...r, status: "approved" as const } : r,
      ),
    );
    toast({
      title: "Đã duyệt đánh giá",
      description: `Đánh giá cho phim "${movieTitle}" đã được phê duyệt`,
    });
  };

  const handleReject = (id: string, movieTitle: string) => {
    setReviews(
      reviews.map((r) =>
        r.id === id ? { ...r, status: "rejected" as const } : r,
      ),
    );
    toast({
      title: "Đã từ chối đánh giá",
      description: `Đánh giá cho phim "${movieTitle}" đã bị từ chối`,
      variant: "destructive",
    });
  };

  const handleDelete = (id: string, movieTitle: string) => {
    setReviews(reviews.filter((r) => r.id !== id));
    toast({
      title: "Đã xóa đánh giá",
      description: `Đã xóa đánh giá cho phim "${movieTitle}"`,
    });
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      approved: { color: "bg-green-500", label: "Đã duyệt", icon: CheckCircle },
      pending: { color: "bg-yellow-500", label: "Chờ duyệt", icon: Star },
      rejected: { color: "bg-red-500", label: "Từ chối", icon: XCircle },
      reported: { color: "bg-orange-500", label: "Báo cáo", icon: Flag },
    };
    const config = configs[status as keyof typeof configs];
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const avgRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Đánh Giá</h1>
          <p className="text-muted-foreground">
            Duyệt và quản lý đánh giá phim từ khách hàng
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng đánh giá</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="text-2xl font-bold">
                  {reviews.filter((r) => r.status === "pending").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Đánh giá trung bình
                </p>
                <p className="text-2xl font-bold">{avgRating} ⭐</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-blue-500 fill-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Báo cáo</p>
                <p className="text-2xl font-bold">
                  {reviews.filter((r) => r.status === "reported").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Flag className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Danh Sách Đánh Giá</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                  <SelectItem value="reported">Báo cáo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Đánh giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả sao</SelectItem>
                  <SelectItem value="5">5 sao</SelectItem>
                  <SelectItem value="4">4 sao</SelectItem>
                  <SelectItem value="3">3 sao</SelectItem>
                  <SelectItem value="2">2 sao</SelectItem>
                  <SelectItem value="1">1 sao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người Dùng</TableHead>
                <TableHead>Phim</TableHead>
                <TableHead>Đánh Giá</TableHead>
                <TableHead>Nội Dung</TableHead>
                <TableHead>Hữu Ích</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Thời Gian</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback>
                          {review.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{review.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {review.movieTitle}
                  </TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell>
                    <p className="text-sm max-w-md line-clamp-2">
                      {review.comment}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    {review.helpful}
                  </TableCell>
                  <TableCell>{getStatusBadge(review.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(review.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {review.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleApprove(review.id, review.movieTitle)
                            }
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleReject(review.id, review.movieTitle)
                            }
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDelete(review.id, review.movieTitle)
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

export default AdminReviews;
