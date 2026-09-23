import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Popcorn,
  Search,
  MapPin,
  Sparkles,
  Coffee,
  Flame,
  Tag,
  Film,
  ArrowRight,
  RotateCcw,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  Utensils,
  Percent,
  Package,
} from "lucide-react";
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
  price: number | string;
  image_url: string | null;
  category: string | null;
  is_available: boolean | number;
  inventory_quantity?: number;
}

interface Cinema {
  id: number;
  name: string;
  address: string;
}

// Normalize category keys to avoid case mismatch (e.g. "drink" vs "Drink")
const normalizeCategoryKey = (rawCat: string | null | undefined): string => {
  if (!rawCat) return "other";
  const lower = rawCat.trim().toLowerCase();
  if (lower.includes("combo")) return "combo";
  if (lower.includes("popcorn") || lower.includes("bắp")) return "popcorn";
  if (
    lower.includes("drink") ||
    lower.includes("nước") ||
    lower.includes("coca") ||
    lower.includes("pepsi")
  )
    return "drink";
  if (lower.includes("snack") || lower.includes("ăn vặt")) return "snack";
  return lower;
};

interface CategoryMeta {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  tagColor: string;
  description: string;
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
  combo: {
    key: "combo",
    label: "Combo Tiết Kiệm",
    icon: Sparkles,
    badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    tagColor: "bg-amber-500 text-white shadow-amber-500/25",
    description: "Bộ đôi bắp giòn rụm và nước ngọt mát lạnh với mức giá ưu đãi nhất",
  },
  popcorn: {
    key: "popcorn",
    label: "Bắp Rang Bơ",
    icon: Popcorn,
    badgeColor: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    tagColor: "bg-yellow-500 text-white shadow-yellow-500/25",
    description: "Bắp rang bơ thơm lừng, vàng óng, độ ngọt béo giòn tan chuẩn vị rạp chiếu",
  },
  drink: {
    key: "drink",
    label: "Nước Giải Khát",
    icon: Coffee,
    badgeColor: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    tagColor: "bg-sky-500 text-white shadow-sky-500/25",
    description: "Nước ngọt có gas ướp lạnh sảng khoái, tiếp thêm năng lượng suốt buổi chiếu",
  },
  snack: {
    key: "snack",
    label: "Snack & Đồ Ăn Nóng",
    icon: Flame,
    badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    tagColor: "bg-rose-500 text-white shadow-rose-500/25",
    description: "Các món ăn vặt thơm giòn nóng hổi: xúc xích, phô mai que, nachos giòn rụm",
  },
  other: {
    key: "other",
    label: "Món Khác",
    icon: Tag,
    badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    tagColor: "bg-purple-500 text-white shadow-purple-500/25",
    description: "Các món ăn kèm và sản phẩm ăn uống hấp dẫn khác",
  },
};

