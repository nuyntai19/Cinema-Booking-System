import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Phone, Navigation, Clock, Star, Loader } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import CinemaMap from "@/components/cinema/CinemaMap";

interface Cinema {
  id: number;
  name: string;
  address: string;
  city?: string;
  district?: string;
  street?: string;
  lat?: number;
  lng?: number;
  hotline?: string;
  status?: string;
  manager_name?: string;
  manager_email?: string;
  total_halls?: number;
  total_seats?: number;
  halls?: { id: number; name: string; total_seats: number }[];
}

const CinemasPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("all");

  const cities = [
    { id: "all", name: "Tất cả khu vực" },
    { id: "hcm", name: "TP. Hồ Chí Minh" },
    { id: "hanoi", name: "Hà Nội" },
    { id: "danang", name: "Đà Nẵng" },
  ];

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const getCinemaRegion = (
    cinema: Cinema,
  ): "hcm" | "hanoi" | "danang" | "other" => {
    const joined = normalizeText(
      [cinema.city, cinema.district, cinema.street, cinema.address]
        .filter(Boolean)
        .join(" "),
    );

    if (
      joined.includes("ho chi minh") ||
      joined.includes("tp.hcm") ||
      joined.includes("tphcm") ||
      joined.includes("sai gon") ||
      joined.includes("quan")
    ) {
      return "hcm";
    }

    if (joined.includes("ha noi") || joined.includes("hanoi")) {
      return "hanoi";
    }

    if (joined.includes("da nang") || joined.includes("danang")) {
      return "danang";
    }

    return "other";
  };

  const filteredCinemas =
    selectedCity === "all"
      ? cinemas
      : cinemas.filter((cinema) => getCinemaRegion(cinema) === selectedCity);

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        setLoading(true);
        const response = await apiCall<{
          success: boolean;
          data: { cinemas: Cinema[] };
        }>(API_ENDPOINTS.CINEMAS);
        setCinemas(response.data?.cinemas || []);
      } catch (error) {
        console.error("Failed to fetch cinemas:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách rạp. Vui lòng thử lại.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCinemas();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Đang tải danh sách rạp...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hệ Thống Rạp
          </h1>
          <p className="text-muted-foreground">
            Tìm rạp gần bạn để trải nghiệm điện ảnh tuyệt vời
          </p>
        </div>

        {/* City Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Chọn khu vực
          </h2>
          <div className="flex gap-2 flex-wrap">
            {cities.map((city) => (
              <Button
                key={city.id}
                variant={selectedCity === city.id ? "default" : "outline"}
                onClick={() => setSelectedCity(city.id)}
              >
                {city.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Cinemas List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCinemas.map((cinema) => (
            <Card
              key={cinema.id}
              className="group hover:shadow-lg transition-all"
            >
              <CardContent className="p-6">
                {/* Cinema Image */}
                <div className="relative aspect-video mb-4 rounded-lg overflow-hidden bg-muted">
                  <img
                    src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop"
                    alt={cinema.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      4.8
                    </Badge>
                  </div>
                </div>

                {/* Cinema Info */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {cinema.name}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{cinema.address}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <a
                        href={`tel:${cinema.hotline || "1900 2224"}`}
                        className="hover:text-primary"
                      >
                        {cinema.hotline || "1900 2224"}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>08:00 - 23:30</span>
                    </div>
                  </div>

                  {/* Features */}
                  {/* Features removed - not in API response */}

                  {/* Manager Info */}
                  {cinema.manager_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                      <span className="font-medium">Quản lý:</span>
                      <span>{cinema.manager_name}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1"
                      variant="default"
                      onClick={() => navigate("/schedule")}
                    >
                      Xem lịch chiếu
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/${encodeURIComponent(cinema.address)}`,
                          "_blank",
                        )
                      }
                    >
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <Card>
            <CardContent className="p-0 overflow-hidden">
              <h2 className="text-xl font-bold p-6 border-b">
                Bản đồ hệ thống rạp
              </h2>
              <div className="aspect-video w-full">
                <CinemaMap cinemas={filteredCinemas} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CinemasPage;
