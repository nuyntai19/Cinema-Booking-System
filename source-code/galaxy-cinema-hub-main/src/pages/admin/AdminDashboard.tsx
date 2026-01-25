import React from "react";
import {
  TrendingUp,
  Ticket,
  Users,
  DollarSign,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Film,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { movies, mockTransactions } from "@/data/mockData";
import { cn } from "@/lib/utils";
import SeatHeatmap from "@/components/admin/SeatHeatmap";

const AdminDashboard: React.FC = () => {
  const vnMovies = movies.filter((m) => m.origin === "VN");
  const vnRatio = (vnMovies.length / movies.length) * 100;
  const isVNRatioLow = vnRatio < 15;

  const stats = [
    {
      title: "Doanh Thu Hôm Nay",
      value: "12.450.000đ",
      change: "+12%",
      trend: "up",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Vé Đã Bán",
      value: "342",
      change: "+8%",
      trend: "up",
      icon: Ticket,
      color: "bg-blue-500",
    },
    {
      title: "Tỷ Lệ Lấp Đầy",
      value: "68%",
      change: "-3%",
      trend: "down",
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Phim Việt Nam",
      value: `${vnRatio.toFixed(0)}%`,
      change: vnRatio >= 15 ? "Đạt chuẩn" : "Chưa đạt",
      trend: vnRatio >= 15 ? "up" : "down",
      icon: Film,
      color: vnRatio >= 15 ? "bg-green-500" : "bg-red-500",
      alert: isVNRatioLow,
    },
  ];

  // Mock revenue data for last 7 days
  const revenueData = [
    { day: "T2", value: 8.5 },
    { day: "T3", value: 6.2 },
    { day: "T4", value: 9.1 },
    { day: "T5", value: 7.8 },
    { day: "T6", value: 11.2 },
    { day: "T7", value: 15.4 },
    { day: "CN", value: 12.5 },
  ];
  const maxRevenue = Math.max(...revenueData.map((d) => d.value));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động kinh doanh</p>
      </div>

      {/* VN Movie Alert */}
      {isVNRatioLow && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl animate-pulse">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">
              Cảnh báo: Tỷ lệ phim Việt Nam thấp!
            </p>
            <p className="text-sm text-muted-foreground">
              Tỷ lệ hiện tại: {vnRatio.toFixed(1)}%. Yêu cầu tối thiểu: 15% theo
              quy định.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={cn(
              "relative overflow-hidden",
              stat.alert && "border-destructive",
            )}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm mt-1",
                      stat.trend === "up" ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {stat.trend === "up" ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    stat.color,
                  )}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh Thu 7 Ngày Qua</CardTitle>
            <CardDescription>Triệu VND</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-48">
              {revenueData.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-primary/20 hover:bg-primary/30 rounded-t-lg transition-colors relative group"
                    style={{ height: `${(item.value / maxRevenue) * 100}%` }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all"
                      style={{ height: "100%" }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.value}M
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* VN Movie Ratio Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Tỷ Lệ Phim Việt</CardTitle>
            <CardDescription>Theo quy định ≥15%</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-40 h-40 mx-auto">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${vnRatio * 2.51} 251`}
                  className={
                    isVNRatioLow ? "text-destructive" : "text-green-500"
                  }
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "text-3xl font-bold",
                    isVNRatioLow ? "text-destructive" : "text-green-600",
                  )}
                >
                  {vnRatio.toFixed(0)}%
                </span>
                <span className="text-xs text-muted-foreground">Phim Việt</span>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Phim Việt ({vnMovies.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <span className="text-sm">
                  Quốc tế ({movies.length - vnMovies.length})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seat Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Bản Đồ Nhiệt Ghế Ngồi</CardTitle>
          <CardDescription>
            Thống kê mức độ phổ biến của từng ghế trong 7 ngày qua
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeatHeatmap />
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Giao Dịch Gần Đây</CardTitle>
          <CardDescription>10 giao dịch mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Mã GD
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Khách hàng
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Thanh toán
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Số tiền
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <td className="py-3 px-4 font-mono text-sm">{tx.id}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{tx.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.customerPhone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="uppercase">
                        {tx.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {tx.amount.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={cn(
                          tx.status === "success" &&
                            "bg-green-100 text-green-700 hover:bg-green-100",
                          tx.status === "pending" &&
                            "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
                          tx.status === "failed" &&
                            "bg-red-100 text-red-700 hover:bg-red-100",
                        )}
                      >
                        {tx.status === "success"
                          ? "Thành công"
                          : tx.status === "pending"
                            ? "Đang xử lý"
                            : "Thất bại"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