// High quality, appetizing default food photography from Unsplash
const getConcessionDefaultImage = (
  name: string,
  category?: string | null,
): string => {
  const n = name.toLowerCase();
  const c = normalizeCategoryKey(category);

  if (n.includes("combo 2") || n.includes("bắp l + 2")) {
    return "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=700&auto=format&fit=crop&q=80";
  }
  if (n.includes("combo") || c === "combo") {
    return "https://images.unsplash.com/photo-1572177812156-58036aae439c?w=700&auto=format&fit=crop&q=80";
  }
  if (
    n.includes("coca") ||
    n.includes("pepsi") ||
    n.includes("nước") ||
    c === "drink"
  ) {
    if (n.includes("(l)") || n.includes("lớn") || n.includes("large")) {
      return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=700&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=700&auto=format&fit=crop&q=80";
  }
  if (n.includes("bắp") || n.includes("popcorn") || c === "popcorn") {
    if (n.includes("(l)") || n.includes("lớn") || n.includes("large")) {
      return "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=700&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=700&auto=format&fit=crop&q=80";
  }
  if (n.includes("nacho")) {
    return "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=700&auto=format&fit=crop&q=80";
  }
  if (
    n.includes("hot dog") ||
    n.includes("hotdog") ||
    n.includes("xúc xích") ||
    c === "snack"
  ) {
    return "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=700&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1572177812156-58036aae439c?w=700&auto=format&fit=crop&q=80";
};

// Safe image resolver avoiding broken example.com or placehold.co URLs
const resolveConcessionImage = (
  url: string | null | undefined,
  name: string,
  category?: string | null,
): string => {
  if (
    !url ||
    url.includes("example.com") ||
    url.includes("placehold.co") ||
    url.trim() === ""
  ) {
    return getConcessionDefaultImage(name, category);
  }
  return getImageUrl(url);
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
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

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
        description: "Không thể tải menu bắp nước. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | string) => {
    const num = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num || 0);
  };

  // Extract clean unique categories present in the data
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    concessions.forEach((c) => {
      set.add(normalizeCategoryKey(c.category));
    });
    // Order: combo -> popcorn -> drink -> snack -> other
    const order = ["combo", "popcorn", "drink", "snack", "other"];
    return Array.from(set).sort((a, b) => {
      const ia = order.indexOf(a) >= 0 ? order.indexOf(a) : 99;
      const ib = order.indexOf(b) >= 0 ? order.indexOf(b) : 99;
      return ia - ib;
    });
  }, [concessions]);

  // Filtered concessions
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return concessions.filter((item) => {
      const matchSearch = !q || item.name.toLowerCase().includes(q);
      const itemCat = normalizeCategoryKey(item.category);
      const matchCategory =
        selectedCategory === "ALL" || itemCat === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [concessions, searchTerm, selectedCategory]);

  // Grouped by normalized category
  const grouped = useMemo(() => {
    const map: Record<string, ConcessionItem[]> = {};
    filtered.forEach((item) => {
      const cat = normalizeCategoryKey(item.category);
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return map;
  }, [filtered]);

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("ALL");
    setSelectedCinemaId(null);
  };

  // Helper to extract item details or badges
  const getItemDetails = (item: ConcessionItem) => {
    const n = item.name;
    let sizeBadge: string | null = null;
    if (n.includes("(M)") || n.includes(" Cỡ M") || n.includes(" Size M")) {
      sizeBadge = "Cỡ Vừa (M)";
    } else if (
      n.includes("(L)") ||
      n.includes(" Cỡ L") ||
      n.includes(" Size L")
    ) {
      sizeBadge = "Cỡ Lớn (L)";
    }

    let subtitle = "";
    const cat = normalizeCategoryKey(item.category);
    if (cat === "combo") {
      subtitle = "Gồm bắp rang thơm giòn kèm nước ngọt có gas mát lạnh";
    } else if (cat === "popcorn") {
      subtitle = "Bắp nổ tươi giòn tan thơm bơ hảo hạng";
    } else if (cat === "drink") {
      subtitle = "Nước ngọt mát lạnh sảng khoái";
    } else if (cat === "snack") {
      subtitle = "Món ăn nhẹ nóng hổi thơm ngon";
    } else {
      subtitle = "Món ăn kèm chuẩn vị tại rạp";
    }

    return { sizeBadge, subtitle };
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden flex flex-col">
      <Header />

      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative z-10">
        {/* Hero Section */}
        <div className="relative mb-8 rounded-3xl overflow-hidden border border-border bg-card text-card-foreground p-6 sm:p-8 md:p-10 shadow-sm transition-colors">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Popcorn className="w-3.5 h-3.5" />
              <span>Galaxy Cinema • Concessions & Refreshments</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-3 leading-tight">
              Menu Bắp Nước{" "}
              <span className="text-primary">Galaxy Cinema</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light mb-6">
              Nâng tầm trải nghiệm điện ảnh với bắp rang bơ nóng hổi thơm lừng,
              nước giải khát mát lạnh và các combo siêu tiết kiệm. Chọn rạp để xem
              thực đơn chính xác nhất.
            </p>

            {/* Quick Benefits Chips */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/80 border border-border text-xs font-medium text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bắp rang bơ nổ tươi mỗi ngày</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/80 border border-border text-xs font-medium text-foreground">
                <Percent className="w-3.5 h-3.5 text-primary" />
                <span>Combo tiết kiệm tới 25%</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/80 border border-border text-xs font-medium text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Nhận tại quầy nhanh chóng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Cinema Notification (if cinema is selected) */}
        {selectedCinema && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">
                  Đang xem menu tại:{" "}
                  <span className="text-primary">{selectedCinema.name}</span>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {selectedCinema.address}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCinemaId(null)}
              className="text-xs h-8 rounded-xl border-border hover:bg-muted"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              Xem tất cả rạp
            </Button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm space-y-4 transition-colors">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm món: bắp phô mai, caramel, coca, combo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2.5 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Cinema Dropdown Selector */}
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                <select
                  className="w-full h-11 pl-10 pr-8 bg-background border border-input text-foreground rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                  value={selectedCinemaId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCinemaId(val ? parseInt(val) : null);
                  }}
                >
                  <option value="">Tất cả cụm rạp Galaxy</option>
                  {cinemas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                  ▼
                </div>
              </div>

              {(searchTerm ||
                selectedCategory !== "ALL" ||
                selectedCinemaId !== null) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-11 px-3 text-xs text-muted-foreground hover:text-foreground rounded-xl flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đặt lại</span>
                </Button>
              )}
            </div>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 mr-1 font-medium">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Danh mục:
            </span>

            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedCategory === "ALL"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Tất cả</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                {concessions.length}
              </span>
            </button>

            {availableCategories.map((catKey) => {
              const meta = CATEGORY_MAP[catKey] || CATEGORY_MAP.other;
              const Icon = meta.icon;
              const count = concessions.filter(
                (c) => normalizeCategoryKey(c.category) === catKey,
              ).length;

              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedCategory === catKey
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{meta.label}</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Popcorn className="w-5 h-5 text-primary absolute" />
            </div>
            <p className="text-base font-medium text-muted-foreground animate-pulse">
              Đang tải danh sách bắp nước Galaxy Cinema...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-card border border-border p-8 shadow-sm">
            <Popcorn className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Không tìm thấy món bắp nước phù hợp
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Không có sản phẩm nào khớp với từ khóa "{searchTerm}". Vui lòng thử
              nhập tên món khác hoặc làm mới bộ lọc.
            </p>
            <Button
              onClick={handleResetFilters}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm px-6"
            >
              Xem tất cả thực đơn
            </Button>
          </div>
        ) : selectedCategory === "ALL" ? (
          /* Render by Category Sections */
          <div className="space-y-12">
            {availableCategories.map((catKey) => {
              const items = grouped[catKey];
              if (!items || items.length === 0) return null;
              const meta = CATEGORY_MAP[catKey] || CATEGORY_MAP.other;
              const Icon = meta.icon;

              return (
                <section key={catKey} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                            {meta.label}
                          </h2>
                          <Badge
                            variant="secondary"
                            className="rounded-lg text-xs px-2 py-0.5"
                          >
                            {items.length} món
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-light">
                          {meta.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                      <ConcessionCard
                        key={item.id}
                        item={item}
                        meta={meta}
                        formatPrice={formatPrice}
                        getItemDetails={getItemDetails}
                        selectedCinemaId={selectedCinemaId}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Render Flat Grid for specific filtered category */
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <span>Đang hiển thị {filtered.length} sản phẩm thuộc mục:</span>
              <span className="text-primary font-bold">
                {CATEGORY_MAP[selectedCategory]?.label || selectedCategory}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((item) => {
                const catKey = normalizeCategoryKey(item.category);
                const meta = CATEGORY_MAP[catKey] || CATEGORY_MAP.other;
                return (
                  <ConcessionCard
                    key={item.id}
                    item={item}
                    meta={meta}
                    formatPrice={formatPrice}
                    getItemDetails={getItemDetails}
                    selectedCinemaId={selectedCinemaId}
                    navigate={navigate}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Promo Notice Banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/5 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Sẵn sàng cho trải nghiệm điện ảnh trọn vẹn?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Đặt vé phim ngay hôm nay và thêm bắp nước trực tuyến để nhận ưu
                đãi giảm giá combo đặc biệt!
              </p>
            </div>
          </div>

          <Button
            onClick={() =>
              navigate(
                selectedCinemaId
                  ? `/schedule?cinema=${selectedCinemaId}`
                  : "/schedule",
              )
            }
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 h-11 rounded-xl flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <Calendar className="w-4 h-4" />
            <span>Xem Lịch Chiếu & Đặt Vé</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Sub-component for individual Concession Card
interface ConcessionCardProps {
  item: ConcessionItem;
  meta: CategoryMeta;
  formatPrice: (price: number | string) => string;
  getItemDetails: (item: ConcessionItem) => {
    sizeBadge: string | null;
    subtitle: string;
  };
  selectedCinemaId: number | null;
  navigate: (path: string) => void;
}

const ConcessionCard: React.FC<ConcessionCardProps> = ({
  item,
  meta,
  formatPrice,
  getItemDetails,
  selectedCinemaId,
  navigate,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() =>
    resolveConcessionImage(item.image_url, item.name, item.category),
  );

  const { sizeBadge, subtitle } = getItemDetails(item);

  return (
    <Card className="group relative bg-card border border-border text-card-foreground hover:border-primary/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      {/* Visual Thumbnail */}
      <div className="relative aspect-[16/11] overflow-hidden bg-muted">
        <img
          src={imgSrc}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={() => {
            // Safe fallback to guaranteed working high-res Unsplash photo
            setImgSrc(getConcessionDefaultImage(item.name, item.category));
          }}
        />

        {/* Gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md shadow-sm border border-white/20 ${meta.tagColor}`}
          >
            {meta.label}
          </span>
        </div>

        {/* Stock / Availability Indicator */}
        <div className="absolute top-3 right-3">
          {selectedCinemaId &&
          item.inventory_quantity !== null &&
          item.inventory_quantity !== undefined ? (
            Number(item.inventory_quantity) > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span>Còn {item.inventory_quantity}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-rose-500/40 text-[11px] font-semibold text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                <span>Hết hàng</span>
              </div>
            )
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span>Sẵn sàng</span>
            </div>
          )}
        </div>

        {/* Size Badge if available */}
        {sizeBadge && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-semibold text-amber-300 border border-amber-300/30">
              {sizeBadge}
            </span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3
            className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-3 min-h-[2.8rem] leading-snug break-words"
            title={item.name}
          >
            {item.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Inventory Row When Cinema is Selected (Similar to Admin Management) */}
        {selectedCinemaId ? (
          <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-muted/60 border border-border">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-primary" />
              <span>Tồn kho rạp:</span>
            </span>
            {item.inventory_quantity !== null &&
            item.inventory_quantity !== undefined ? (
              Number(item.inventory_quantity) > 0 ? (
                <span className="font-bold text-foreground flex items-center gap-1">
                  <span className="text-xs">📦</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                    {item.inventory_quantity}
                  </span>
                </span>
              ) : (
                <span className="font-semibold text-rose-500 flex items-center gap-1 text-[11px]">
                  <span>Hết hàng</span>
                </span>
              )
            ) : (
              <span className="text-muted-foreground font-medium">0</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-muted/30 border border-dashed border-border/70 text-muted-foreground">
            <span className="flex items-center gap-1 text-[11px]">
              <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
              <span>Tồn kho:</span>
            </span>
            <span className="text-[11px] italic text-muted-foreground">
              Chọn rạp để xem
            </span>
          </div>
        )}

        {/* Price & Action */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Giá bán
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-primary tracking-tight">
              {formatPrice(item.price)}
            </div>
          </div>

          <Button
            size="sm"
            disabled={
              selectedCinemaId !== null &&
              item.inventory_quantity !== null &&
              item.inventory_quantity !== undefined &&
              Number(item.inventory_quantity) <= 0
            }
            onClick={() =>
              navigate(
                selectedCinemaId
                  ? `/schedule?cinema=${selectedCinemaId}`
                  : "/schedule",
              )
            }
            className="h-9 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span>
              {selectedCinemaId !== null &&
              item.inventory_quantity !== null &&
              item.inventory_quantity !== undefined &&
              Number(item.inventory_quantity) <= 0
                ? "Hết hàng"
                : "Đặt vé"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConcessionMenuPage;
