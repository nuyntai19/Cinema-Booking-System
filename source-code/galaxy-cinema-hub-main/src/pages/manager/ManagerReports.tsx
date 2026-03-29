import React, { useState, useEffect, useCallback } from "react";
import {
  Download, RefreshCw, TrendingUp, Users2, BarChart2,
  Calendar, DollarSign, Percent
} from "lucide-react";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RevenueRow { date: string; day: string; revenue: number; tickets: number; }
interface OccupancyRow {
  hall_id: number; hall_name: string; total_capacity: number;
  shows: number; sold: number; occupancy_rate: number;
}

// SVG Bar Chart for hall comparison
const BarChart: React.FC<{ data: OccupancyRow[] }> = ({ data }) => {
  if (!data.length) return null;
  const W = 500; const H = 200;
  const PAD = { top: 16, right: 16, bottom: 40, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = 100; // occupancy %
  const barW = Math.min(60, (innerW / data.length) * 0.6);
  const gap = innerW / data.length;

  const occColor = (v: number) => v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(tick => {
        const y = PAD.top + innerH - (tick / max) * innerH;
        return (
          <g key={tick}>
            <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="sans-serif">{tick}%</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((row, i) => {
        const x = PAD.left + gap * i + (gap - barW) / 2;
        const barH = (row.occupancy_rate / max) * innerH;
        const y = PAD.top + innerH - barH;
        const color = occColor(row.occupancy_rate);
        return (
          <g key={row.hall_id}>
            {/* Bar background */}
            <rect x={x} y={PAD.top} width={barW} height={innerH} fill="rgba(255,255,255,0.03)" rx="4" />
            {/* Bar fill */}
            <rect x={x} y={y} width={barW} height={barH} fill={color} rx="4" opacity="0.85" />
            <rect x={x} y={y} width={barW} height={Math.min(barH, 8)} fill={color} rx="4" opacity="1" />
            {/* Value label */}
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill={color} fontSize="11" fontFamily="sans-serif" fontWeight="700">
              {row.occupancy_rate}%
            </text>
            {/* Hall name */}
            <text x={x + barW / 2} y={H - PAD.bottom + 16} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="sans-serif">
              {row.hall_name.length > 10 ? row.hall_name.slice(0, 10) + "…" : row.hall_name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// SVG Line chart for revenue (reusable)
const RevenueLineChart: React.FC<{ data: RevenueRow[]; height?: number }> = ({ data, height = 200 }) => {
  if (!data.length) return null;
  const W = 600; const H = height;
  const PAD = { top: 20, right: 20, bottom: 32, left: 64 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  const pts = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * innerW,
    y: PAD.top + innerH - (d.revenue / maxRev) * innerH,
    ...d,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = [`M ${pts[0].x} ${PAD.top + innerH}`, ...pts.map(p => `L ${p.x} ${p.y}`), `L ${pts[pts.length - 1].x} ${PAD.top + innerH}`, "Z"].join(" ");
  const fmt = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ val: maxRev * f, y: PAD.top + innerH - f * innerH }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="rv-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="rv-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      {ticks.map(({ y }, i) => <line key={i} x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
      {ticks.map(({ val, y }, i) => (
        <text key={i} x={PAD.left - 8} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="sans-serif">{fmt(val)}</text>
      ))}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fill={i === pts.length - 1 ? "#f97316" : "rgba(255,255,255,0.35)"} fontSize="9" fontFamily="sans-serif">{p.day}</text>
      ))}
      <path d={areaD} fill="url(#rv-area)" />
      <path d={pathD} fill="none" stroke="url(#rv-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5} fill="#0f0f18" stroke="url(#rv-line)" strokeWidth="2" />
      ))}
    </svg>
  );
};

const PERIODS = [
  { label: "7 ngày", value: 7 },
  { label: "14 ngày", value: 14 },
  { label: "30 ngày", value: 30 },
];

const ManagerReports: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState(7);
  const [revenueData, setRevenueData] = useState<RevenueRow[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const totalRevenue = revenueData.reduce((s, r) => s + r.revenue, 0);
  const totalTickets = revenueData.reduce((s, r) => s + r.tickets, 0);
  const avgOccupancy = occupancyData.length
    ? Math.round(occupancyData.reduce((s, r) => s + r.occupancy_rate, 0) / occupancyData.length)
    : 0;
  const totalShows = occupancyData.reduce((s, r) => s + r.shows, 0);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [rvRes, ocRes] = await Promise.all([
        apiCall<{ success: boolean; data: { items: RevenueRow[] } }>(
          `${API_ENDPOINTS.MANAGER_REPORT_REVENUE}?period=${period}`
        ),
        apiCall<{ success: boolean; data: { halls: OccupancyRow[] } }>(
          `${API_ENDPOINTS.MANAGER_REPORT_OCCUPANCY}?period=${period}`
        ),
      ]);
      if (rvRes.success) setRevenueData(rvRes.data.items ?? []);
      if (ocRes.success) setOccupancyData(ocRes.data.halls ?? []);
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Không thể tải báo cáo", variant: "destructive" });
    } finally { setLoading(false); }
  }, [period, toast]);

  useEffect(() => { void fetchReports(); }, [fetchReports]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.MANAGER_REPORT_EXPORT}?period=${period}&type=revenue`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Xuất báo cáo thất bại");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${period}days_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "✅ Xuất thành công", description: "File CSV đã được tải về" });
    } catch (e: unknown) {
      toast({ title: "❌ Lỗi", description: e instanceof Error ? e.message : "Xuất thất bại", variant: "destructive" });
    } finally { setExporting(false); }
  };

  const summaryCards = [
    {
      label: `Tổng Doanh Thu (${period}N)`, value: fmtCurrency(totalRevenue),
      icon: DollarSign, color: "from-orange-500 to-amber-500", bg: "from-orange-500/10 to-amber-500/5", border: "border-orange-500/20",
    },
    {
      label: `Tổng Vé Bán (${period}N)`, value: `${totalTickets.toLocaleString()} vé`,
      icon: Users2, color: "from-blue-500 to-indigo-500", bg: "from-blue-500/10 to-indigo-500/5", border: "border-blue-500/20",
    },
    {
      label: "Tỷ Lệ Lấp Đầy TB", value: `${avgOccupancy}%`,
      icon: Percent, color: "from-purple-500 to-violet-500", bg: "from-purple-500/10 to-violet-500/5", border: "border-purple-500/20",
    },
    {
      label: `Tổng Suất Chiếu (${period}N)`, value: `${totalShows.toLocaleString()} suất`,
      icon: BarChart2, color: "from-emerald-500 to-teal-500", bg: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Báo Cáo & Thống Kê</h1>
          <p className="text-sm text-white/40 mt-0.5">Phân tích doanh thu và hiệu suất rạp</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchReports()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/8"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => void handleExport()}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
          >
            {exporting
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />
            }
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-white/40" />
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                period === p.value ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-white/50 hover:text-white"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)
          : summaryCards.map(card => (
            <div key={card.label} className={cn("p-5 rounded-2xl border bg-gradient-to-br hover:scale-[1.02] transition-all", card.bg, card.border)}>
              <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg mb-3", card.color)}>
                <card.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-xs text-white/50 uppercase tracking-wide mb-1">{card.label}</p>
              <p className="text-xl font-bold text-white">{card.value}</p>
            </div>
          ))
        }
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              Xu Hướng Doanh Thu
            </h2>
            <p className="text-xs text-white/40 mt-0.5">{period} ngày gần nhất</p>
          </div>
          {!loading && revenueData.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-white/40">Trung bình / ngày</p>
              <p className="text-sm font-bold text-orange-400">{fmtCurrency(Math.round(totalRevenue / period))}</p>
            </div>
          )}
        </div>
        {loading ? (
          <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
        ) : revenueData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-white/30 text-sm">Chưa có dữ liệu doanh thu</div>
        ) : (
          <RevenueLineChart data={revenueData} height={200} />
        )}
      </div>

      {/* Two panels: Hall comparison + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Occupancy bar chart */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            Tỷ Lệ Lấp Đầy Theo Phòng
          </h2>
          <p className="text-xs text-white/40 mb-4">{period} ngày gần nhất</p>
          {loading ? (
            <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
          ) : occupancyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">Chưa có dữ liệu</div>
          ) : (
            <BarChart data={occupancyData} />
          )}
        </div>

        {/* Revenue table */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-400" />
            Chi Tiết Theo Ngày
          </h2>
          <p className="text-xs text-white/40 mb-4">{period} ngày gần nhất</p>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-9 rounded-lg bg-white/5 animate-pulse" />)}</div>
          ) : revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">Chưa có dữ liệu</div>
          ) : (
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {[...revenueData].reverse().map((row, i) => {
                const ratio = totalRevenue > 0 ? row.revenue / totalRevenue : 0;
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/4 transition-colors">
                    <div className="w-16 text-xs text-white/40 shrink-0">{row.day}</div>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: `${ratio * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium text-white">{fmtCurrency(row.revenue)}</div>
                      <div className="text-xs text-white/30">{row.tickets} vé</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hall details table */}
      {!loading && occupancyData.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          <div className="p-4 border-b border-white/8">
            <h2 className="text-sm font-semibold text-white">Chi Tiết Theo Phòng Chiếu</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-white/40 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Phòng</th>
                <th className="text-center px-4 py-3 hidden sm:table-cell">Suất chiếu</th>
                <th className="text-center px-4 py-3 hidden md:table-cell">Sức chứa</th>
                <th className="text-center px-4 py-3">Đã bán</th>
                <th className="text-right px-4 py-3">Lấp đầy</th>
              </tr>
            </thead>
            <tbody>
              {occupancyData.map((row, i) => {
                const occ = row.occupancy_rate;
                const color = occ >= 70 ? "text-emerald-400" : occ >= 40 ? "text-amber-400" : "text-red-400";
                const barColor = occ >= 70 ? "bg-emerald-500" : occ >= 40 ? "bg-amber-500" : "bg-red-500";
                return (
                  <tr key={row.hall_id} className={cn("border-t border-white/5 hover:bg-white/3 transition-colors", i % 2 === 0 && "bg-white/1")}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-white text-sm">{row.hall_name}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-white/50 hidden sm:table-cell">{row.shows}</td>
                    <td className="px-4 py-3 text-center text-white/50 hidden md:table-cell">{row.total_capacity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-white/70">{row.sold.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                          <div className={cn("h-full rounded-full", barColor)} style={{ width: `${occ}%` }} />
                        </div>
                        <span className={cn("font-bold text-sm", color)}>{occ}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagerReports;
