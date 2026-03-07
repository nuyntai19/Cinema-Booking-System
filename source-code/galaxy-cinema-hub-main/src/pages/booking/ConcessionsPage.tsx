import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  ShoppingCart,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBooking } from "@/contexts/AppContext";
import { ConcessionItem } from "@/types/cinema";
import { ConcessionService } from "@/services/concession.service";
import { Concession } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";

const ConcessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    selectedMovie,
    selectedSeats,
    concessions: selectedConcessions,
    updateConcession,
  } = useBooking();
  const [items, setItems] = useState<ConcessionItem[]>([]);
  const [movie, setMovie] = useState<{
    id: string;
    title: string;
    poster: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMovie, setLoadingMovie] = useState(true);

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

  // Fetch available concessions from API
  useEffect(() => {
    const fetchConcessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ConcessionService.getAvailable();

        if (response.success && response.data) {
          // Map API data to ConcessionItem format
          const mappedItems: ConcessionItem[] = (
            response.data as Concession[]
          ).map((c) => ({
            id: String(c.id),
            name: c.name,
            nameVi: c.name, // Use same name if no Vietnamese name
            price: Number(c.price) || 0,
            quantity: 0,
            image:
              c.imageUrl ||
              "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=200",
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
  }, [toast]);

  const handleQuantityChange = (id: string, delta: number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + delta);
          const updatedItem = { ...item, quantity: newQuantity };
          updateConcession(updatedItem);
          return updatedItem;
        }
        return item;
      }),
    );
  };

  const ticketTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const concessionTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const grandTotal = ticketTotal + concessionTotal;
  const seatCodes = selectedSeats.map((s) => `${s.row}${s.number}`);

  const handleContinue = () => {
    navigate("/booking/payment");
  };

  const handleSkip = () => {
    navigate("/booking/payment");
  };

  // Redirect if no movie/seats selected (must be in useEffect, not during render)
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
          <h1 className="text-2xl font-bold">Combo & Bắp Nước</h1>
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
                items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-xl border border-border p-4 flex gap-4 animate-fade-in"
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
                            onClick={() => handleQuantityChange(item.id, -1)}
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
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
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
                  alt={movie.title}
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
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Tiến Hành Thanh Toán
                </Button>
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
