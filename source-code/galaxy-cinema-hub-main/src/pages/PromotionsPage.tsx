import React, { useState } from "react";
import { Gift, Tag, Calendar, CheckCircle, Copy, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AppContext";

interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  type: "percentage" | "fixed" | "gift";
  minOrder?: number;
  validFrom: string;
  validTo: string;
  image: string;
  terms: string[];
  isActive: boolean;
}

interface UserVoucherApiItem {
  promotion_id: number;
  status: "ACTIVE" | "USED" | "EXPIRED";
}

interface PromotionApiItem {
  id: number;
  code: string;
  title?: string;
  description?: string;
  discount_type: "PERCENT" | "FIXED";
  discount_amount: number;
  min_order_value?: number;
  start_date?: string;
  end_date?: string;
  image?: string;
  terms?: string[];
}

interface PromotionsApiResponse {
  success?: boolean;
  data?: {
    promotions?: PromotionApiItem[];
  };
  promotions?: PromotionApiItem[];
}

interface UserVouchersApiResponse {
  success?: boolean;
  data?: {
    vouchers?: UserVoucherApiItem[];
  };
}

type PromotionWithRawEnd = Promotion & { _rawEnd: Date | null };

const PromotionsPage: React.FC = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<"all" | "active" | "upcoming">("all");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedOutPromotionIds, setUsedOutPromotionIds] = useState<Set<string>>(
    new Set(),
  );

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const requests: Promise<unknown>[] = [
          apiCall(API_ENDPOINTS.PROMOTIONS),
        ];
        if (isAuthenticated && user?.id) {
          requests.push(
            apiCall(
              `${API_ENDPOINTS.USER_VOUCHERS(parseInt(user.id))}?status=all`,
            ),
          );
        }

        const [promoRes, voucherRes] = await Promise.all(requests);
        const res = promoRes as PromotionsApiResponse;
        const promos = res?.data?.promotions || res?.promotions || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mapped: Promotion[] = promos
          .map((p): PromotionWithRawEnd => {
            const discount =
              p.discount_type === "PERCENT"
                ? `${Number(p.discount_amount)}%`
                : `${Number(p.discount_amount).toLocaleString("vi-VN")}đ`;
            const start = p.start_date
              ? new Date(p.start_date + "T00:00:00")
              : null;
            const end = p.end_date ? new Date(p.end_date + "T23:59:59") : null;
            const isExpired = end ? end < today : false;
            return {
              id: String(p.id),
              code: p.code,
              title: p.title || p.code,
              description: p.description || "",
              discount,
              type: p.discount_type === "PERCENT" ? "percentage" : "fixed",
              minOrder: Number(p.min_order_value || 0),
              validFrom: p.start_date || "",
              validTo: p.end_date || "",
              image:
                p.image ||
                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop",
              terms: p.terms || (p.description ? [p.description] : []),
              isActive:
                start && end ? start <= today && end >= today : !isExpired,
              // keep raw end for filtering
              _rawEnd: end,
            };
          })
          // filter out expired promotions (end date < today)
          .filter((pm) => {
            if (!pm._rawEnd) return true;
            return pm._rawEnd >= today;
          })
          // remove internal fields
          .map(({ _rawEnd, ...rest }) => rest as Promotion);
        setPromotions(mapped);

        const voucherResponse = voucherRes as
          | UserVouchersApiResponse
          | undefined;
        if (isAuthenticated && user?.id && voucherResponse?.success) {
          const vouchers: UserVoucherApiItem[] =
            voucherResponse?.data?.vouchers || [];

          const voucherStats = new Map<
            string,
            { active: number; used: number }
          >();
          vouchers.forEach((v) => {
            const key = String(v.promotion_id);
            const prev = voucherStats.get(key) || { active: 0, used: 0 };
            if (v.status === "ACTIVE") prev.active += 1;
            if (v.status === "USED") prev.used += 1;
            voucherStats.set(key, prev);
          });

          const usedOut = new Set<string>();
          voucherStats.forEach((stats, promoId) => {
            if (stats.used > 0 && stats.active === 0) {
              usedOut.add(promoId);
            }
          });
          setUsedOutPromotionIds(usedOut);
        } else {
          setUsedOutPromotionIds(new Set());
        }
      } catch (err) {
        console.error("Failed to load promotions", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải khuyến mãi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, toast, user?.id]);

  const isPromoUsedOut = (promoId: string) =>
    isAuthenticated && usedOutPromotionIds.has(promoId);

  const filteredPromotions = promotions.filter((promo) => {
    if (filter === "active") return promo.isActive && !isPromoUsedOut(promo.id);
    if (filter === "upcoming")
      return !promo.isActive && !isPromoUsedOut(promo.id);
    return true;
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Đã sao chép mã",
      description: `Mã "${code}" đã được sao chép. Dán mã khi thanh toán để nhận ưu đãi.`,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Khuyến Mãi
          </h1>
          <p className="text-muted-foreground">
            Khám phá các ưu đãi hấp dẫn dành cho bạn
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Tất cả
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
          >
            Đang diễn ra
          </Button>
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            onClick={() => setFilter("upcoming")}
          >
            Sắp diễn ra
          </Button>
        </div>

        {/* Promotions List */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredPromotions.map((promo) => (
            <Card
              key={promo.id}
              className="overflow-hidden group hover:shadow-lg transition-all"
            >
              <CardContent className="p-0">
                {/* Promotion Image */}
                <div className="relative aspect-[2/1] overflow-hidden">
                  <img
                    src={promo.image}
                    alt={promo.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {isPromoUsedOut(promo.id) ? (
                      <Badge className="bg-gray-500 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        Đã sử dụng hết
                      </Badge>
                    ) : promo.isActive ? (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đang diễn ra
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        Sắp diễn ra
                      </Badge>
                    )}
                  </div>

                  {/* Discount Badge */}
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-lg">
                      {promo.discount}
                    </div>
                  </div>
                </div>

                {/* Promotion Details */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {promo.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {promo.description}
                    </p>
                  </div>

                  {/* Promo Code */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={promo.code}
                        readOnly
                        className="pl-10 font-mono font-bold"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyCode(promo.code)}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Sao chép
                    </Button>
                  </div>

                  {/* Validity Period */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(promo.validFrom)} -{" "}
                      {formatDate(promo.validTo)}
                    </span>
                  </div>

                  {/* Terms */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-2">
                      Điều kiện áp dụng:
                    </h4>
                    <ul className="space-y-1">
                      {promo.terms.map((term, index) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-primary mt-1">•</span>
                          <span>{term}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instruction */}
                  {isPromoUsedOut(promo.id) ? (
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">
                        Bạn đã sử dụng hết mã khuyến mãi này.
                      </p>
                    </div>
                  ) : promo.isActive ? (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-foreground">
                        💡 <strong>Cách sử dụng:</strong> Sao chép mã và dán vào
                        ô "Mã giảm giá" khi thanh toán
                      </p>
                    </div>
                  ) : (
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">
                        Chương trình sẽ bắt đầu từ {formatDate(promo.validFrom)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Section */}
        <Card className="mt-12 bg-gradient-cinema">
          <CardContent className="p-8 text-center">
            <Gift className="w-12 h-12 mx-auto mb-4 text-white" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Nhận thông báo khuyến mãi
            </h2>
            <p className="text-white/80 mb-6">
              Đăng ký email để không bỏ lỡ các ưu đãi hấp dẫn từ Galaxy Cinema
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input placeholder="Email của bạn" className="bg-white" />
              <Button variant="secondary">Đăng ký</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default PromotionsPage;
