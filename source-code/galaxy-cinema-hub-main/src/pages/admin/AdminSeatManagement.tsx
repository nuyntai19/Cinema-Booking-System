import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Save, X, Trash2, Pencil, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AppContext";
import { useTheme } from "@/hooks/use-theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackendCinema {
  id: number;
  name: string;
}

interface BackendHall {
  id: number;
  name: string;
  total_seats: number;
  active_seats?: number;
}

interface SeatCell {
  row_code: string;
  number: number;
  seat_type_id: number;
  status?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ROWS = 10; // A–J
const DEFAULT_COLS = 10; // 1–10

const HALL_TEMPLATES = {
  standard: { label: "Standard (10 x 10)", rows: 10, cols: 10 },
  large: { label: "Large (12 x 10)", rows: 12, cols: 10 },
  imax: { label: "IMAX (15 x 10)", rows: 15, cols: 10 },
} as const;

type HallTemplateKey = keyof typeof HALL_TEMPLATES;

const getSeatTypes = (isLightMode: boolean) => [
  {
    id: 0,
    label: "Khu vực không ngồi",
    color: isLightMode
      ? "bg-slate-100 border-slate-300"
      : "bg-gray-600/40 border-gray-500",
    activeColor: isLightMode
      ? "ring-2 ring-slate-500 bg-slate-200"
      : "ring-2 ring-gray-300 bg-gray-600/60",
    dotColor: isLightMode ? "bg-slate-400" : "bg-gray-400",
    textColor: isLightMode ? "text-slate-600" : "text-gray-300",
  },
  {
    id: 1,
    label: "Ghế thường",
    color: isLightMode
      ? "bg-blue-100 border-blue-300"
      : "bg-blue-600 border-blue-500",
    activeColor: isLightMode
      ? "ring-2 ring-blue-500 bg-blue-200"
      : "ring-2 ring-blue-300 bg-blue-500",
    dotColor: isLightMode ? "bg-blue-500" : "bg-blue-400",
    textColor: isLightMode ? "text-blue-700" : "text-blue-300",
  },
  {
    id: 2,
    label: "Ghế VIP",
    color: isLightMode
      ? "bg-purple-100 border-purple-300"
      : "bg-purple-600 border-purple-500",
    activeColor: isLightMode
      ? "ring-2 ring-purple-500 bg-purple-200"
      : "ring-2 ring-purple-300 bg-purple-500",
    dotColor: isLightMode ? "bg-purple-500" : "bg-purple-400",
    textColor: isLightMode ? "text-purple-700" : "text-purple-300",
  },
  {
    id: 3,
    label: "Sweetbox / Couple",
    color: isLightMode
      ? "bg-rose-100 border-rose-300"
      : "bg-rose-600 border-rose-500",
    activeColor: isLightMode
      ? "ring-2 ring-rose-500 bg-rose-200"
      : "ring-2 ring-rose-300 bg-rose-500",
    dotColor: isLightMode ? "bg-rose-500" : "bg-rose-400",
    textColor: isLightMode ? "text-rose-700" : "text-rose-300",
  },
];

const getSeatTypeGridColor = (isLightMode: boolean): Record<number, string> =>
  isLightMode
    ? {
        0: "bg-slate-100 border-slate-300 text-slate-400 cursor-default",
        1: "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100",
        2: "bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100",
        3: "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100",
      }
    : {
        0: "bg-gray-700/60 border-gray-600 text-gray-500 cursor-default",
        1: "bg-blue-900 border-blue-700 text-blue-200 hover:bg-blue-800",
        2: "bg-purple-900 border-purple-700 text-purple-200 hover:bg-purple-800",
        3: "bg-rose-900 border-rose-700 text-rose-200 hover:bg-rose-800",
      };

const SELECTED_COLOR = "ring-2 ring-yellow-400 brightness-125";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEmptyGrid = (
  rows: number = DEFAULT_ROWS,
  cols: number = DEFAULT_COLS,
): number[][] => Array.from({ length: rows }, () => Array(cols).fill(1));

const getRowsFromTotalSeats = (totalSeats?: number): number => {
  if (!totalSeats || totalSeats <= 0) return DEFAULT_ROWS;
  return Math.max(DEFAULT_ROWS, Math.ceil(totalSeats / DEFAULT_COLS));
};

const seatsToGrid = (
  seats: SeatCell[],
  fallbackRows: number = DEFAULT_ROWS,
  fallbackCols: number = DEFAULT_COLS,
): number[][] => {
  const maxRowFromSeats = seats.reduce((max, s) => {
    const idx = s.row_code.charCodeAt(0) - 65;
    return Math.max(max, idx);
  }, -1);
  const maxColFromSeats = seats.reduce((max, s) => Math.max(max, s.number), 0);

  const rows = Math.max(fallbackRows, maxRowFromSeats + 1);
  const cols = Math.max(fallbackCols, maxColFromSeats);

  const grid = makeEmptyGrid(rows, cols);
  seats.forEach((s) => {
    const r = s.row_code.charCodeAt(0) - 65;
    const c = s.number - 1;
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      // If status is Inactive, treat as unavailable area (typeId=0)
      grid[r][c] = s.status === "Inactive" ? 0 : s.seat_type_id;
    }
  });
  return grid;
};

