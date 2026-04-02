import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Popcorn, Search, Loader, MapPin, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ConcessionItem {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  inventory_quantity?: number;
}

interface Cinema {
  id: number;
  name: string;
  address: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  combo: "Combo",
  popcorn: "Bắp Rang",
  drink: "Nước Uống",
  snack: "Snack",
  other: "Khác",
};

const ConcessionMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const cinemaIdParam = searchParams.get("cinema_id");

  const [concessions, setConcessions] = useState<ConcessionItem[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(
    cinemaIdParam ? parseInt(cinemaIdParam) : null,
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCinemas();
  }, []);

  useEffect(() => {
    fetchConcessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCinemaId]);

  const fetchCinemas = async () => {
    try {
      const response = await apiCall<{
        success: boolean;
        data: { cinemas: Cinema[] };
      }>(API_ENDPOINTS.CINEMAS);
      setCinemas(response.data?.cinemas || []);
    } catch {
      // silent - cinemas filter is optional
    }
  };

  const fetchConcessions = async () => {
    try {
      setLoading(true);
      const url = selectedCinemaId
        ? API_ENDPOINTS.CONCESSIONS_AVAILABLE_BY_CINEMA(selectedCinemaId)
        : `${API_ENDPOINTS.CONCESSIONS}/available`;
      const response = await apiCall<{
        success: boolean;
        data: ConcessionItem[];
      }>(url);
      setConcessions(response.data || []);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải menu bắp nước",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Get unique categories
  const categories = Array.from(
    new Set(concessions.map((c) => c.category || "other")),
  );

  // Filter by search and category
  const filtered = concessions.filter((item) => {
    const matchSearch =
      !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      !selectedCategory || (item.category || "other") === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, ConcessionItem[]>>(
    (acc, item) => {
      const cat = item.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {},
  );

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Popcorn className="w-8 h-8 text-primary" />
            Menu Bắp Nước
          </h1>
          <p className="text-muted-foreground">
            Khám phá các combo bắp nước hấp dẫn tại Galaxy Cinema
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm món..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Cinema Filter */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <select
              className="border rounded-md px-3 py-2 bg-background text-foreground text-sm"
              value={selectedCinemaId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCinemaId(val ? parseInt(val) : null);
              }}
            >
              <option value="">Tất cả rạp</option>
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Tất cả
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {CATEGORY_LABELS[cat] || cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Cinema Info */}
        {selectedCinema && (
          <div className="mb-6 p-4 bg-muted rounded-lg flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold">{selectedCinema.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedCinema.address}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => navigate(`/cinema/${selectedCinema.id}`)}
            >
              Xem chi tiết rạp
            </Button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Đang tải menu...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Popcorn className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Không tìm thấy món nào
            </h3>
            <p className="text-muted-foreground">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </div>
        ) : (
          /* Concessions by category */
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                {CATEGORY_LABELS[category] || category}
                <Badge variant="secondary">{items.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className="group hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Image */}
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
                      <h3 className="font-semibold text-lg mb-1">
                        {item.name}
                      </h3>
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

      <Footer />
    </div>
  );
};

export default ConcessionMenuPage;
