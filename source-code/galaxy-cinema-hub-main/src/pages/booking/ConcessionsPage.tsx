import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  ShoppingCart,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Clock,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBooking } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useHoldTimer, formatHoldTime } from "@/hooks/useHoldTimer";
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

const ConcessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [movie, setMovie] = useState<{
    id: string;
    title: string;
    poster: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});
  const [loadingMovie, setLoadingMovie] = useState(true);

  // Load movie info
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

  // Fetch available concessions (with inventory if cinema known)
  useEffect(() => {
    const fetchConcessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get cinema_id from selectedShowtime if available
        const showtimeData = selectedShowtime as unknown as { cinemaId?: string; cinema_id?: number; id?: string } | null;
        let cinemaId = showtimeData?.cinemaId || showtimeData?.cinema_id;
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
              : "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=200",
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

  const ticketTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const concessionTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const grandTotal = ticketTotal + concessionTotal;
  const seatCodes = selectedSeats.map((s) => `${s.row}${s.number}`);
  const hasConcessionSelected = items.some((item) => item.quantity > 0);

  const handleContinue = () => navigate("/booking/payment");
  const handleSkip = () => navigate("/booking/payment");

  // Redirect if no movie/seats selected
  useEffect(() => {
    if (!selectedMovie || selectedSeats.length === 0) {
      navigate("/schedule");
    }
  }, [selectedMovie, selectedSeats, navigate]);

  if (!selectedMovie || selectedSeats.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/booking/seats")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">Combo &amp; Bắp Nước</h1>
          {holdTimerActive && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-base font-bold",
                timeLeft <= 60
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              <Clock className="w-4 h-4" />
              {formatHoldTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {(loading || loadingMovie) && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Đang tải danh sách bắp nước...</span>
          </div>
        )}

        {/* Content */}
        {!loading && !loadingMovie && (
          <div className="grid lg:grid-cols-[1fr,350px] gap-6">
            {/* Concessions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.length === 0 ? (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  Hiện không có bắp nước nào
                </div>
              ) : (
                items.map((item) => {
                  const inv = item.inventory_quantity;
                  const isOutOfStock = inv !== undefined && inv <= 0;
                  const isLowStock = inv !== undefined && inv > 0 && inv < 5;

                  return (
                    <div
                      key={item.id}
                      className={`bg-card rounded-xl border p-4 flex gap-4 animate-fade-in ${
                        isOutOfStock ? "opacity-60 border-red-300" : "border-border"
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold">{item.nameVi}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.name}
                          </p>
                          {isOutOfStock ? (
                            <p className="text-xs text-red-500 font-semibold mt-1">
                              ❌ Hết hàng
                            </p>
                          ) : isLowStock ? (
                            <p className="text-xs text-orange-500 font-bold mt-1">
                              ⚠️ Sắp hết (còn {inv})
                            </p>
                          ) : inv !== undefined ? (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              ✓ Tồn kho: {inv}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            {item.price.toLocaleString("vi-VN")}đ
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => handleQuantityChange(item.id, -1, inv)}
                              disabled={item.quantity === 0}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => handleQuantityChange(item.id, 1, inv)}
                              disabled={isOutOfStock}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {inlineErrors[item.id] && (
                          <div className="text-right text-xs text-red-500 font-medium mt-1">
                            {inlineErrors[item.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-20">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Đơn Hàng
              </h2>

              {/* Movie Info */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
                <img
                  src={
                    movie?.poster ||
                    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop"
                  }
                  alt={movie?.title ?? ""}
                  className="w-12 h-18 object-cover rounded-lg"
                />
                <div>
                  <p className="font-medium">
                    {movie?.title || "Phim đã chọn"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSeats.length} ghế: {seatCodes.join(", ")}
                  </p>
                </div>
              </div>

              {/* Ticket Total */}
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">
                  Vé ({selectedSeats.length})
                </span>
                <span>{ticketTotal.toLocaleString("vi-VN")}đ</span>
              </div>

              {/* Concession Items */}
              {items
                .filter((i) => i.quantity > 0)
                .map((item) => (
                  <div key={item.id} className="flex justify-between mb-2">
                    <span className="text-muted-foreground">
                      {item.nameVi} x{item.quantity}
                    </span>
                    <span>
                      {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ))}

              {/* Total */}
              <div className="border-t border-border pt-4 mt-4 mb-6">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary">
                    {grandTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleContinue}
                  disabled={!hasConcessionSelected}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tiến Hành Thanh Toán
                </Button>
                {!hasConcessionSelected && (
                  <p className="text-xs text-center text-muted-foreground">
                    Vui lòng chọn ít nhất một combo/bắp nước để tiếp tục
                  </p>
                )}
                <Button variant="ghost" onClick={handleSkip} className="w-full">
                  Bỏ qua bước này
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConcessionsPage;
