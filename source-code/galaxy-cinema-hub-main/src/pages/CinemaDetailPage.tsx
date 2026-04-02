import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  Clock,
  Popcorn,
  Loader,
  ArrowLeft,
  Navigation,
  Film,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import CinemaMap from "@/components/cinema/CinemaMap";

interface Cinema {
  id: number;
  name: string;
  address: string;
  city?: string;
  lat?: number;
  lng?: number;
  hotline?: string;
  status?: string;
  manager_name?: string;
  total_halls?: number;
  total_seats?: number;
  halls?: { id: number; name: string; total_seats: number }[];
}

interface ConcessionItem {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  inventory_quantity?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  combo: "Combo",
  popcorn: "Bắp Rang",
  drink: "Nước Uống",
  snack: "Snack",
  other: "Khác",
};

const CinemaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [concessions, setConcessions] = useState<ConcessionItem[]>([]);
  const [loadingCinema, setLoadingCinema] = useState(true);
  const [loadingConcessions, setLoadingConcessions] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCinema(parseInt(id));
      fetchConcessions(parseInt(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCinema = async (cinemaId: number) => {
    try {
      setLoadingCinema(true);
      const response = await apiCall<{
        success: boolean;
        data: Cinema;
      }>(`${API_ENDPOINTS.CINEMAS}/${cinemaId}`);
      setCinema(response.data || null);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin rạp",
        variant: "destructive",
      });
    } finally {
      setLoadingCinema(false);
    }
  };

  const fetchConcessions = async (cinemaId: number) => {
    try {
      setLoadingConcessions(true);
      const response = await apiCall<{
        success: boolean;
        data: ConcessionItem[];
      }>(API_ENDPOINTS.CONCESSIONS_AVAILABLE_BY_CINEMA(cinemaId));
      setConcessions(response.data || []);
    } catch {
      // silent - concessions might not be available for this cinema
      setConcessions([]);
    } finally {
      setLoadingConcessions(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Group concessions by category
  const grouped = concessions.reduce<Record<string, ConcessionItem[]>>(
    (acc, item) => {
      const cat = item.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {},
  );

  if (loadingCinema) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">
            Đang tải thông tin rạp...
          </span>
        </div>
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy rạp</h2>
          <Button onClick={() => navigate("/cinemas")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách rạp
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/cinemas")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách rạp
        </Button>

        {/* Cinema Hero */}
        <div className="relative aspect-[3/1] mb-8 rounded-xl overflow-hidden bg-muted">
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=400&fit=crop"
            alt={cinema.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{cinema.name}</h1>
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="w-4 h-4" />
              <span>{cinema.address}</span>
            </div>
          </div>
        </div>

        {/* Cinema Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Hotline</p>
                <a
                  href={`tel:${cinema.hotline || "1900 2224"}`}
                  className="font-semibold hover:text-primary"
                >
                  {cinema.hotline || "1900 2224"}
                </a>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Giờ hoạt động</p>
                <p className="font-semibold">08:00 - 23:30</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Film className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Phòng chiếu</p>
                <p className="font-semibold">
                  {cinema.total_halls || cinema.halls?.length || 0} phòng
                  {cinema.total_seats ? ` - ${cinema.total_seats} ghế` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <Button onClick={() => navigate("/schedule")}>
            <Film className="w-4 h-4 mr-2" />
            Xem lịch chiếu
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/${encodeURIComponent(cinema.address)}`,
                "_blank",
              )
            }
          >
            <Navigation className="w-4 h-4 mr-2" />
            Chỉ đường
          </Button>
        </div>

        {/* Halls Info */}
        {cinema.halls && cinema.halls.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Phòng Chiếu</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cinema.halls.map((hall) => (
                <Card key={hall.id}>
                  <CardContent className="p-4 text-center">
                    <p className="font-semibold">{hall.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {hall.total_seats} ghế
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Concessions Menu */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <Popcorn className="w-7 h-7 text-primary" />
            Menu Bắp Nước
          </h2>
          <p className="text-muted-foreground mb-6">
            Các món bắp nước hiện có tại {cinema.name}
          </p>

          {loadingConcessions ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Đang tải menu...
              </span>
            </div>
          ) : concessions.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-lg">
              <Popcorn className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Chưa có thông tin bắp nước cho rạp này
              </p>
              <Button
                variant="link"
                onClick={() => navigate("/concessions")}
                className="mt-2"
              >
                Xem menu chung toàn hệ thống
              </Button>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  {CATEGORY_LABELS[category] || category}
                  <Badge variant="secondary">{items.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="group hover:shadow-lg transition-all overflow-hidden"
                    >
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={getImageUrl(item.image_url)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/400x400?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Popcorn className="w-16 h-16 text-muted-foreground" />
                          </div>
                        )}
                        {item.category && (
                          <Badge className="absolute top-3 left-3">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-lg mb-1">
                          {item.name}
                        </h4>
                        <p className="text-primary font-bold text-xl">
                          {formatPrice(
                            typeof item.price === "string"
                              ? parseFloat(item.price)
                              : item.price,
                          )}
                        </p>
                        {item.inventory_quantity !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Còn {item.inventory_quantity} phần
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Map */}
        {cinema.lat && cinema.lng && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Vị Trí</h2>
            <Card>
              <CardContent className="p-0 overflow-hidden">
                <div className="aspect-video w-full">
                  <CinemaMap cinemas={[cinema]} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CinemaDetailPage;
