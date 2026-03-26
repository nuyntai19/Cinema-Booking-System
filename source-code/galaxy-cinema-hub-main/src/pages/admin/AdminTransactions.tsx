import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  FileSpreadsheet,
  FileText,
  BarChart,
  LineChart as LineChartIcon,
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
import * as XLSX from "xlsx";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

let pdfFontsInitialized = false;
const ensurePdfMakeReady = () => {
  if (pdfFontsInitialized) return;

  const fontsData = pdfFonts as {
    vfs?: Record<string, string>;
    pdfMake?: { vfs?: Record<string, string> };
  };
  const vfs = fontsData.vfs ?? fontsData.pdfMake?.vfs;
  if (vfs) {
    if (typeof pdfMake.addVirtualFileSystem === "function") {
      pdfMake.addVirtualFileSystem(vfs);
    } else {
      (pdfMake as typeof pdfMake & { vfs?: Record<string, string> }).vfs = vfs;
    }
  } else {
    console.warn("Không tìm thấy font vfs cho pdfMake, PDF có thể bị lỗi hiển thị tiếng Việt.");
  }

  pdfMake.setFonts({
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  });
  pdfFontsInitialized = true;
};

interface TransactionItem {
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

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

interface SummaryData {
  totalRevenue: number;
  successCount: number;
  pendingCount: number;
  failedOrRefundedCount: number;
}

interface AdminTransactionsData {
  items: TransactionItem[];
  pagination: PaginationData;
  summary: SummaryData;
}

const AdminTransactions: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasMore: false,
  });
  const [summary, setSummary] = useState<SummaryData>({
    totalRevenue: 0,
    successCount: 0,
    pendingCount: 0,
    failedOrRefundedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [exportingType, setExportingType] = useState<"excel" | "pdf" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Stats view state
  const [showStats, setShowStats] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartType, setChartType] = useState<"day" | "month" | "year">("day");
  const [movieData, setMovieData] = useState<
    Array<{ title: string; tickets: number; revenue: number }>
  >([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [moviePage, setMoviePage] = useState(1);
  const [movieSearch, setMovieSearch] = useState("");
  const [movieSort, setMovieSort] = useState<
    "revenue-desc" | "revenue-asc" | "tickets-desc" | "tickets-asc"
  >("revenue-desc");
  const moviesPerPage = 10;
  const [paymentShare, setPaymentShare] = useState({
    cash: 0,
    transfer: 0,
    total: 0,
  });
  const [dayRevenueData, setDayRevenueData] = useState<
    Array<{ day: number; revenue: number }>
  >([]);
  const [monthRevenueData, setMonthRevenueData] = useState<
    Array<{ month: number; revenue: number }>
  >([]);
  const [yearRevenueData, setYearRevenueData] = useState<
    Array<{ year: number; revenue: number }>
  >([]);

  const pieChartData = useMemo(
    () => [
      { name: "Tiền mặt", value: paymentShare.cash },
      { name: "Chuyển khoản", value: paymentShare.transfer },
    ],
    [paymentShare.cash, paymentShare.transfer],
  );

  const formatPiePercent = (value: number) => {
    const total = paymentShare.total || 0;
    if (!total) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const buildQueryParams = useCallback(
    (nextPage = page, nextLimit = limit) => {
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", String(nextLimit));

      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }

      if (filterStatus !== "all") {
        params.set("status", filterStatus);
      }

      if (paymentMethod !== "all") {
        params.set("payment_method", paymentMethod);
      }

      if (dateFrom) {
        params.set("date_from", dateFrom);
      }

      if (dateTo) {
        params.set("date_to", dateTo);
      }

      return params;
    },
    [searchQuery, filterStatus, paymentMethod, dateFrom, dateTo, page, limit],
  );

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = buildQueryParams(page, limit);

        const res = await apiCall<ApiResponse<AdminTransactionsData>>(
          `${API_ENDPOINTS.ADMIN_TRANSACTIONS}?${params.toString()}`,
        );

        setTransactions(res.data.items || []);
        setPagination(
          res.data.pagination || {
            total: 0,
            page,
            limit,
            totalPages: 1,
            hasMore: false,
          },
        );
        setSummary(
          res.data.summary || {
            totalRevenue: 0,
            successCount: 0,
            pendingCount: 0,
            failedOrRefundedCount: 0,
          },
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Không thể tải dữ liệu giao dịch";
        setError(message);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTransactions();
  }, [page, limit, buildQueryParams]);

  const totalRevenue = useMemo(
    () => summary.totalRevenue || 0,
    [summary.totalRevenue],
  );

  const pageNumbers = useMemo(() => {
    const totalPages = pagination.totalPages || 1;
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    const numbers: number[] = [];
    for (let i = start; i <= end; i += 1) {
      numbers.push(i);
    }
    return numbers;
  }, [pagination.totalPages, page]);

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

  const formatVND = (value: number): string =>
    `${Math.round(Number(value) || 0).toLocaleString("vi-VN")}đ`;

  const getStatusLabel = (status: TransactionItem["status"]): string => {
    const labels: Record<TransactionItem["status"], string> = {
      success: "Thành công",
      pending: "Đang xử lý",
      failed: "Thất bại",
      refunded: "Đã hoàn tiền",
    };
    return labels[status] || status;
  };

  const isCashMethod = (method?: string) => {
    const normalized = String(method || "")
      .toLowerCase()
      .trim();
    return normalized.includes("cash") || normalized.includes("tiền mặt");
  };

  const fetchTransactionsForExport = async (): Promise<TransactionItem[]> => {
    const params = buildQueryParams(1, 5000);
    const res = await apiCall<ApiResponse<AdminTransactionsData>>(
      `${API_ENDPOINTS.ADMIN_TRANSACTIONS}?${params.toString()}`,
    );
    return res.data?.items || [];
  };

  const fetchRevenueData = useCallback(async () => {
    setStatsLoading(true);
    try {
      const rows = await fetchTransactionsForExport();

      // Filter by selected month/year for day chart
      const filteredRows = rows.filter((row) => {
        if (!row.transactionDate) return false;
        const date = new Date(row.transactionDate);
        return (
          date.getMonth() + 1 === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      });

      // Filter by selected year for month chart
      const yearRows = rows.filter((row) => {
        if (!row.transactionDate) return false;
        return new Date(row.transactionDate).getFullYear() === selectedYear;
      });

      // Group by movie
      const movieMap = new Map<string, { tickets: number; revenue: number }>();
      filteredRows.forEach((row) => {
        const key = row.movieTitle || "(Không rõ phim)";
        const current = movieMap.get(key) || { tickets: 0, revenue: 0 };
        current.tickets += Number(row.seatCount || 0);
        current.revenue += Number(row.amount || 0);
        movieMap.set(key, current);
      });

      const movies = Array.from(movieMap.entries())
        .map(([title, stats]) => ({ title, ...stats }))
        .sort((a, b) => {
          switch (movieSort) {
            case "revenue-desc":
              return b.revenue - a.revenue;
            case "revenue-asc":
              return a.revenue - b.revenue;
            case "tickets-desc":
              return b.tickets - a.tickets;
            case "tickets-asc":
              return a.tickets - b.tickets;
            default:
              return 0;
          }
        });

      setMovieData(movies);
      setMoviePage(1);

      // Payment share for pie chart
      const total = filteredRows.length;
      const cash = filteredRows.filter((row) => isCashMethod(row.paymentMethod)).length;
      const transfer = Math.max(total - cash, 0);
      setPaymentShare({ cash, transfer, total });

      // Day revenue chart data (stop at last available day in month)
      const revenueByDay = new Map<number, number>();
      filteredRows.forEach((item) => {
        if (!item.transactionDate) return;
        const date = new Date(item.transactionDate);
        const day = date.getDate();
        revenueByDay.set(day, (revenueByDay.get(day) || 0) + Number(item.amount || 0));
      });
      const daysWithData = Array.from(revenueByDay.keys()).sort((a, b) => a - b);
      const today = new Date();
      const isCurrentMonth =
        today.getFullYear() === selectedYear && today.getMonth() + 1 === selectedMonth;
      const fallbackDay = isCurrentMonth ? today.getDate() : 0;
      const maxDay = daysWithData.length > 0
        ? daysWithData[daysWithData.length - 1]
        : fallbackDay;
      const dayPoints: Array<{ day: number; revenue: number }> = [];
      for (let i = 1; i <= Math.max(maxDay, 0); i += 1) {
        dayPoints.push({ day: i, revenue: revenueByDay.get(i) || 0 });
      }
      setDayRevenueData(dayPoints);

      // Month revenue chart data (12 months in selected year)
      const revenueByMonth = new Map<number, number>();
      yearRows.forEach((item) => {
        if (!item.transactionDate) return;
        const month = new Date(item.transactionDate).getMonth() + 1;
        revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + Number(item.amount || 0));
      });
      const monthPoints: Array<{ month: number; revenue: number }> = [];
      for (let i = 1; i <= 12; i += 1) {
        monthPoints.push({ month: i, revenue: revenueByMonth.get(i) || 0 });
      }
      setMonthRevenueData(monthPoints);

      // Year revenue chart (last 5 years, all rows)
      const revenueByYear = new Map<number, number>();
      rows.forEach((item) => {
        if (!item.transactionDate) return;
        const year = new Date(item.transactionDate).getFullYear();
        revenueByYear.set(year, (revenueByYear.get(year) || 0) + Number(item.amount || 0));
      });
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
      const yearPoints = years.map((year) => ({
        year,
        revenue: revenueByYear.get(year) || 0,
      }));
      setYearRevenueData(yearPoints);
    } finally {
      setStatsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, chartType, movieSort]);

  useEffect(() => {
    if (showStats) {
      void fetchRevenueData();
    }
  }, [showStats, fetchRevenueData]);

  const exportTransactionsExcel = async () => {
    if (exportingType) return;

    setExportingType("excel");
    try {
      const rows = await fetchTransactionsForExport();
      const detailRows = rows.map((transaction, index) => ({
        STT: index + 1,
        "Mã đặt vé": transaction.bookingCode,
        "Khách hàng": transaction.customerName,
        Email: transaction.customerEmail,
        Phim: transaction.movieTitle,
        Rạp: transaction.cinemaName,
        "Ngày chiếu": transaction.showDate
          ? formatDate(transaction.showDate)
          : "-",
        "Giờ chiếu": transaction.showTime || "-",
        "Số ghế": transaction.seatCount,
        "Số tiền": formatVND(Number(transaction.amount || 0)),
        "Phương thức TT": transaction.paymentMethod,
        "Trạng thái": getStatusLabel(transaction.status),
        "Thời gian giao dịch": transaction.transactionDate
          ? formatDateTime(transaction.transactionDate)
          : "-",
      }));

      const workbook = XLSX.utils.book_new();
      const detailSheet = XLSX.utils.json_to_sheet(detailRows);
      detailSheet["!cols"] = [
        { wch: 6 },
        { wch: 16 },
        { wch: 22 },
        { wch: 28 },
        { wch: 32 },
        { wch: 24 },
        { wch: 14 },
        { wch: 10 },
        { wch: 10 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 24 },
      ];
      XLSX.utils.book_append_sheet(workbook, detailSheet, "GiaoDich");

      const exportDate = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `giao-dich-${exportDate}.xlsx`);
    } finally {
      setExportingType(null);
    }
  };

  const exportRevenueReportPdf = async () => {
    if (exportingType) return;

    setExportingType("pdf");
    try {
      const rows = await fetchTransactionsForExport();
      if (rows.length === 0) {
        return;
      }

      ensurePdfMakeReady();

      const monthRows = rows.filter((row) => {
        if (!row.transactionDate) return false;
        const date = new Date(row.transactionDate);
        return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
      });

      const yearRows = rows.filter((row) => {
        if (!row.transactionDate) return false;
        return new Date(row.transactionDate).getFullYear() === selectedYear;
      });

      const totalTransactions = rows.length;
      const totalRevenueAmount = rows.reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0,
      );

      const cashCount = monthRows.filter((row) => isCashMethod(row.paymentMethod)).length;
      const transferCount = Math.max(monthRows.length - cashCount, 0);

      const movieMap = new Map<string, { tickets: number; revenue: number }>();
      rows.forEach((row) => {
        const key = row.movieTitle || "(Khong ro phim)";
        const current = movieMap.get(key) || { tickets: 0, revenue: 0 };
        current.tickets += Number(row.seatCount || 0);
        current.revenue += Number(row.amount || 0);
        movieMap.set(key, current);
      });

      const topMovies = Array.from(movieMap.entries())
        .map(([movie, stats]) => ({ movie, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Build chart data
      const dayPoints = (() => {
        const revenueByDay = new Map<number, number>();
        monthRows.forEach((item) => {
          if (!item.transactionDate) return;
          const d = new Date(item.transactionDate).getDate();
          revenueByDay.set(d, (revenueByDay.get(d) || 0) + Number(item.amount || 0));
        });
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === selectedYear && today.getMonth() + 1 === selectedMonth;
        const maxDay = Math.max(
          revenueByDay.size > 0 ? Math.max(...revenueByDay.keys()) : 0,
          isCurrentMonth ? today.getDate() : 0,
        );
        const pts: Array<{ label: string; value: number }> = [];
        for (let i = 1; i <= Math.max(maxDay, 1); i += 1) {
          pts.push({ label: String(i), value: revenueByDay.get(i) || 0 });
        }
        return pts;
      })();

      const monthPoints: Array<{ label: string; value: number }> = (() => {
        const revenueByMonth = new Map<number, number>();
        yearRows.forEach((item) => {
          if (!item.transactionDate) return;
          const m = new Date(item.transactionDate).getMonth() + 1;
          revenueByMonth.set(m, (revenueByMonth.get(m) || 0) + Number(item.amount || 0));
        });
        const pts: Array<{ label: string; value: number }> = [];
        for (let i = 1; i <= 12; i += 1) {
          pts.push({ label: `T${i}`, value: revenueByMonth.get(i) || 0 });
        }
        return pts;
      })();

      const yearPoints: Array<{ label: string; value: number }> = (() => {
        const revenueByYear = new Map<number, number>();
        rows.forEach((item) => {
          if (!item.transactionDate) return;
          const y = new Date(item.transactionDate).getFullYear();
          revenueByYear.set(y, (revenueByYear.get(y) || 0) + Number(item.amount || 0));
        });
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
        return years.map((y) => ({ label: String(y), value: revenueByYear.get(y) || 0 }));
      })();

      const formatNumber = (value: number) =>
        Math.round(Number(value) || 0).toLocaleString("vi-VN");
      const toPercent = (part: number, total: number) =>
        total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0%";

      const buildMetricCard = (label: string, value: string, hint?: string, fillColor = "#eef2ff") => {
        const stack: Array<Record<string, unknown>> = [
          { text: label.toUpperCase(), style: "metricLabel" },
          { text: value, style: "metricValue" },
        ];
        if (hint) {
          stack.push({ text: hint, style: "metricHint" });
        }
        return {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  stack,
                  border: [false, false, false, false],
                  fillColor,
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 14,
            paddingRight: () => 14,
            paddingTop: () => 12,
            paddingBottom: () => 12,
          },
        };
      };

      const monthRevenue = monthRows.reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0,
      );
      const monthTickets = monthRows.reduce(
        (sum, row) => sum + Number(row.seatCount || 0),
        0,
      );
      const avgOrderValue = totalTransactions
        ? totalRevenueAmount / totalTransactions
        : 0;

      const statusCounters = {
        success: rows.filter((row) => row.status === "success").length,
        pending: rows.filter((row) => row.status === "pending").length,
        failed: rows.filter((row) => row.status === "failed").length,
        refunded: rows.filter((row) => row.status === "refunded").length,
      };

      const paymentTableBody = [
        [
          { text: "Hình thức", style: "tableHeader" },
          { text: "Số giao dịch", style: "tableHeader", alignment: "right" },
          { text: "Tỷ lệ", style: "tableHeader", alignment: "right" },
        ],
        [
          { text: "Tiền mặt", style: "tableCell" },
          { text: formatNumber(cashCount), style: "tableCell", alignment: "right" },
          { text: toPercent(cashCount, monthRows.length), style: "tableCell", alignment: "right" },
        ],
        [
          { text: "Chuyển khoản", style: "tableCell" },
          { text: formatNumber(transferCount), style: "tableCell", alignment: "right" },
          { text: toPercent(transferCount, monthRows.length), style: "tableCell", alignment: "right" },
        ],
      ];

      const statusTableBody = [
        [
          { text: "Trạng thái", style: "tableHeader" },
          { text: "Số lượng", style: "tableHeader", alignment: "right" },
          { text: "Tỷ lệ", style: "tableHeader", alignment: "right" },
        ],
        ...Object.entries(statusCounters).map(([key, value]) => [
          { text: getStatusLabel(key as TransactionItem["status"]), style: "tableCell" },
          { text: formatNumber(value), style: "tableCell", alignment: "right" },
          { text: toPercent(value, totalTransactions), style: "tableCell", alignment: "right" },
        ]),
      ];

      const movieTableBody = [
        [
          { text: "Hạng", style: "tableHeader", alignment: "center" },
          { text: "Phim", style: "tableHeader" },
          { text: "Vé bán", style: "tableHeader", alignment: "right" },
          { text: "Doanh thu", style: "tableHeader", alignment: "right" },
        ],
        ...topMovies.map((item, index) => [
          { text: `#${index + 1}`, style: "tableCell", alignment: "center" },
          { text: item.movie, style: "tableCell" },
          { text: formatNumber(item.tickets), style: "tableCell", alignment: "right" },
          { text: formatVND(item.revenue), style: "tableCell", alignment: "right" },
        ]),
      ];

      if (topMovies.length === 0) {
        movieTableBody.push([
          {
            text: "Chưa có dữ liệu về phim bán chạy trong giai đoạn này",
            colSpan: 4,
            alignment: "center",
            style: "tableCellMuted",
          },
          {},
          {},
          {},
        ]);
      }

      const bestDayPoint = dayPoints.reduce(
        (best, current) => (current.value > best.value ? current : best),
        dayPoints[0] ?? { label: "", value: 0 },
      );
      const bestMonthPoint = monthPoints.reduce(
        (best, current) => (current.value > best.value ? current : best),
        monthPoints[0],
      );
      const bestYearPoint = yearPoints.reduce(
        (best, current) => (current.value > best.value ? current : best),
        yearPoints[0],
      );
      const monthLabelText = bestMonthPoint.label.startsWith("T")
        ? `Tháng ${bestMonthPoint.label.slice(1)}`
        : bestMonthPoint.label;

      const highlightItems = [
        bestDayPoint.value > 0
          ? `Ngày ${bestDayPoint.label}/${selectedMonth} dẫn đầu với ${formatVND(bestDayPoint.value)} doanh thu.`
          : `Chưa có dữ liệu doanh thu theo ngày cho tháng ${selectedMonth}.`,
        bestMonthPoint.value > 0
          ? `${monthLabelText} là tháng có doanh thu cao nhất năm ${selectedYear} với ${formatVND(bestMonthPoint.value)}.`
          : `Chưa có dữ liệu doanh thu theo tháng cho năm ${selectedYear}.`,
        bestYearPoint.value > 0
          ? `Năm ${bestYearPoint.label} đạt ${formatVND(bestYearPoint.value)} tổng doanh thu.`
          : "Chưa có dữ liệu doanh thu theo năm.",
        topMovies.length > 0
          ? `${topMovies[0].movie} dẫn đầu với ${formatNumber(topMovies[0].tickets)} vé (${formatVND(topMovies[0].revenue)}).`
          : "Chưa ghi nhận phim bán chạy trong giai đoạn này.",
        `Tỷ trọng thanh toán: ${toPercent(cashCount, monthRows.length)} tiền mặt • ${toPercent(transferCount, monthRows.length)} chuyển khoản.`,
        `Giá trị trung bình mỗi giao dịch: ${formatVND(avgOrderValue)}.`,
      ];

      const metricBlocks = [
        buildMetricCard(
          "Tổng doanh thu",
          formatVND(totalRevenueAmount),
          `${formatNumber(totalTransactions)} giao dịch`,
          "#eef2ff",
        ),
        buildMetricCard(
          `Doanh thu tháng ${selectedMonth}`,
          formatVND(monthRevenue),
          `${formatNumber(monthRows.length)} giao dịch trong tháng`,
          "#ecfdf5",
        ),
        buildMetricCard(
          "Giá trị TB/giao dịch",
          formatVND(avgOrderValue),
          "Trên toàn bộ dữ liệu",
          "#fff7ed",
        ),
        buildMetricCard(
          "Số vé tháng",
          formatNumber(monthTickets),
          `${formatNumber(movieMap.size)} phim đang được thống kê`,
          "#fdf2f8",
        ),
      ];

      const metricRows: Array<Record<string, unknown>> = [];
      for (let i = 0; i < metricBlocks.length; i += 2) {
        metricRows.push({
          columns: metricBlocks.slice(i, i + 2),
          columnGap: 14,
          margin: [0, i === 0 ? 16 : 8, 0, 0],
        });
      }

      const exportDate = new Date().toISOString().slice(0, 10);
      const docDefinition: TDocumentDefinitions = {
        info: {
          title: `Báo cáo doanh thu ${exportDate}`,
          subject: "Báo cáo doanh thu giao dịch",
        },
        pageMargins: [40, 50, 40, 60],
        defaultStyle: {
          font: "Roboto",
          fontSize: 11,
          color: "#0f172a",
        },
        content: [
          { text: "BÁO CÁO DOANH THU GIAO DỊCH", style: "header" },
          {
            text: `Phạm vi: Tháng ${selectedMonth}/${selectedYear} • Tổng dữ liệu: ${formatNumber(totalTransactions)} giao dịch`,
            style: "meta",
          },
          { text: `Ngày xuất: ${new Date().toLocaleString("vi-VN")}`, style: "meta", margin: [0, 0, 0, 20] },
          ...metricRows,
          { text: "Chi tiết thanh toán", style: "sectionTitle" },
          {
            table: {
              widths: ["*", "auto", "auto"],
              body: paymentTableBody,
            },
            layout: {
              fillColor: (rowIndex: number) => {
                if (rowIndex === 0) return "#0f172a";
                return rowIndex % 2 === 0 ? "#ffffff" : "#f9fafb";
              },
              hLineWidth: (rowIndex: number) => (rowIndex === 0 ? 0 : 0.5),
              vLineWidth: () => 0,
              hLineColor: () => "#e5e7eb",
              paddingLeft: () => 10,
              paddingRight: () => 10,
              paddingTop: () => 6,
              paddingBottom: () => 6,
            },
          },
          { text: "Tình trạng giao dịch", style: "sectionTitle" },
          {
            table: {
              widths: ["*", "auto", "auto"],
              body: statusTableBody,
            },
            layout: {
              fillColor: (rowIndex: number) => {
                if (rowIndex === 0) return "#0f172a";
                return rowIndex % 2 === 0 ? "#ffffff" : "#f9fafb";
              },
              hLineWidth: (rowIndex: number) => (rowIndex === 0 ? 0 : 0.5),
              vLineWidth: () => 0,
              hLineColor: () => "#e5e7eb",
              paddingLeft: () => 10,
              paddingRight: () => 10,
              paddingTop: () => 6,
              paddingBottom: () => 6,
            },
          },
          { text: "Top 10 phim bán chạy", style: "sectionTitle" },
          {
            table: {
              widths: ["auto", "*", "auto", "auto"],
              body: movieTableBody,
            },
            layout: {
              fillColor: (rowIndex: number) => {
                if (rowIndex === 0) return "#0f172a";
                return rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
              },
              hLineWidth: (rowIndex: number) => (rowIndex === 0 ? 0 : 0.5),
              vLineWidth: () => 0,
              hLineColor: () => "#e5e7eb",
              paddingLeft: () => 10,
              paddingRight: () => 10,
              paddingTop: () => 6,
              paddingBottom: () => 6,
            },
          },
          { text: "Điểm nhấn nổi bật", style: "sectionTitle" },
          {
            ul: highlightItems,
            style: "bulletList",
          },
        ],
        styles: {
          header: { fontSize: 20, bold: true, alignment: "center", color: "#111827" },
          meta: { fontSize: 11, color: "#4b5563", alignment: "center" },
          sectionTitle: { fontSize: 14, bold: true, color: "#111827", margin: [0, 24, 0, 10] },
          metricLabel: { fontSize: 10, color: "#6b7280", letterSpacing: 0.5 },
          metricValue: { fontSize: 18, bold: true, color: "#111827", margin: [0, 4, 0, 2] },
          metricHint: { fontSize: 10, color: "#4b5563" },
          tableHeader: { color: "#ffffff", bold: true },
          tableCell: { fontSize: 11, color: "#0f172a" },
          tableCellMuted: { fontSize: 11, color: "#6b7280" },
          bulletList: { margin: [0, 4, 0, 0] },
        },
      };

      pdfMake.createPdf(docDefinition).download(`bao-cao-doanh-thu-${exportDate}.pdf`);
    } finally {
      setExportingType(null);
    }
  };

  const filteredMovies = useMemo(() => {
    return movieData.filter((movie) =>
      movie.title.toLowerCase().includes(movieSearch.toLowerCase()),
    );
  }, [movieData, movieSearch]);

  const paginatedMovies = useMemo(() => {
    const start = (moviePage - 1) * moviesPerPage;
    return filteredMovies.slice(start, start + moviesPerPage);
  }, [filteredMovies, moviePage]);

  const totalMoviePages = Math.ceil(filteredMovies.length / moviesPerPage);

  const getRevenueStats = (rows: TransactionItem[]) => {
    const total = rows.length;
    const cashCount = rows.filter((row) =>
      isCashMethod(row.paymentMethod),
    ).length;
    const transferCount = Math.max(total - cashCount, 0);
    const totalRevenue = rows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0,
    );

    return { total, cashCount, transferCount, totalRevenue };
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
        <div className="flex items-center gap-2">
          <Button
            className={`gap-2 ${
              showStats
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 hover:bg-gray-700"
            } text-white`}
            onClick={() => {
              setShowStats(!showStats);
              setMoviePage(1);
            }}
          >
            <BarChart className="w-4 h-4" />
            {showStats ? "Danh Sách Giao Dịch" : "Thống Kê Doanh Thu"}
          </Button>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => void exportTransactionsExcel()}
            disabled={isLoading || exportingType !== null || transactions.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportingType === "excel" ? "Đang xuất Excel..." : "Xuất Excel"}
          </Button>
          <Button
            className="gap-2"
            onClick={() => void exportRevenueReportPdf()}
            disabled={isLoading || exportingType !== null || transactions.length === 0}
          >
            <FileText className="w-4 h-4" />
            {exportingType === "pdf" ? "Đang xuất PDF..." : "Xuất Báo Cáo"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {!showStats && (
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
                  <p className="text-2xl font-bold">{summary.successCount}</p>
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
                  <p className="text-2xl font-bold">{summary.pendingCount}</p>
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
                    {summary.failedOrRefundedCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats View */}
      {showStats && (
        <div className="space-y-6">
          {statsLoading ? (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                Đang tải dữ liệu thống kê...
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Month/Year Selection */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Tháng:</label>
                      <Select
                        value={String(selectedMonth)}
                        onValueChange={(value) => setSelectedMonth(Number(value))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={String(month)}>
                              Tháng {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Năm:</label>
                      <Select
                        value={String(selectedYear)}
                        onValueChange={(value) => setSelectedYear(Number(value))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) =>
                            new Date().getFullYear() - 2 + i,
                          ).map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant={chartType === "day" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("day")}
                      className="gap-1"
                    >
                      <LineChartIcon className="w-3 h-3" />
                      Theo Ngày
                    </Button>
                    <Button
                      variant={chartType === "month" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("month")}
                      className="gap-1"
                    >
                      <BarChart className="w-3 h-3" />
                      Theo Tháng
                    </Button>
                    <Button
                      variant={chartType === "year" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("year")}
                      className="gap-1"
                    >
                      <BarChart className="w-3 h-3" />
                      Theo Năm
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tỷ Lệ Thanh Toán</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={4}
                          label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#3b82f6" />
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatPiePercent(Number(value))}
                        />
                        <Legend
                          verticalAlign="middle"
                          align="right"
                          layout="vertical"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Doanh Thu {chartType === "day" ? "Theo Ngày" : chartType === "month" ? "Theo Tháng" : "Theo Năm"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "day" ? (
                        <LineChart data={dayRevenueData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString("vi-VN")} />
                          <Tooltip
                            labelFormatter={(label) => `Ngày ${label}`}
                            formatter={(value: number) => [`${value.toLocaleString("vi-VN")}đ`, "Doanh thu"]}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      ) : chartType === "month" ? (
                        <LineChart data={monthRevenueData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString("vi-VN")} />
                          <Tooltip
                            labelFormatter={(label) => `Tháng ${label}`}
                            formatter={(value: number) => [`${value.toLocaleString("vi-VN")}đ`, "Doanh thu"]}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      ) : (
                        <LineChart data={yearRevenueData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString("vi-VN")} />
                          <Tooltip
                            labelFormatter={(label) => `Năm ${label}`}
                            formatter={(value: number) => [`${value.toLocaleString("vi-VN")}đ`, "Doanh thu"]}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Movie Revenue Table */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle>Doanh Thu Theo Phim</CardTitle>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Tìm tên phim..."
                          value={movieSearch}
                          onChange={(e) => {
                            setMovieSearch(e.target.value);
                            setMoviePage(1);
                          }}
                          className="pl-10"
                        />
                      </div>
                      <Select
                        value={movieSort}
                        onValueChange={(value) =>
                          setMovieSort(
                            value as
                              | "revenue-desc"
                              | "revenue-asc"
                              | "tickets-desc"
                              | "tickets-asc",
                          )
                        }
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Sắp xếp" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue-desc">
                            Doanh Thu Cao Nhất
                          </SelectItem>
                          <SelectItem value="revenue-asc">
                            Doanh Thu Thấp Nhất
                          </SelectItem>
                          <SelectItem value="tickets-desc">
                            Vé Bán Chạy Nhất
                          </SelectItem>
                          <SelectItem value="tickets-asc">
                            Vé Bán Ít Nhất
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phim</TableHead>
                        <TableHead className="text-right">Vé Bán</TableHead>
                        <TableHead className="text-right">Doanh Thu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMovies.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Không tìm thấy phim
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedMovies.map((movie) => (
                          <TableRow key={movie.title}>
                            <TableCell className="font-medium">
                              {movie.title}
                            </TableCell>
                            <TableCell className="text-right">
                              {movie.tickets}
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {movie.revenue.toLocaleString("vi-VN")}đ
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {filteredMovies.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Hiển thị {(moviePage - 1) * moviesPerPage + 1} -
                        {Math.min(moviePage * moviesPerPage, filteredMovies.length)} /{" "}
                        {filteredMovies.length} phim
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={moviePage <= 1}
                          onClick={() =>
                            setMoviePage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          Trước
                        </Button>

                        {Array.from({ length: totalMoviePages }, (_, i) => i + 1)
                          .filter(
                            (num) =>
                              num === 1 ||
                              num === totalMoviePages ||
                              Math.abs(num - moviePage) <= 1,
                          )
                          .map((num, idx, arr) => (
                            <React.Fragment key={num}>
                              {idx > 0 && arr[idx - 1] !== num - 1 && (
                                <span className="text-muted-foreground">...</span>
                              )}
                              <Button
                                size="sm"
                                variant={
                                  num === moviePage ? "default" : "outline"
                                }
                                onClick={() => setMoviePage(num)}
                              >
                                {num}
                              </Button>
                            </React.Fragment>
                          ))}

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={moviePage >= totalMoviePages}
                          onClick={() =>
                            setMoviePage((prev) =>
                              Math.min(totalMoviePages, prev + 1),
                            )
                          }
                        >
                          Sau
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {!showStats && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Danh Sách Giao Dịch</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Mã GD/Mã booking/khách/phim..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={(value) => {
                  setFilterStatus(value);
                  setPage(1);
                }}
              >
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
              <Select
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="momo">Momo</SelectItem>
                  <SelectItem value="vnpay">VNPay</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-40"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-40"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                  setPaymentMethod("all");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
              >
                Xóa lọc
              </Button>
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
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Đang tải dữ liệu giao dịch...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && error && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-red-500"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !error && transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không có giao dịch phù hợp
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                !error &&
                transactions.map((transaction) => (
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

          {!isLoading && !error && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                / {pagination.total} giao dịch
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={String(limit)}
                  onValueChange={(value) => {
                    setLimit(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / trang</SelectItem>
                    <SelectItem value="20">20 / trang</SelectItem>
                    <SelectItem value="50">50 / trang</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Trước
                </Button>

                {pageNumbers.map((num) => (
                  <Button
                    key={num}
                    size="sm"
                    variant={num === page ? "default" : "outline"}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (pagination.totalPages || 1)}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(pagination.totalPages || 1, prev + 1),
                    )
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default AdminTransactions;
