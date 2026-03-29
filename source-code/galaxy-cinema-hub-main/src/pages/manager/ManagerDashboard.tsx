import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Ticket, Clock, Users, TrendingUp, TrendingDown,
  Film, RefreshCw, ArrowRight, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DashboardStats {
  cinema_id: number;
  cinema_name: string;
  today_revenue: number;
  today_tickets: number;
  today_shows: number;
  occupancy_rate: number;
  changes: { revenue: number };
}

interface RevenueItem { date: string; day: string; revenue: number; }
interface UpcomingShow {
  id: number; movie_title: string; hall_name: string;
  start_time: string; total_seats: number; sold_seats: number;
}

// SVG Line Chart component
const LineChart: React.FC<{ data: RevenueItem[]; height?: number }> = ({ data, height = 180 }) => {
  if (!data.length) return null;
  const W = 600; const H = height;
  const PAD = { top: 20, right: 20, bottom: 32, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const minVal = 0;
  const pts = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * innerW,
    y: PAD.top + innerH - ((d.revenue - minVal) / (maxVal - minVal)) * innerH,
    revenue: d.revenue, day: d.day, date: d.date,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = [
    `M ${pts[0].x} ${PAD.top + innerH}`,
    ...pts.map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length - 1].x} ${PAD.top + innerH}`,
    'Z'
  ].join(' ');

  // Y-axis ticks
  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = (maxVal / yTicks) * i;
    return { val, y: PAD.top + innerH - (i / yTicks) * innerH };
  });

  const fmt = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="mgr-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="mgr-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" />
        </filter>
      </defs>

      {/* Grid lines */}
      {yLabels.map(({ y }, i) => (
        <line key={i} x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y}
          stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
      ))}

      {/* Y labels */}
      {yLabels.map(({ val, y }, i) => (
        <text key={i} x={PAD.left - 8} y={y + 4} textAnchor="end"
          fill="rgba(0,0,0,0.35)" fontSize="10" fontFamily="sans-serif">
          {fmt(val)}
        </text>
      ))}

      {/* X labels */}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle"
          fill={i === pts.length - 1 ? "#f97316" : "rgba(0,0,0,0.4)"}
          fontSize="10" fontFamily="sans-serif" fontWeight={i === pts.length - 1 ? "700" : "400"}>
          {p.day}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaD} fill="url(#mgr-area-grad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke="url(#mgr-line-grad)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="url(#mgr-line-grad)" strokeWidth="2" />
          {i === pts.length - 1 && (
            <circle cx={p.x} cy={p.y} r="4" fill="#f97316" filter="url(#glow)" />
          )}
        </g>
      ))}
    </svg>
  );
};

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueItem[]>([]);
  const [upcomingShows, setUpcomingShows] = useState<UpcomingShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sRes, rRes, uRes] = await Promise.all([
        apiCall<{ success: boolean; data: DashboardStats }>(API_ENDPOINTS.MANAGER_DASHBOARD_STATS),
        apiCall<{ success: boolean; data: { items: RevenueItem[] } }>(API_ENDPOINTS.MANAGER_DASHBOARD_REVENUE),
        apiCall<{ success: boolean; data: { upcoming_shows: UpcomingShow[] } }>(API_ENDPOINTS.MANAGER_DASHBOARD_UPCOMING),
      ]);
      if (sRes.success) setStats(sRes.data);
      if (rRes.success) setRevenueData(rRes.data.items ?? []);
      if (uRes.success) setUpcomingShows(uRes.data.upcoming_shows ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const kpiCards = stats ? [
    {
      label: "Doanh Thu Hôm Nay",
      value: formatCurrency(stats.today_revenue),
      sub: `${stats.changes.revenue >= 0 ? "+" : ""}${stats.changes.revenue}% so với hôm qua`,
      trend: stats.changes.revenue >= 0,
      icon: DollarSign,
      gradient: "from-orange-500 to-amber-500",
      glow: "shadow-orange-500/20",
      bg: "from-orange-500/10 to-amber-500/5",
      border: "border-orange-500/20",
    },
    {
      label: "Vé Đã Bán",
      value: `${stats.today_tickets} vé`,
      sub: "Hôm nay",
      trend: null,
      icon: Ticket,
      gradient: "from-blue-500 to-indigo-500",
      glow: "shadow-blue-500/20",
      bg: "from-blue-500/10 to-indigo-500/5",
      border: "border-blue-500/20",
    },
    {
      label: "Tỷ Lệ Lấp Đầy",
      value: `${stats.occupancy_rate}%`,
      sub: stats.occupancy_rate >= 70 ? "Xuất sắc 🎉" : stats.occupancy_rate >= 40 ? "Tốt 👍" : "Cần cải thiện",
      trend: null,
      icon: Users,
      gradient: "from-purple-500 to-violet-500",
      glow: "shadow-purple-500/20",
      bg: "from-purple-500/10 to-violet-500/5",
      border: "border-purple-500/20",
    },
    {
      label: "Suất Chiếu Hôm Nay",
      value: `${stats.today_shows} suất`,
      sub: new Date().toLocaleDateString("vi-VN"),
      trend: null,
      icon: Clock,
      gradient: "from-emerald-500 to-teal-500",
      glow: "shadow-emerald-500/20",
      bg: "from-emerald-500/10 to-teal-500/5",
      border: "border-emerald-500/20",
    },
  ] : [];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Skeleton KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse border border-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-2xl bg-gray-100 animate-pulse border border-gray-200" />
          <div className="h-72 rounded-2xl bg-gray-100 animate-pulse border border-gray-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-500 flex items-center justify-between">
          <span className="text-sm">⚠️ {error}</span>
          <button onClick={() => void fetchAll()} className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg transition-colors">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
            Dashboard Quản Lý
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {stats?.cinema_name
              ? `🎬 ${stats.cinema_name} · Hôm nay ${new Date().toLocaleDateString("vi-VN")}`
              : "Tổng quan hoạt động rạp"}
          </p>
        </div>
        <button
          onClick={() => void fetchAll()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 text-sm transition-all border border-gray-200 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
              "bg-white hover:scale-[1.02] hover:shadow-lg",
              card.border, card.glow
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", card.gradient)}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              {card.trend !== null && (
                <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  card.trend ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                )}>
                  {card.trend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">{card.label}</p>
            <p className="text-xl lg:text-2xl font-bold text-gray-800 leading-tight">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Line Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Doanh Thu 7 Ngày Gần Nhất</h2>
              <p className="text-xs text-gray-400 mt-0.5">Đơn vị: VNĐ</p>
            </div>
            {revenueData.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Hôm nay</p>
                <p className="text-sm font-bold text-orange-500">
                  {formatCurrency(revenueData[revenueData.length - 1]?.revenue ?? 0)}
                </p>
              </div>
            )}
          </div>
          {revenueData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-gray-300 text-sm">Chưa có dữ liệu doanh thu</div>
          ) : (
            <LineChart data={revenueData} height={180} />
          )}
        </div>

        {/* Upcoming Shows */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Suất Chiếu Sắp Tới</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date().toLocaleDateString("vi-VN")}
              </p>
            </div>
            <button
              onClick={() => navigate("/manager/showtimes")}
              className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
            >
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-56 pr-1">
            {upcomingShows.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 text-sm py-8 gap-2">
                <Film className="w-8 h-8 opacity-30" />
                <p>Không có suất chiếu sắp tới</p>
              </div>
            ) : (
              upcomingShows.map((show) => {
                const occ = show.total_seats > 0 ? Math.round((show.sold_seats / show.total_seats) * 100) : 0;
                const occColor = occ >= 70 ? "bg-emerald-500" : occ >= 40 ? "bg-amber-400" : "bg-red-400";
                const occText = occ >= 70 ? "text-emerald-600" : occ >= 40 ? "text-amber-600" : "text-red-500";
                return (
                  <div key={show.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="shrink-0 text-center w-12">
                      <div className="text-sm font-bold text-orange-500">
                        {new Date(show.start_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-xs text-gray-400">{show.hall_name}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{show.movie_title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", occColor)} style={{ width: `${occ}%` }} />
                        </div>
                        <span className={cn("text-xs font-bold shrink-0", occText)}>{occ}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 text-sm mb-4">Truy Cập Nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Thêm Suất Chiếu",   icon: Film,     path: "/manager/showtimes", color: "from-orange-500 to-amber-500" },
            { label: "Quản Lý Nhân Viên", icon: Users,    path: "/manager/staff",     color: "from-blue-500 to-indigo-500" },
            { label: "Xem Báo Cáo",       icon: BarChart3, path: "/manager/reports",  color: "from-purple-500 to-violet-500" },
            { label: "Lịch Chiếu",        icon: Clock,    path: "/manager/showtimes", color: "from-emerald-500 to-teal-500" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="group p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-white transition-all duration-200 flex flex-col items-start gap-3 text-left hover:shadow-md hover:scale-[1.02]"
            >
              <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", action.color)}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{action.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fix: BarChart3 import alias
const BarChart3 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

export default ManagerDashboard;