const gridToSeats = (grid: number[][]): SeatCell[] => {
  const seats: SeatCell[] = [];
  grid.forEach((row, rIdx) => {
    row.forEach((typeId, cIdx) => {
      seats.push({
        row_code: String.fromCharCode(65 + rIdx),
        number: cIdx + 1,
        seat_type_id: typeId === 0 ? 1 : typeId, // use Standard type for inactive cells
        status: typeId === 0 ? "Inactive" : "Active",
      });
    });
  });
  return seats;
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminSeatManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isManagerMode = user?.role === "manager";
  const isLightManagerTheme = isManagerMode && theme === "light";
  const seatTypes = getSeatTypes(isLightManagerTheme);
  const seatTypeGridColor = getSeatTypeGridColor(isLightManagerTheme);

  // ── State ──
  const [cinemas, setCinemas] = useState<BackendCinema[]>([]);
  const [halls, setHalls] = useState<BackendHall[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>("");
  const [selectedHallId, setSelectedHallId] = useState<string>("");
  const [selectedHallName, setSelectedHallName] = useState<string>("");

  const [grid, setGrid] = useState<number[][]>(makeEmptyGrid());
  const [activeMode, setActiveMode] = useState<number>(1); // seat type being painted
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set()); // "r,c" keys
  const [isDragging, setIsDragging] = useState(false);

  // Dialogs
  const [isAddHallOpen, setIsAddHallOpen] = useState(false);
  const [isRenameHallOpen, setIsRenameHallOpen] = useState(false);
  const [hallNameInput, setHallNameInput] = useState("");
  const [newHallTemplate, setNewHallTemplate] =
    useState<HallTemplateKey>("standard");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Load cinemas ──
  useEffect(() => {
    if (isManagerMode) {
      apiCall<{ success: boolean; data: { cinema: BackendCinema } }>(
        API_ENDPOINTS.MANAGER_CINEMA_INFO,
      )
        .then((res) => {
          const managerCinema = res.data?.cinema;
          if (!managerCinema) {
            throw new Error("Không tìm thấy rạp của manager");
          }
          setCinemas([managerCinema]);
          setSelectedCinemaId(String(managerCinema.id));
        })
        .catch(() =>
          toast({
            title: "Lỗi",
            description:
              "Không tải được thông tin rạp quản lý. Vui lòng liên hệ Admin.",
            variant: "destructive",
          }),
        );
      return;
    }

    apiCall<{ success: boolean; data: { cinemas: BackendCinema[] } }>(
      API_ENDPOINTS.CINEMAS,
    )
      .then((res) => setCinemas(res.data?.cinemas || []))
      .catch(() =>
        toast({
          title: "Lỗi",
          description: "Không tải được danh sách rạp",
          variant: "destructive",
        }),
      );
  }, [isManagerMode, toast]);

  // ── Handle URL query params (from AdminCinemas) ──
  useEffect(() => {
    if (isManagerMode) {
      const qHall = searchParams.get("hallId");
      if (qHall) setSelectedHallId(qHall);
      return;
    }

    const qCinema = searchParams.get("cinemaId");
    const qHall = searchParams.get("hallId");
    if (qCinema) setSelectedCinemaId(qCinema);
    if (qHall) setSelectedHallId(qHall);
  }, [searchParams, isManagerMode]);

  // ── Load halls when cinema changes ──
  useEffect(() => {
    if (!selectedCinemaId) {
      setHalls([]);
      return;
    }

    const hallsEndpoint = isManagerMode
      ? API_ENDPOINTS.MANAGER_CINEMA_HALLS
      : API_ENDPOINTS.CINEMA_HALLS(Number(selectedCinemaId));

    apiCall<{ success: boolean; data: { halls: BackendHall[] } }>(
      hallsEndpoint,
    )
      .then((res) => {
        const h = res.data?.halls || [];
        setHalls(h);
        // If we came from URL and have a hall id, pre-select
        if (searchParams.get("hallId") && !selectedHallId) {
          setSelectedHallId(searchParams.get("hallId")!);
        }
      })
      .catch(() =>
        toast({
          title: "Lỗi",
          description: "Không tải được phòng chiếu",
          variant: "destructive",
        }),
      );
  }, [selectedCinemaId, isManagerMode, searchParams, selectedHallId, toast]);

  // ── Load seat layout when hall changes ──
  useEffect(() => {
    if (!selectedHallId) {
      setGrid(makeEmptyGrid());
      setSelectedHallName("");
      return;
    }
    setLoading(true);
    apiCall<{
      success: boolean;
      data: { hall: { name: string; seats: SeatCell[] } };
    }>(API_ENDPOINTS.HALL_DETAIL(Number(selectedHallId)))
      .then((res) => {
        const hall = res.data?.hall;
        if (hall) {
          const hallMeta = halls.find((h) => String(h.id) === selectedHallId);
          const fallbackRows = getRowsFromTotalSeats(hallMeta?.total_seats);
          setSelectedHallName(hall.name);
          setGrid(seatsToGrid(hall.seats || [], fallbackRows, DEFAULT_COLS));
          setSelectedCells(new Set());
        }
      })
      .catch(() =>
        toast({
          title: "Lỗi",
          description: "Không tải được sơ đồ ghế",
          variant: "destructive",
        }),
      )
      .finally(() => setLoading(false));
  }, [selectedHallId, halls, toast]);

  // Update hall name from halls list
  useEffect(() => {
    if (selectedHallId) {
      const hall = halls.find((h) => String(h.id) === selectedHallId);
      if (hall) setSelectedHallName(hall.name);
    }
  }, [halls, selectedHallId]);

  // ── Cell interaction ──
  const cellKey = (r: number, c: number) => `${r},${c}`;

  const handleCellDown = (r: number, c: number) => {
    setIsDragging(true);
    toggleCell(r, c);
  };

  const handleCellEnter = (r: number, c: number) => {
    if (isDragging) toggleCell(r, c);
  };

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const toggleCell = (r: number, c: number) => {
    const key = cellKey(r, c);
    setSelectedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Helpers ──
  const validateCoupleSeats = (
    cells: Set<string>,
  ): { valid: boolean; message?: string } => {
    const arr = [...cells].map((k) => {
      const [r, c] = k.split(",").map(Number);
      return { r, c };
    });

    // Must be even number
    if (arr.length % 2 !== 0) {
      return {
        valid: false,
        message: `Ghế Couple phải chọn số chẵn (hiện đang chọn ${arr.length} ghế)`,
      };
    }

    // Group by row
    const byRow: Record<number, number[]> = {};
    arr.forEach(({ r, c }) => {
      if (!byRow[r]) byRow[r] = [];
      byRow[r].push(c);
    });

    // Each row's selected columns must form complete adjacent pairs (c, c+1)
    for (const row of Object.keys(byRow)) {
      const cols = byRow[Number(row)].sort((a, b) => a - b);
      if (cols.length % 2 !== 0) {
        return {
          valid: false,
          message: `Hàng ${String.fromCharCode(65 + Number(row))} có số lẻ ghế được chọn. Ghế Couple phải chọn từng cặp liền kề.`,
        };
      }
      // Check pairs: cols[0]&cols[1], cols[2]&cols[3], ...
      for (let i = 0; i < cols.length; i += 2) {
        if (cols[i + 1] !== cols[i] + 1) {
          return {
            valid: false,
            message: `Hàng ${String.fromCharCode(65 + Number(row))}: ghế ${cols[i] + 1} và ${cols[i + 1] + 1} không kề nhau. Ghế Couple phải chọn các cặp liền kề nhau.`,
          };
        }
      }
    }

    return { valid: true };
  };

  // ── Actions ──
  const handleConfirm = () => {
    if (!selectedHallId) return;

    // Validate couple seat selection
    if (activeMode === 3 && selectedCells.size > 0) {
      const validation = validateCoupleSeats(selectedCells);
      if (!validation.valid) {
        toast({
          title: "Lỗi chọn ghế Couple",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }
    }

    // Apply selected type to selected cells
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      selectedCells.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        next[r][c] = activeMode;
      });
      return next;
    });
    setSelectedCells(new Set());
    toast({
      title: "Đã áp dụng",
      description: "Nhấn Lưu sơ đồ để lưu vào cơ sở dữ liệu",
    });
  };

  const handleDelete = () => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      selectedCells.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        next[r][c] = 0;
      });
      return next;
    });
    setSelectedCells(new Set());
    toast({
      title: "Đã xóa",
      description: "Các ô đã được đặt thành khu vực không ngồi",
    });
  };

  const handleCancel = () => {
    setSelectedCells(new Set());
  };

  const handleSave = async () => {
    if (!selectedHallId) {
      toast({ title: "Chưa chọn phòng", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const seats = gridToSeats(grid);
      await apiCall(API_ENDPOINTS.HALL_LAYOUT(Number(selectedHallId)), {
        method: "POST",
        body: JSON.stringify({ seats }),
      });
      toast({
        title: "Lưu thành công",
        description: `Đã lưu sơ đồ ghế phòng ${selectedHallName}`,
      });
      // Refresh halls to update seat count
      if (selectedCinemaId) {
        const hallsEndpoint = isManagerMode
          ? API_ENDPOINTS.MANAGER_CINEMA_HALLS
          : API_ENDPOINTS.CINEMA_HALLS(Number(selectedCinemaId));
        const res = await apiCall<{ data: { halls: BackendHall[] } }>(
          hallsEndpoint,
        );
        setHalls(res.data?.halls || []);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Có thể phòng đang có suất chiếu sắp tới";
      toast({
        title: "Lỗi lưu sơ đồ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Hall CRUD ──
  const handleAddHall = async () => {
    if (!hallNameInput.trim() || !selectedCinemaId) return;
    try {
      const template = HALL_TEMPLATES[newHallTemplate];
      const initialTotalSeats = template.rows * template.cols;

      const res = await apiCall<{ data: { id: number } }>(API_ENDPOINTS.HALLS, {
        method: "POST",
        body: JSON.stringify({
          cinema_id: Number(selectedCinemaId),
          name: hallNameInput.trim(),
          total_seats: initialTotalSeats,
        }),
      });
      toast({
        title: "Thành công",
        description: `Đã thêm phòng ${hallNameInput}`,
      });
      setIsAddHallOpen(false);
      setHallNameInput("");
      setNewHallTemplate("standard");
      // Refresh halls and auto-select new one
      const hallsEndpoint = isManagerMode
        ? API_ENDPOINTS.MANAGER_CINEMA_HALLS
        : API_ENDPOINTS.CINEMA_HALLS(Number(selectedCinemaId));
      const hallsRes = await apiCall<{ data: { halls: BackendHall[] } }>(
        hallsEndpoint,
      );
      setHalls(hallsRes.data?.halls || []);
      if (res.data?.id) setSelectedHallId(String(res.data.id));
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể thêm phòng",
        variant: "destructive",
      });
    }
  };

  const handleRenameHall = async () => {
    if (!hallNameInput.trim() || !selectedHallId) return;
    try {
      await apiCall(API_ENDPOINTS.HALL_DETAIL(Number(selectedHallId)), {
        method: "PUT",
        body: JSON.stringify({ name: hallNameInput.trim() }),
      });
      toast({ title: "Thành công", description: "Đã đổi tên phòng" });
      setIsRenameHallOpen(false);
      setHallNameInput("");
      setSelectedHallName(hallNameInput.trim());
      if (selectedCinemaId) {
        const hallsEndpoint = isManagerMode
          ? API_ENDPOINTS.MANAGER_CINEMA_HALLS
          : API_ENDPOINTS.CINEMA_HALLS(Number(selectedCinemaId));
        const res = await apiCall<{ data: { halls: BackendHall[] } }>(
          hallsEndpoint,
        );
        setHalls(res.data?.halls || []);
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể đổi tên phòng",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHall = async () => {
    if (!selectedHallId) return;
    if (
      !window.confirm(
        `Xóa phòng "${selectedHallName}"? Hành động này không thể hoàn tác.`,
      )
    )
      return;
    try {
      await apiCall(API_ENDPOINTS.HALL_DETAIL(Number(selectedHallId)), {
        method: "DELETE",
      });
      toast({ title: "Đã xóa phòng" });
      setSelectedHallId("");
      setGrid(makeEmptyGrid());
      setSelectedCells(new Set());
      if (selectedCinemaId) {
        const hallsEndpoint = isManagerMode
          ? API_ENDPOINTS.MANAGER_CINEMA_HALLS
          : API_ENDPOINTS.CINEMA_HALLS(Number(selectedCinemaId));
        const res = await apiCall<{ data: { halls: BackendHall[] } }>(
          hallsEndpoint,
        );
        setHalls(res.data?.halls || []);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Phòng có thể đang có suất chiếu";
      toast({
        title: "Không thể xóa",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // ── Stats ──
  const totalSeats = grid.flat().filter((t) => t !== 0).length;
  const seatCounts = seatTypes.slice(1).map((st) => ({
    ...st,
    count: grid.flat().filter((t) => t === st.id).length,
  }));

  // ── Render ──
  return (
    <div className="p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Chỗ Ngồi</h1>
          <p className="text-muted-foreground">
            {isManagerMode
              ? "Quản lý sơ đồ ghế cho các phòng chiếu thuộc rạp của bạn"
              : "Thiết kế và quản lý sơ đồ ghế cho từng phòng chiếu"}
          </p>
        </div>
      </div>

      {/* Cinema & Hall selectors */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Cinema */}
            <div className="space-y-1 min-w-[200px]">
              <Label>Rạp chiếu</Label>
              <Select
                value={selectedCinemaId}
                onValueChange={(v) => {
                  if (isManagerMode) return;
                  setSelectedCinemaId(v);
                  setSelectedHallId("");
                }}
                disabled={isManagerMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn rạp..." />
                </SelectTrigger>
                <SelectContent>
                  {cinemas.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hall */}
            <div className="space-y-1 min-w-[180px]">
              <Label>Phòng chiếu</Label>
              <Select
                value={selectedHallId}
                onValueChange={setSelectedHallId}
                disabled={!selectedCinemaId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedCinemaId ? "Chọn phòng..." : "Chọn rạp trước"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {halls.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.name}{" "}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({h.active_seats ?? h.total_seats} ghế)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hall CRUD buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  setHallNameInput("");
                  setNewHallTemplate("standard");
                  setIsAddHallOpen(true);
                }}
                disabled={!selectedCinemaId}
              >
                <Plus className="w-4 h-4" /> Thêm phòng
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  setHallNameInput(selectedHallName);
                  setIsRenameHallOpen(true);
                }}
                disabled={!selectedHallId}
              >
                <Pencil className="w-4 h-4" /> Đổi tên
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={handleDeleteHall}
                disabled={!selectedHallId}
              >
                <Trash2 className="w-4 h-4" /> Xóa phòng
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Area */}
      {selectedHallId ? (
        <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
          {/* Matrix */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                Sơ đồ ghế:{" "}
                <Badge variant="secondary" className="text-sm font-semibold">
                  {selectedHallName}
                </Badge>
                {loading && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    Đang tải...
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <div className="flex flex-col items-center gap-4 min-w-max">
                {/* Screen */}
                <div className="w-full max-w-lg">
                  <div className="h-2 bg-gradient-to-b from-orange-400/70 to-orange-400/10 rounded-t-full mb-1" />
                  <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
                    MÀN HÌNH
                  </p>
                </div>

                {/* Grid */}
                <div className="space-y-1.5">
                  {grid.map((row, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-2">
                      {/* Row label left */}
                      <span className="w-5 text-xs font-bold text-muted-foreground text-right">
                        {String.fromCharCode(65 + rIdx)}
                      </span>
                      <div className="flex gap-1.5">
                        {row.map((typeId, cIdx) => {
                          const key = cellKey(rIdx, cIdx);
                          const isSelected = selectedCells.has(key);
                          return (
                            <div
                              key={cIdx}
                              onMouseDown={() => handleCellDown(rIdx, cIdx)}
                              onMouseEnter={() => handleCellEnter(rIdx, cIdx)}
                              className={cn(
                                "w-8 h-8 rounded border flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all",
                                seatTypeGridColor[typeId] ??
                                  seatTypeGridColor[0],
                                isSelected && SELECTED_COLOR,
                              )}
                              title={`${String.fromCharCode(65 + rIdx)}${cIdx + 1}`}
                            >
                              {cIdx + 1}
                            </div>
                          );
                        })}
                      </div>
                      {/* Row label right */}
                      <span className="w-5 text-xs font-bold text-muted-foreground">
                        {String.fromCharCode(65 + rIdx)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 pt-2 border-t w-full justify-center">
                  {seatTypes.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <div className={cn("w-4 h-4 rounded border", st.color)} />
                      <span className="text-muted-foreground">{st.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-4 h-4 rounded border border-yellow-400 ring-2 ring-yellow-400 bg-blue-900" />
                    <span className="text-muted-foreground">Đang chọn</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Seat type mode selector */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Chọn loại ghế để sơn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {seatTypes.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setActiveMode(st.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left",
                      activeMode === st.id
                        ? "border-yellow-400 bg-yellow-400/10 text-foreground"
                        : "border-border hover:border-muted-foreground/50 text-muted-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded flex-shrink-0 border",
                        st.color,
                      )}
                    />
                    {st.label}
                    {activeMode === st.id && (
                      <ChevronRight className="w-4 h-4 ml-auto text-yellow-400" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Action buttons */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Thao tác ({selectedCells.size} ô đang chọn)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full gap-2"
                  onClick={handleConfirm}
                  disabled={selectedCells.size === 0}
                >
                  <Save className="w-4 h-4" />
                  Xác nhận
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={selectedCells.size === 0}
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa ô đã chọn
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={handleCancel}
                  disabled={selectedCells.size === 0}
                >
                  <X className="w-4 h-4" />
                  Hủy chọn
                </Button>
                <div className="border-t pt-2">
                  <Button
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Đang lưu..." : "Lưu sơ đồ"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Thống kê</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng ghế</span>
                  <span className="font-bold">{totalSeats}</span>
                </div>
                {seatCounts.map((sc) => (
                  <div key={sc.id} className="flex justify-between">
                    <span className={cn("text-xs", sc.textColor)}>
                      {sc.label}
                    </span>
                    <span className="text-xs font-medium">{sc.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p className="text-lg">
              Vui lòng chọn rạp và phòng chiếu để xem sơ đồ ghế
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Hall Dialog */}
      <Dialog open={isAddHallOpen} onOpenChange={setIsAddHallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Phòng Chiếu</DialogTitle>
            <DialogDescription>
              Chọn mẫu phòng ban đầu. Sau đó có thể giảm số ghế bằng cách tô
              "Khu vực không ngồi".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Tên phòng</Label>
            <Input
              value={hallNameInput}
              onChange={(e) => setHallNameInput(e.target.value)}
              placeholder="VD: Phòng 1, IMAX, 4DX..."
              onKeyDown={(e) => e.key === "Enter" && handleAddHall()}
            />
            <div className="space-y-2 pt-2">
              <Label>Mẫu phòng ban đầu</Label>
              <Select
                value={newHallTemplate}
                onValueChange={(value) =>
                  setNewHallTemplate(value as HallTemplateKey)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mẫu phòng" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(HALL_TEMPLATES).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      {template.label} ({template.rows * template.cols} ghế)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddHallOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddHall} disabled={!hallNameInput.trim()}>
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Hall Dialog */}
      <Dialog open={isRenameHallOpen} onOpenChange={setIsRenameHallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi Tên Phòng</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Tên mới</Label>
            <Input
              value={hallNameInput}
              onChange={(e) => setHallNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameHall()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameHallOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleRenameHall} disabled={!hallNameInput.trim()}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSeatManagement;
