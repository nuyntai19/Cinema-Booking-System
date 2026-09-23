import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  ShoppingCart,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Popcorn,
  ShoppingBag,
  Trash2,
  Check,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBooking } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useHoldTimer, formatHoldTime } from "@/hooks/useHoldTimer";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";

// Local type for items shown in this page
interface ConcessionDisplayItem {
  id: string;
  name: string;
  nameVi: string;
  price: number;
  quantity: number;
  image: string;
  category?: string;
  inventory_quantity?: number;
}

// Shape returned by backend
interface ApiConcession {
  id: number;
  name: string;
  price: number | string;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  inventory_quantity?: number;
}

// Fallback image placeholder when image is missing or fails to load
const FALLBACK_CONCESSION_IMAGE =
  "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400&auto=format&fit=crop&q=80";

const ConcessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const { timeLeft, isActive: holdTimerActive } = useHoldTimer();
  const {
    selectedMovie,
    selectedSeats,
    selectedShowtime,
    concessions: selectedConcessions,
    updateConcession,
  } = useBooking();

  const initialSelectedConcessionsRef = useRef(selectedConcessions);

  const [items, setItems] = useState<ConcessionDisplayItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [movie, setMovie] = useState<{
    id: string;
    title: string;
    poster: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});
  const [loadingMovie, setLoadingMovie] = useState(true);

  // Load movie info from backend
  useEffect(() => {
    const fetchMovie = async () => {
      if (!selectedMovie) {
        setLoadingMovie(false);
        return;
      }
      try {
        const response = await apiCall<{
          success: boolean;
          data: {
            movie: {
              id: number;
              title: string;
              poster_url?: string;
              [key: string]: unknown;
            };
          };
        }>(API_ENDPOINTS.MOVIE_DETAIL(parseInt(selectedMovie)));

        if (response.success && response.data?.movie) {
          const m = response.data.movie;
          setMovie({
            id: String(m.id),
            title: m.title,
            poster: m.poster_url
              ? getImageUrl(m.poster_url)
              : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
          });
        }
      } catch (err) {
        console.error("Error fetching movie:", err);
      } finally {
        setLoadingMovie(false);
      }
    };

    fetchMovie();
  }, [selectedMovie]);

  // Fetch available concessions from backend (with inventory if cinema known)
  useEffect(() => {
    const fetchConcessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get cinema_id from selectedShowtime if available
        const showtimeData = selectedShowtime as unknown as {
          cinemaId?: string;
          cinema_id?: number;
          id?: string;
        } | null;
        const cinemaId = showtimeData?.cinemaId || showtimeData?.cinema_id;
        let url = `${API_ENDPOINTS.CONCESSIONS}/available`;
        if (cinemaId) {
          url += `?cinema_id=${cinemaId}`;
        }

        const response = await apiCall<{
          success: boolean;
          data: ApiConcession[];
        }>(url);

        if (response.success && response.data) {
          const selectedMap = new Map(
            initialSelectedConcessionsRef.current.map((c) => [c.id, c.quantity]),
          );

          const mappedItems: ConcessionDisplayItem[] = response.data.map((c) => ({
            id: String(c.id),
            name: c.name,
            nameVi: c.name,
            price: Number(c.price) || 0,
            quantity: selectedMap.get(String(c.id)) || 0,
            image: c.image_url
              ? getImageUrl(c.image_url)
              : FALLBACK_CONCESSION_IMAGE,
            category: c.category || undefined,
            inventory_quantity: c.inventory_quantity,
          }));
          setItems(mappedItems);
        } else {
          setError("Không thể tải danh sách bắp nước");
        }
      } catch (err: unknown) {
        console.error("Error fetching concessions:", err);
        setError(
          err instanceof Error ? err.message : "Có lỗi xảy ra khi tải dữ liệu",
        );
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách bắp nước",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConcessions();
  }, [toast, selectedShowtime]);

  const handleQuantityChange = (
    id: string,
    delta: number,
    inventoryQty?: number,
  ) => {
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) return;

    setInlineErrors((prev) => ({ ...prev, [id]: "" }));

    const newQuantity = Math.max(0, currentItem.quantity + delta);

    // Block if out of stock
    if (delta > 0 && inventoryQty !== undefined && newQuantity > inventoryQty) {
      setInlineErrors((prev) => ({
        ...prev,
        [id]: `Chỉ còn ${inventoryQty} phần`,
      }));
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item,
      ),
    );

    updateConcession(id, newQuantity, {
      name: currentItem.name,
      nameVi: currentItem.nameVi,
      price: currentItem.price,
      image: currentItem.image,
    });
  };

  const handleRemoveAll = (id: string) => {
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) return;

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: 0 } : item)),
    );

    updateConcession(id, 0, {
      name: currentItem.name,
      nameVi: currentItem.nameVi,
      price: currentItem.price,
      image: currentItem.image,
    });
  };

  const ticketTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const concessionTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const grandTotal = ticketTotal + concessionTotal;
  const seatCodes = selectedSeats.map((s) => `${s.row}${s.number}`);
  const selectedItems = items.filter((item) => item.quantity > 0);
  const totalConcessionCount = selectedItems.reduce((acc, i) => acc + i.quantity, 0);
  const hasConcessionSelected = items.some((item) => item.quantity > 0);

  const handleContinue = () => navigate("/booking/payment");
  const handleSkip = () => navigate("/booking/payment");

  // Redirect if no movie/seats selected
  useEffect(() => {
    if (!selectedMovie || selectedSeats.length === 0) {
      navigate("/schedule");
    }
  }, [selectedMovie, selectedSeats, navigate]);

  // Dynamically extract categories from real backend items (No mock categories)
  const categories = useMemo(() => {
    const rawCategories = Array.from(
      new Set(items.map((i) => i.category).filter(Boolean)),
    ) as string[];
    return ["all", ...rawCategories];
  }, [items]);

  // Filter items by category
  const filteredItems = items.filter((item) => {
    if (activeCategory === "all") return true;
    return item.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  if (!selectedMovie || selectedSeats.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a10] text-slate-900 dark:text-white selection:bg-sky-500 selection:text-white dark:selection:text-black relative overflow-x-hidden transition-colors duration-300">
      {/* Background Ambient Lighting Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[350px] bg-gradient-to-b from-sky-500/10 via-amber-500/5 to-transparent blur-3xl opacity-60 dark:opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,#f1f5f9_85%)] dark:bg-[radial-gradient(ellipse_at_top,transparent_20%,#05070c_80%)]" />
      </div>

      <Header />

      <main className="flex-1 container max-w-7xl mx-auto px-3 sm:px-6 py-4 relative z-10 flex flex-col">
        {/* Top Header Card: Stepper, Movie Summary & Hold Timer */}
        <div className="w-full mb-6 rounded-2xl bg-white/90 dark:bg-zinc-900/50 border border-slate-200/90 dark:border-white/10 backdrop-blur-xl p-4 sm:p-5 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {/* Booking Stepper */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 pb-4 border-b border-slate-200/80 dark:border-white/5 text-xs sm:text-sm">
            {/* Step 1: Completed */}
            <button
              type="button"
              onClick={() => navigate("/booking/seats")}
              className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold hover:opacity-80 transition-opacity cursor-pointer"
              title="Nhấn để quay lại sơ đồ chọn ghế"
            >
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span>1. Chọn Ghế</span>
            </button>

            <span className="w-8 sm:w-16 h-[2px] bg-gradient-to-r from-emerald-500 to-sky-500" />

            {/* Step 2: Active */}
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white dark:text-black flex items-center justify-center text-xs font-black shadow-[0_0_12px_rgba(56,189,248,0.7)] animate-pulse">
                2
              </span>
              <span>2. Bắp Nước</span>
            </div>

            <span className="w-8 sm:w-16 h-[2px] bg-slate-200 dark:bg-zinc-800" />

            {/* Step 3: Upcoming */}
            <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500">
              <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center text-xs font-bold border border-slate-300/80 dark:border-zinc-700">
                3
              </span>
              <span>3. Thanh Toán</span>
            </div>
          </div>

          {/* Movie Details & Countdown Hold Timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/booking/seats")}
                className="shrink-0 h-10 w-10 rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                title="Quay lại chọn ghế"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-white" />
              </Button>

              <div className="relative group shrink-0">
                <img
                  src={
                    movie?.poster ||
                    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop"
                  }
                  alt={movie?.title || "Phim"}
                  className="w-12 h-16 sm:w-14 sm:h-20 object-cover rounded-xl shadow-md border border-slate-200 dark:border-white/15 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-sky-500/20 to-purple-500/20 blur -z-10 opacity-70" />
              </div>

              <div>
                <h1 className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
                  {movie?.title || "Đang tải thông tin phim..."}
                </h1>

                <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1.5 flex-wrap">
                  {selectedShowtime.time && (
                    <span className="text-sky-600 dark:text-sky-400 font-bold text-sm bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/40 font-mono">
                      {selectedShowtime.time}
                    </span>
                  )}
                  {selectedShowtime.date && (
                    <>
                      <span>•</span>
                      <span className="text-slate-700 dark:text-zinc-300">
                        {new Date(selectedShowtime.date).toLocaleDateString("vi-VN", {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </>
                  )}
                  {(selectedShowtime.hall || (selectedShowtime as unknown as { hall_name?: string }).hall_name) && (
                    <>
                      <span>•</span>
                      <span className="text-slate-800 dark:text-zinc-200 font-semibold">
                        {selectedShowtime.hall || (selectedShowtime as unknown as { hall_name?: string }).hall_name}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-500/20">
                    {selectedSeats.length} ghế: {seatCodes.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown Hold Timer */}
            {holdTimerActive && (
              <div
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2 rounded-xl font-mono text-sm font-bold border shrink-0 transition-all shadow-md",
                  timeLeft <= 60
                    ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-400 dark:border-red-500/40 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    : "bg-sky-500/10 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.15)]",
                )}
              >
                <Clock className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400" style={{ animationDuration: "8s" }} />
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider block leading-none mb-0.5 font-sans font-medium">
                    Thời gian giữ ghế
                  </span>
                  <span className="text-base tracking-wider">{formatHoldTime(timeLeft)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {(loading || loadingMovie) && (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl bg-white/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10">
            <Loader2 className="w-10 h-10 animate-spin text-sky-500 mb-3" />
            <span className="text-lg font-semibold text-slate-700 dark:text-zinc-300">
              Đang tải danh sách bắp nước...
            </span>
          </div>
        )}

        {/* Main Content Layout */}
        {!loading && !loadingMovie && (
          <div className="grid lg:grid-cols-[1fr,380px] gap-6 items-start pb-8">
            {/* Left Column: Category Tabs & Food Cards */}
            <div className="space-y-5">
              {/* Category Filter Pills (Derived dynamically from backend items) */}
              {categories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat;
                    const count =
                      cat === "all"
                        ? items.length
                        : items.filter((i) => i.category?.toLowerCase() === cat.toLowerCase()).length;
                    const label =
                      cat === "all"
                        ? "Tất cả"
                        : cat.toLowerCase() === "popcorn"
                          ? "Bắp rang bơ"
                          : cat.toLowerCase() === "drink"
                            ? "Nước giải khát"
                            : cat.toLowerCase() === "combo"
                              ? "Combo"
                              : cat.toLowerCase() === "snack"
                                ? "Snack"
                                : cat;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer shadow-sm",
                          isActive
                            ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sky-500/25 shadow-md scale-105"
                            : "bg-white/90 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-zinc-800",
                        )}
                      >
                        <span>{label}</span>
                        <span
                          className={cn(
                            "text-[11px] font-mono px-1.5 py-0.2 rounded-full",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400",
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.length === 0 ? (
                  <div className="col-span-full text-center py-16 rounded-2xl bg-white/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10">
                    <Popcorn className="w-12 h-12 mx-auto text-slate-400 dark:text-zinc-600 mb-3" />
                    <p className="text-base font-semibold text-slate-600 dark:text-zinc-400">
                      Hiện không có bắp nước nào trong danh mục này
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveCategory("all")}
                      className="mt-3 rounded-xl"
                    >
                      Xem tất cả
                    </Button>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const inv = item.inventory_quantity;
                    const isOutOfStock = inv !== undefined && inv <= 0;
                    const isLowStock = inv !== undefined && inv > 0 && inv < 5;
                    const isSelected = item.quantity > 0;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group relative rounded-2xl p-4 flex gap-4 transition-all duration-300 backdrop-blur-md",
                          isSelected
                            ? "bg-white dark:bg-zinc-900/90 border-2 border-sky-500 shadow-[0_8px_25px_rgba(14,165,233,0.15)] ring-1 ring-sky-500/30"
                            : "bg-white/95 dark:bg-zinc-900/70 border border-slate-200/90 dark:border-white/10 hover:border-sky-400/60 dark:hover:border-sky-500/40 hover:shadow-lg",
                          isOutOfStock && "opacity-60 saturate-50 pointer-events-none",
                        )}
                      >
                        {/* Food Image Container */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-zinc-800 shadow-inner">
                          <img
                            src={item.image}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_CONCESSION_IMAGE;
                            }}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                          {/* Selected Quantity Chip */}
                          {isSelected && (
                            <span className="absolute bottom-1.5 right-1.5 bg-sky-500 text-white font-black text-xs px-2 py-0.5 rounded-full shadow-lg">
                              x{item.quantity}
                            </span>
                          )}
                        </div>

                        {/* Food Details & Controls */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            {/* Title with natural word wrapping (NO line-clamp or truncation) */}
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors break-words whitespace-normal leading-snug">
                              {item.nameVi}
                            </h3>
                            {item.name && item.name !== item.nameVi && (
                              <p className="text-xs text-slate-500 dark:text-zinc-400 break-words whitespace-normal mt-0.5">
                                {item.name}
                              </p>
                            )}

                            {/* Stock status indicator from real DB inventory */}
                            <div className="mt-1.5">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md">
                                  ❌ Hết hàng
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                                  ⚠️ Sắp hết (còn {inv})
                                </span>
                              ) : inv !== undefined ? (
                                <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  ✓ Tồn kho: {inv}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Price & Quantity Controls */}
                          <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-100 dark:border-white/5">
                            <span className="font-extrabold font-mono text-base sm:text-lg text-sky-600 dark:text-sky-400">
                              {item.price.toLocaleString("vi-VN")}đ
                            </span>

                            {/* Counter Selector */}
                            {item.quantity === 0 ? (
                              <Button
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, 1, inv)}
                                disabled={isOutOfStock}
                                className="h-8 sm:h-9 px-3.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 text-xs font-extrabold transition-all active:scale-95 shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                <span>Thêm</span>
                              </Button>
                            ) : (
                              <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-xl p-0.5 border border-slate-200 dark:border-white/10 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.id, -1, inv)}
                                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-700 dark:text-white transition-colors cursor-pointer active:scale-95"
                                  title="Giảm 1"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-7 sm:w-8 text-center font-mono font-black text-sm text-sky-600 dark:text-sky-400">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.id, 1, inv)}
                                  disabled={isOutOfStock}
                                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-400 text-white transition-colors cursor-pointer active:scale-95 shadow-sm"
                                  title="Tăng 1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Error if stock exceeded */}
                          {inlineErrors[item.id] && (
                            <p className="text-right text-[11px] text-red-500 font-bold mt-1">
                              {inlineErrors[item.id]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Order Summary Sidebar */}
            <div className="sticky top-20 rounded-2xl bg-white/95 dark:bg-zinc-900/80 border border-slate-200/90 dark:border-white/10 backdrop-blur-2xl p-5 shadow-xl space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    Đơn Hàng
                  </h2>
                </div>
                {totalConcessionCount > 0 && (
                  <Badge className="bg-sky-500 text-white font-mono font-bold text-xs">
                    {totalConcessionCount} món
                  </Badge>
                )}
              </div>

              {/* Movie & Seats Recap Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 space-y-2">
                <div className="flex items-start gap-3">
                  <img
                    src={
                      movie?.poster ||
                      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop"
                    }
                    alt={movie?.title || "Phim"}
                    className="w-10 h-14 object-cover rounded-lg shrink-0 border border-slate-200 dark:border-white/10 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white break-words leading-tight">
                      {movie?.title || "Phim đã chọn"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      {selectedSeats.length} ghế: {seatCodes.join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                {/* Tickets Subtotal */}
                <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                  <span>Vé ({selectedSeats.length})</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                    {ticketTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                {/* Concessions List */}
                {selectedItems.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/5 max-h-56 overflow-y-auto pr-1">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500">
                      Bắp nước:
                    </p>
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-100/70 dark:bg-white/[0.02]"
                      >
                        {/* Wrapped item name without truncate */}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-zinc-200 break-words whitespace-normal leading-snug">
                            {item.nameVi}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                            {item.quantity} x {item.price.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                          <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400">
                            {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAll(item.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Xóa món này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 text-center">
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Chưa chọn combo hoặc bắp nước
                    </p>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold">
                    Tổng cộng
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-sky-600 dark:text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                    {grandTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <Button
                  onClick={handleContinue}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base shadow-[0_4px_20px_rgba(14,165,233,0.4)] hover:shadow-[0_6px_25px_rgba(14,165,233,0.6)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Tiến Hành Thanh Toán</span>
                  <ChevronRight className="w-5 h-5" />
                </Button>

                {!hasConcessionSelected && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="w-full h-10 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white text-xs font-semibold"
                  >
                    Bỏ qua bước này
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConcessionsPage;
