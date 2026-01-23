import React, { useState } from "react";
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

const AdminTransactions: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");

  const transactions: Transaction[] = [
    {
      id: "1",
      bookingCode: "GC2026012301",
      customerName: "Nguyễn Văn A",
      customerEmail: "client@gmail.com",
      movieTitle: "MAI",
      cinemaName: "Galaxy Nguyễn Du",
      showDate: "2026-01-25",
      showTime: "19:00",
      seatCount: 2,
      amount: 240000,
      paymentMethod: "Momo",
      status: "success",
      transactionDate: "2026-01-23T10:30:00",
    },
    {
      id: "2",
      bookingCode: "GC2026012302",
      customerName: "Trần Thị B",
      customerEmail: "tran.b@gmail.com",
      movieTitle: "Kung Fu Panda 4",
      cinemaName: "Galaxy Tân Bình",
      showDate: "2026-01-24",
      showTime: "14:00",
      seatCount: 3,
      amount: 270000,
      paymentMethod: "Thẻ tín dụng",
      status: "success",
      transactionDate: "2026-01-22T15:20:00",
    },
    {
      id: "3",
      bookingCode: "GC2026012303",
      customerName: "Lê Văn C",
      customerEmail: "le.c@gmail.com",
      movieTitle: "Dune: Part Two",
      cinemaName: "Galaxy Quang Trung",
      showDate: "2026-01-26",
      showTime: "20:30",
      seatCount: 2,
      amount: 300000,
      paymentMethod: "Momo",
      status: "pending",
      transactionDate: "2026-01-23T09:15:00",
    },
    {
      id: "4",
      bookingCode: "GC2026012304",
      customerName: "Phạm Thị D",
      customerEmail: "pham.d@gmail.com",
      movieTitle: "Đào, Phở và Piano",
      cinemaName: "Galaxy Nguyễn Du",
      showDate: "2026-01-23",
      showTime: "16:30",
      seatCount: 4,
      amount: 360000,
      paymentMethod: "Thẻ tín dụng",
      status: "failed",
      transactionDate: "2026-01-22T11:45:00",
    },
    {
      id: "5",
      bookingCode: "GC2026012305",
      customerName: "Hoàng Văn E",
      customerEmail: "hoang.e@gmail.com",
      movieTitle: "MAI",
      cinemaName: "Galaxy Tân Bình",
      showDate: "2026-01-20",
      showTime: "19:00",
      seatCount: 2,
      amount: 240000,
      paymentMethod: "Momo",
      status: "refunded",
      transactionDate: "2026-01-18T14:30:00",
    },
  ];

  const filteredTransactions = transactions.filter((transaction) => {
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
  });

  const totalRevenue = transactions
    .filter((t) => t.status === "success")
    .reduce((sum, t) => sum + t.amount, 0);

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
              {filteredTransactions.map((transaction) => (
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
                        {formatDate(transaction.showDate)} -{" "}
                        {transaction.showTime}
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
                    {formatDateTime(transaction.transactionDate)}
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
