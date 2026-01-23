import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Phone, Navigation, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cinemas } from "@/data/mockData";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const CinemasPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<string>("hcm");

  const cities = [
    { id: "hcm", name: "TP. Hồ Chí Minh" },
    { id: "hanoi", name: "Hà Nội" },
    { id: "danang", name: "Đà Nẵng" },
  ];

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
          {cinemas.map((cinema) => (
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
                        href={`tel:${cinema.hotline}`}
                        className="hover:text-primary"
                      >
                        {cinema.hotline}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>08:00 - 23:30</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {cinema.features.map((feature) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>

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
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Bản đồ hệ thống rạp</h2>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p>Bản đồ sẽ được hiển thị tại đây</p>
                </div>
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
