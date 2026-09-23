import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  Navigation,
  Search,
  X,
  Sparkles,
  Film,
  Compass,
  Calendar,
  RotateCcw,
  Building2,
  Tv,
  Armchair,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import CinemaMap, { CinemaMapItem } from "@/components/cinema/CinemaMap";

interface CinemaHall {
  id: number;
  name: string;
  total_seats: number;
}

interface Cinema {
  id: number;
  name: string;
  address: string;
  city?: string;
  district?: string;
  street?: string;
  lat?: number | string;
  lng?: number | string;
  hotline?: string;
  status?: string;
  manager_name?: string;
  manager_email?: string;
  total_halls?: number;
  total_seats?: number | string;
  image_url?: string;
  halls?: CinemaHall[];
}

const DEFAULT_CINEMA_IMAGE =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&auto=format&fit=crop&q=80";

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Strict normalization of city name so all variations of HCM merge into "TP. Hồ Chí Minh"
const extractCity = (cinema: Cinema): string => {
  const combined = normalizeText((cinema.city || "") + " " + (cinema.address || ""));

  if (
    combined.includes("ho chi minh") ||
    combined.includes("tp.hcm") ||
    combined.includes("tphcm") ||
    combined.includes("sai gon")
  ) {
    return "TP. Hồ Chí Minh";
  }
  if (combined.includes("ha noi") || combined.includes("hanoi")) {
    return "Hà Nội";
  }
  if (combined.includes("da nang") || combined.includes("danang")) {
    return "Đà Nẵng";
  }

  if (cinema.city && cinema.city.trim()) {
    return cinema.city.trim();
  }

  return "TP. Hồ Chí Minh";
};

const CinemasPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [focusedCinemaId, setFocusedCinemaId] = useState<number | null>(null);

  // Fetch Cinemas from API
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
          title: "Lỗi kết nối",
          description: "Không thể tải danh sách cụm rạp. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCinemas();
  }, [toast]);

  // Extract available unique cities (Unified)
  const availableCities = useMemo(() => {
    const citiesSet = new Set<string>();
    cinemas.forEach((c) => {
      const city = extractCity(c);
      if (city) citiesSet.add(city);
    });
    return Array.from(citiesSet).sort();
  }, [cinemas]);

  // Filter logic: real-time search across name, address, district, and city
  const filteredCinemas = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);

    return cinemas.filter((cinema) => {
      // 1. City Filter
      if (selectedCity !== "ALL") {
        const city = extractCity(cinema);
        if (city !== selectedCity) return false;
      }

      // 2. Search Query
      if (normalizedQuery) {
        const nameMatch = normalizeText(cinema.name).includes(normalizedQuery);
        const addrMatch = normalizeText(cinema.address).includes(normalizedQuery);
        const districtMatch =
          cinema.district &&
          normalizeText(cinema.district).includes(normalizedQuery);
        const cityMatch =
          cinema.city && normalizeText(cinema.city).includes(normalizedQuery);

        if (!nameMatch && !addrMatch && !districtMatch && !cityMatch) {
          return false;
        }
      }

      return true;
    });
  }, [cinemas, searchQuery, selectedCity]);

  // Function to smoothly scroll to map and focus cinema
  const handleFocusOnMap = (cinemaId: number) => {
    setFocusedCinemaId(cinemaId);
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCity("ALL");
    setFocusedCinemaId(null);
  };

  // Convert to CinemaMapItem
  const mapCinemas: CinemaMapItem[] = useMemo(() => {
    return cinemas.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      lat: c.lat,
      lng: c.lng,
      city: c.city,
      hotline: c.hotline,
      total_halls: c.total_halls || c.halls?.length || 1,
      total_seats: c.total_seats,
    }));
  }, [cinemas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-32 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Film className="w-5 h-5 text-primary absolute" />
          </div>
          <p className="mt-5 text-base font-medium text-muted-foreground animate-pulse">
            Đang tải dữ liệu hệ thống rạp Galaxy...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
      <Header />

      {/* Subtle Background Glows (Adapts in Light and Dark Modes) */}
      <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative z-10">
        {/* Hero Section */}
        <div className="relative mb-10 rounded-3xl overflow-hidden border border-border bg-card text-card-foreground p-6 sm:p-8 md:p-10 shadow-sm transition-colors">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hệ Thống Cụm Rạp Chiếu Phim Galaxy</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
              Hệ Thống Rạp{" "}
              <span className="text-primary">
                Galaxy Cinema
              </span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light mb-8">
              Không gian điện ảnh đẳng cấp với màn hình sắc nét, âm thanh vòm sống
              động và dịch vụ chuyên nghiệp. Chọn rạp gần bạn nhất để thưởng thức các
              bom tấn điện ảnh mới nhất.
            </p>

            {/* Quick Stats Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-foreground">
                    {cinemas.length} Cụm Rạp
                  </div>
                  <div className="text-xs text-muted-foreground">Hiện đại & tiện nghi</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-foreground">
                    {cinemas.reduce(
                      (acc, c) => acc + (c.total_halls || c.halls?.length || 1),
                      0,
                    )}{" "}
                    Phòng Chiếu
                  </div>
                  <div className="text-xs text-muted-foreground">Màn chiếu chất lượng cao</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Armchair className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-foreground">
                    {cinemas.reduce(
                      (acc, c) => acc + Number(c.total_seats || 0),
                      0,
                    )}+ Ghế
                  </div>
                  <div className="text-xs text-muted-foreground">Ghế ngồi êm ái</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & City Filter Bar */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm space-y-4 transition-colors">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm rạp theo tên (Kinh Dương Vương, Tân Bình, Nguyễn Du...), quận hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2.5 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Counter & Reset */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <span className="text-xs text-muted-foreground font-medium">
                Tìm thấy{" "}
                <span className="text-primary font-bold">
                  {filteredCinemas.length}
                </span>{" "}
                / {cinemas.length} rạp
              </span>

              {(searchQuery || selectedCity !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  Đặt lại
                </Button>
              )}
            </div>
          </div>

          {/* City Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Khu vực:
            </span>

            <button
              onClick={() => setSelectedCity("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCity === "ALL"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              Tất cả ({cinemas.length})
            </button>

            {availableCities.map((city) => {
              const count = cinemas.filter((c) => extractCity(c) === city).length;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCity === city
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {city} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Cinemas Cards Grid */}
        {filteredCinemas.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-card border border-border p-8 shadow-sm">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Không tìm thấy cụm rạp phù hợp
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Không có rạp nào khớp với từ khóa "{searchQuery}". Vui lòng thử
              nhập tên rạp khác hoặc làm mới bộ lọc.
            </p>
            <Button
              onClick={handleResetFilters}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm px-6"
            >
              Xem tất cả rạp
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {filteredCinemas.map((cinema) => {
              const cinemaImg = cinema.image_url || DEFAULT_CINEMA_IMAGE;

              return (
                <Card
                  key={cinema.id}
                  className="group relative bg-card border border-border text-card-foreground hover:border-primary/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Cinema Image Thumbnail */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={cinemaImg}
                      alt={cinema.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Status Pill (Real DB status) */}
                    {cinema.status === "active" && (
                      <div className="absolute top-3 left-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                          <span>Hoạt động</span>
                        </div>
                      </div>
                    )}

                    {/* District Pill */}
                    {cinema.district && (
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-medium text-white border border-white/20">
                          {cinema.district}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Cinema Name */}
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {cinema.name}
                      </h3>

                      {/* Address & Hotline */}
                      <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="line-clamp-2 text-foreground/90 font-normal">
                            {cinema.address}
                          </span>
                        </div>

                        {cinema.hotline && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="w-4 h-4 text-primary shrink-0" />
                            <a
                              href={`tel:${cinema.hotline}`}
                              className="hover:text-primary transition-colors font-medium text-foreground/90"
                            >
                              {cinema.hotline}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Hall & Seat Count Badges */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border text-xs text-foreground/80 font-medium">
                          <Tv className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {cinema.total_halls || cinema.halls?.length || 1}{" "}
                            Phòng chiếu
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border text-xs text-foreground/80 font-medium">
                          <Armchair className="w-3.5 h-3.5 text-primary" />
                          <span>{cinema.total_seats || 120} Ghế</span>
                        </div>
                      </div>

                      {/* Real Halls list from database */}
                      {cinema.halls && cinema.halls.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cinema.halls.map((h) => (
                            <span
                              key={h.id}
                              className="text-[11px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border"
                            >
                              {h.name} ({h.total_seats} ghế)
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Manager Name if present */}
                      {cinema.manager_name && (
                        <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
                          <span>Quản lý:</span>
                          <span className="font-medium text-foreground">
                            {cinema.manager_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="pt-4 border-t border-border space-y-2">
                      {/* View Schedule Button */}
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs sm:text-sm h-10 flex items-center justify-center gap-2 shadow-sm"
                        onClick={() => navigate(`/schedule?cinema=${cinema.id}`)}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Xem lịch chiếu</span>
                      </Button>

                      {/* Map Focus & Google Maps Directions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground border-border hover:bg-muted rounded-lg flex items-center justify-center gap-1.5"
                          onClick={() => handleFocusOnMap(cinema.id)}
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Xem trên bản đồ</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground border-border hover:bg-muted rounded-lg flex items-center justify-center"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                cinema.address,
                              )}`,
                              "_blank",
                            )
                          }
                          title="Mở Google Maps chỉ đường"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Interactive Map Section */}
        <div ref={mapSectionRef} className="mt-6 mb-12 scroll-mt-24">
          <div className="rounded-3xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden transition-colors">
            {/* Map Header */}
            <div className="p-5 sm:p-6 md:p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                  <Compass className="w-4 h-4" />
                  <span>Bản Đồ Hệ Thống Rạp Galaxy</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Vị Trí Cụm Rạp Gần Bạn
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Nhấn vào từng rạp để định vị chính xác và xem đường đi nhanh chóng
                </p>
              </div>

              {/* Cinema Quick Selector Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={focusedCinemaId === null ? "default" : "outline"}
                  onClick={() => setFocusedCinemaId(null)}
                  className={`text-xs rounded-xl h-8 ${
                    focusedCinemaId === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  Xem tất cả ({cinemas.length})
                </Button>

                {cinemas.map((cinema) => (
                  <Button
                    key={cinema.id}
                    size="sm"
                    variant={focusedCinemaId === cinema.id ? "default" : "outline"}
                    onClick={() => setFocusedCinemaId(cinema.id)}
                    className={`text-xs rounded-xl h-8 ${
                      focusedCinemaId === cinema.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {cinema.name.replace("Galaxy ", "")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Map Canvas */}
            <div className="w-full h-[450px] md:h-[500px] relative bg-muted">
              <CinemaMap
                cinemas={mapCinemas}
                selectedCinemaId={focusedCinemaId}
                onSelectCinema={(c) => setFocusedCinemaId(c.id)}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CinemasPage;
