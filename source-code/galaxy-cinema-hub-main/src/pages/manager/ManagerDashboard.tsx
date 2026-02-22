import React from "react";
import {
  TrendingUp,
  Ticket,
  Users,
  DollarSign,
  Film,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ManagerDashboard: React.FC = () => {
  const stats = [
    {
      title: "Doanh Thu Hôm Nay",
      value: "8.450.000đ",
      change: "+10%",
      trend: "up",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Vé Đã Bán",
      value: "186",
      change: "+12%",
      trend: "up",
      icon: Ticket,
      color: "bg-blue-500",
    },
    {
      title: "Tỷ Lệ Lấp Đầy",
      value: "72%",
      change: "+5%",
      trend: "up",
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Suất Chiếu Hôm Nay",
      value: "24",
      change: "8 đang chiếu",
      trend: "up",
      icon: Clock,
      color: "bg-orange-500",
    },
  ];

  // Mock revenue data for last 7 days
  const revenueData = [
    { day: "T2", value: 6.5 },
    { day: "T3", value: 5.2 },
    { day: "T4", value: 7.1 },
    { day: "T5", value: 6.8 },
    { day: "T6", value: 9.2 },
    { day: "T7", value: 12.4 },
    { day: "CN", value: 8.5 },
  ];
  const maxRevenue = Math.max(...revenueData.map((d) => d.value));

  const upcomingShows = [
    { time: "14:00", movie: "Mai", hall: "Phòng 1", seats: "45/120" },
    { time: "15:30", movie: "Kung Fu Panda 4", hall: "Phòng 2", seats: "38/100" },
    { time: "17:00", movie: "Dune: Part Two", hall: "IMAX", seats: "67/150" },
    { time: "19:30", movie: "Mai", hall: "Phòng 1", seats: "92/120" },
    { time: "21:00", movie: "Đào, Phở và Piano", hall: "Phòng 2", seats: "51/100" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Quản Lý</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động rạp của bạn</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", stat.color)}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs mt-1">
                {stat.trend === "up" ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : null}
                <span
                  className={cn(
                    stat.trend === "up" ? "text-green-500" : "text-muted-foreground",
                  )}
                >
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh Thu Tuần (triệu đồng)</CardTitle>
            <CardDescription>7 ngày gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {revenueData.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="text-xs font-semibold text-muted-foreground">
                    {item.value}M
                  </div>
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${(item.value / maxRevenue) * 180}px`,
                    }}
                  />
                  <div className="text-sm font-medium text-muted-foreground">
                    {item.day}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Shows */}
        <Card>
          <CardHeader>
            <CardTitle>Suất Chiếu Sắp Tới</CardTitle>
            <CardDescription>Hôm nay - {new Date().toLocaleDateString('vi-VN')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingShows.map((show, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-primary">
                      {show.time}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{show.movie}</div>
                      <div className="text-xs text-muted-foreground">
                        {show.hall}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{show.seats}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hành Động Nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <Film className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Thêm Suất Chiếu</div>
            </button>
            <button className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Quản Lý Nhân Viên</div>
            </button>
            <button className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <Ticket className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Xem Báo Cáo</div>
            </button>
            <button className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Khuyến Mãi</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;
