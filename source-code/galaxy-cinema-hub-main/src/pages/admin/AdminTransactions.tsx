import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  CreditCard,
  CheckCircle,
  XCircle,
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
import { API_ENDPOINTS, apiCall } from "@/lib/api";

interface Transaction {
  id: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  movieTitle: string;
  cinemaName: string;
  showDate: string;
  showTime: string;
  seatCount: number;
  amount: number;
  paymentMethod: string;
  status: "success" | "pending" | "failed" | "refunded";
  transactionDate: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface BookingListItem {
  id: number;
  user_id: number;
}

interface BookingListResponseData {
  items: BookingListItem[];
}

interface BookingDetail {
  id: number;
  user_id: number;
  movie_title?: string;
  cinema_name?: string;
  start_time?: string;
  status?: "Pending" | "Paid" | "Cancelled" | "Expired";
  final_price?: number | string;
  total_price?: number | string;
  created_at?: string;
  tickets?: Array<{ id: number }>;
  transaction?: {
    transaction_code?: string;
    payment_method?: string;
    amount?: number | string;
    status?: "Pending" | "Success" | "Failed";
    created_at?: string;
  } | null;
}

interface UserDetailResponse {
  user?: {
    id?: number;
    email?: string;
    profile?: {
      full_name?: string;
    } | null;
  };
}

const AdminTransactions: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizeStatus = (
      transactionStatus?: "Pending" | "Success" | "Failed",
      bookingStatus?: "Pending" | "Paid" | "Cancelled" | "Expired",
    ): Transaction["status"] => {
      if (transactionStatus === "Success") return "success";
      if (transactionStatus === "Pending") return "pending";
      if (transactionStatus === "Failed") return "failed";
      if (bookingStatus === "Cancelled") return "refunded";
      return "pending";
    };

    const loadTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const bookingsRes = await apiCall<ApiResponse<BookingListResponseData>>(
          `${API_ENDPOINTS.BOOKINGS}?page=1&limit=100`,
        );

        const bookingItems = bookingsRes.data?.items ?? [];
        if (bookingItems.length === 0) {
          setTransactions([]);
          return;
        }

        const bookingDetailResults = await Promise.allSettled(
          bookingItems.map((booking) =>
            apiCall<ApiResponse<BookingDetail>>(
              API_ENDPOINTS.BOOKING_DETAIL(booking.id),
            ),
          ),
        );

        const detailData = bookingDetailResults
          .filter(
            (result): result is PromiseFulfilledResult<ApiResponse<BookingDetail>> =>
              result.status === "fulfilled" && !!result.value?.data,
          )
          .map((result) => result.value.data);

        const uniqueUserIds = Array.from(
          new Set(
            detailData
              .map((detail) => detail.user_id)
              .filter((userId): userId is number => typeof userId === "number"),
          ),
        );

        const userResults = await Promise.allSettled(
          uniqueUserIds.map((userId) =>
            apiCall<ApiResponse<UserDetailResponse>>(`${API_ENDPOINTS.USERS}/${userId}`),
          ),
        );

        const userMap = new Map<number, { name: string; email: string }>();
        userResults.forEach((result) => {
          if (result.status !== "fulfilled") return;

          const user = result.value.data?.user;
          const userId = user?.id;
          if (!userId) return;

          userMap.set(userId, {
            name: user.profile?.full_name || `User #${userId}`,
            email: user.email || "-",
          });
        });

        const mapped = detailData
          .map((detail) => {
            const startTime = detail.start_time ? new Date(detail.start_time) : null;
            const transactionAmount =
              detail.transaction?.amount ?? detail.final_price ?? detail.total_price ?? 0;
            const amount =
              typeof transactionAmount === "string"
                ? parseFloat(transactionAmount)
                : transactionAmount;

            return {
              id: String(detail.id),
              bookingCode:
                detail.transaction?.transaction_code ||
                `BK-${String(detail.id).padStart(6, "0")}`,
              customerName: userMap.get(detail.user_id)?.name || `User #${detail.user_id}`,
              customerEmail: userMap.get(detail.user_id)?.email || "-",
              movieTitle: detail.movie_title || "-",
              cinemaName: detail.cinema_name || "-",
              showDate: startTime ? startTime.toISOString().split("T")[0] : "",
              showTime: startTime
                ? startTime.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "-",
              seatCount: detail.tickets?.length ?? 0,
              amount: Number.isFinite(amount) ? amount : 0,
              paymentMethod: detail.transaction?.payment_method || "-",
              status: normalizeStatus(detail.transaction?.status, detail.status),
              transactionDate: detail.transaction?.created_at || detail.created_at || "",
            } as Transaction;
          })
          .sort(
            (a, b) =>
              new Date(b.transactionDate).getTime() -
              new Date(a.transactionDate).getTime(),
          );

        setTransactions(mapped);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Không thể tải dữ liệu giao dịch";
        setError(message);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
    const matchesSearch =
      transaction.bookingCode
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.customerName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.movieTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || transaction.status === filterStatus;
    return matchesSearch && matchesStatus;
  }), [transactions, searchQuery, filterStatus]);

  const totalRevenue = useMemo(() => transactions
    .filter((t) => t.status === "success")
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const getStatusBadge = (status: string) => {
    const configs = {
      success: {
        color: "bg-green-500",
        label: "Thành công",
        icon: CheckCircle,
      },
      pending: { color: "bg-yellow-500", label: "Đang xử lý", icon: Clock },
      failed: { color: "bg-red-500", label: "Thất bại", icon: XCircle },
      refunded: {
        color: "bg-gray-500",
        label: "Đã hoàn tiền",
        icon: CreditCard,
      },
    };
    const config = configs[status as keyof typeof configs];
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Giao Dịch</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý các giao dịch thanh toán
          </p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Xuất Báo Cáo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold">
                  {totalRevenue.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Giao dịch thành công
                </p>
                <p className="text-2xl font-bold">
                  {transactions.filter((t) => t.status === "success").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang xử lý</p>
                <p className="text-2xl font-bold">
                  {transactions.filter((t) => t.status === "pending").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Thất bại/Hoàn</p>
                <p className="text-2xl font-bold">
                  {
                    transactions.filter(
                      (t) => t.status === "failed" || t.status === "refunded",
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Danh Sách Giao Dịch</CardTitle>
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
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="success">Thành công</SelectItem>
                  <SelectItem value="pending">Đang xử lý</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                  <SelectItem value="refunded">Đã hoàn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã Đặt Vé</TableHead>
                <TableHead>Khách Hàng</TableHead>
                <TableHead>Phim</TableHead>
                <TableHead>Rạp/Ngày/Giờ</TableHead>
                <TableHead>Số Ghế</TableHead>
                <TableHead>Số Tiền</TableHead>
                <TableHead>Thanh Toán</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Thời Gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Đang tải dữ liệu giao dịch...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && error && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !error && filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Không có giao dịch phù hợp
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                !error &&
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono font-medium">
                      {transaction.bookingCode}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transaction.customerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.customerEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.movieTitle}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{transaction.cinemaName}</div>
                        <div className="text-muted-foreground">
                          {transaction.showDate
                            ? `${formatDate(transaction.showDate)} - ${transaction.showTime}`
                            : "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {transaction.seatCount}
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      {transaction.amount.toLocaleString("vi-VN")}đ
                    </TableCell>
                    <TableCell>{transaction.paymentMethod}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.transactionDate
                        ? formatDateTime(transaction.transactionDate)
                        : "-"}
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

export default AdminTransactions;
