import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Phone, Navigation, Clock, Star, Loader, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const extractCity = (cinema: Cinema): string => {
    if (cinema.city && cinema.city.trim() !== "") return cinema.city.trim();
    if (!cinema.address) return "";

    // Phân tích address, lấy phần cuối cùng hoặc từ khóa
    const joined = normalizeText(cinema.address);

    if (
      joined.includes("ho chi minh") ||
      joined.includes("tp.hcm") ||
      joined.includes("tphcm") ||
      joined.includes("sai gon")
    ) {
      return "TP. Hồ Chí Minh";
    }

    if (joined.includes("ha noi") || joined.includes("hanoi")) {
      return "Hà Nội";
    }

    if (joined.includes("da nang") || joined.includes("danang")) {
      return "Đà Nẵng";
    }

    // Lấy phần tử cuối cùng sau dấu phẩy làm thành phố
    const parts = cinema.address.split(",").map((p) => p.trim());
    return parts[parts.length - 1];
  };

  // Extract unique cities from actual cinemas data
  const availableCities = Array.from(
    new Set(cinemas.map(extractCity).filter((city): city is string => !!city))
  ).sort();

  const suggestedCities = availableCities.filter((city) =>
    normalizeText(city).startsWith(normalizeText(searchQuery)) ||
    normalizeText(city).includes(normalizeText(searchQuery)) // dự phòng trường hợp gõ chữ thường
  );

  const filteredCinemas = selectedCity
    ? cinemas.filter((cinema) => extractCity(cinema) === selectedCity)
    : cinemas;

  const totalPages = Math.ceil(filteredCinemas.length / ITEMS_PER_PAGE);
  const paginatedCinemas = filteredCinemas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setSearchQuery(city);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  const clearSelection = () => {
    setSelectedCity(null);
    setSearchQuery("");
    setShowSuggestions(false);
    setCurrentPage(1);
  };

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
        <div className="mb-6 relative max-w-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Chọn khu vực
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nhập tên thành phố..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setCurrentPage(1);
                if (selectedCity && e.target.value !== selectedCity) {
                  setSelectedCity(null);
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={clearSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && searchQuery && suggestedCities.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestedCities.map((city) => (
                <div
                  key={city}
                  className="px-4 py-2 cursor-pointer hover:bg-muted"
                  onMouseDown={() => handleSelectCity(city)}
                >
                  {city}
                </div>
              ))}
            </div>
          )}
          {showSuggestions && searchQuery && suggestedCities.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg px-4 py-3 text-sm text-muted-foreground">
              Không tìm thấy thành phố nào
            </div>
          )}
        </div>

        {/* Cinemas List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCinemas.map((cinema) => (
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {currentPage > 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}

            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="icon"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}

            {currentPage < totalPages && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

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
