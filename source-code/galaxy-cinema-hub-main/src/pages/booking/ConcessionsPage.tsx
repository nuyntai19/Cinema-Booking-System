import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/AppContext';
import { concessions as mockConcessions, movies } from '@/data/mockData';
import { ConcessionItem } from '@/types/cinema';

const ConcessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedMovie, selectedSeats, concessions: selectedConcessions, updateConcession } = useBooking();
  const [items, setItems] = useState<ConcessionItem[]>(mockConcessions.map(c => ({ ...c, quantity: 0 })));

  const movie = movies.find(m => m.id === selectedMovie);

  const handleQuantityChange = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        updateConcession(id, newQuantity);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const ticketTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const concessionTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = ticketTotal + concessionTotal;

  const handleContinue = () => {
    navigate('/booking/payment');
  };

  const handleSkip = () => {
    navigate('/booking/payment');
  };

  if (!movie) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Combo & Bắp Nước</h1>

        <div className="grid lg:grid-cols-[1fr,350px] gap-6">
          {/* Concessions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
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
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">
                      {item.price.toLocaleString('vi-VN')}đ
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
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
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
            ))}
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
                src={movie.poster}
                alt={movie.title}
                className="w-12 h-18 object-cover rounded-lg"
              />
              <div>
                <p className="font-medium">{movie.title}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSeats.length} ghế: {selectedSeats.map(s => s.id).join(', ')}
                </p>
              </div>
            </div>

            {/* Ticket Total */}
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Vé ({selectedSeats.length})</span>
              <span>{ticketTotal.toLocaleString('vi-VN')}đ</span>
            </div>

            {/* Concession Items */}
            {items.filter(i => i.quantity > 0).map((item) => (
              <div key={item.id} className="flex justify-between mb-2">
                <span className="text-muted-foreground">
                  {item.nameVi} x{item.quantity}
                </span>
                <span>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
              </div>
            ))}

            {/* Total */}
            <div className="border-t border-border pt-4 mt-4 mb-6">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary">{grandTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleContinue}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Tiến Hành Thanh Toán
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full"
              >
                Bỏ qua bước này
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConcessionsPage;
