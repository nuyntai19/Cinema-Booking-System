import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, History, RefreshCcw } from "lucide-react";
import { TicketService } from "@/services/ticket.service";
import { TicketScanHistoryItem } from "@/types/api";

const StaffScanHistory: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TicketScanHistoryItem[]>([]);
  const [error, setError] = useState<string>("");
  const [filters, setFilters] = useState({
    booking_code: "",
    ticket_code_input: "",
    scanned_by_email: "",
    scan_result: "",
    date_from: "",
    date_to: "",
  });

  const fetchHistory = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const res = await TicketService.getScanHistory(100, 0, nextFilters);
      setItems(res.data?.items || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tải lịch sử quét";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    void fetchHistory(filters);
  };

  const clearFilters = () => {
    const empty = {
      booking_code: "",
      ticket_code_input: "",
      scanned_by_email: "",
      scan_result: "",
      date_from: "",
      date_to: "",
    };
    setFilters(empty);
    void fetchHistory(empty);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Lịch Sử Quét Vé
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => void fetchHistory(filters)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4 mr-2" />
              )}
              Tải lại
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder="Lọc theo mã booking"
              value={filters.booking_code}
              onChange={(e) =>
                handleFilterChange("booking_code", e.target.value)
              }
            />
            <Input
              placeholder="Lọc theo mã quét"
              value={filters.ticket_code_input}
              onChange={(e) =>
                handleFilterChange("ticket_code_input", e.target.value)
              }
            />
            <Input
              placeholder="Lọc theo email nhân viên"
              value={filters.scanned_by_email}
              onChange={(e) =>
                handleFilterChange("scanned_by_email", e.target.value)
              }
            />
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange("date_from", e.target.value)}
            />
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange("date_to", e.target.value)}
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.scan_result}
              onChange={(e) =>
                handleFilterChange("scan_result", e.target.value)
              }
            >
              <option value="">Tất cả kết quả</option>
              <option value="APPROVED">APPROVED</option>
            </select>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Button onClick={applyFilters} disabled={loading}>
              Áp dụng bộ lọc
            </Button>
            <Button variant="outline" onClick={clearFilters} disabled={loading}>
              Xóa lọc
            </Button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Mã booking</th>
                  <th className="px-2 py-2">Mã quét</th>
                  <th className="px-2 py-2">Phim</th>
                  <th className="px-2 py-2">Nhân viên</th>
                  <th className="px-2 py-2">Kết quả</th>
                  <th className="px-2 py-2">Thời gian quét</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-2 py-6 text-center text-muted-foreground"
                    >
                      Chưa có lịch sử quét
                    </td>
                  </tr>
                )}

                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-2 py-2">{item.id}</td>
                    <td className="px-2 py-2 font-medium">
                      {item.booking_code || "N/A"}
                    </td>
                    <td className="px-2 py-2">{item.ticket_code_input}</td>
                    <td className="px-2 py-2">{item.movie_title || "N/A"}</td>
                    <td className="px-2 py-2">
                      {item.scanned_by_email || "N/A"}
                    </td>
                    <td className="px-2 py-2">{item.scan_result}</td>
                    <td className="px-2 py-2">
                      {new Date(item.scanned_at).toLocaleString("vi-VN")}
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

export default StaffScanHistory;
