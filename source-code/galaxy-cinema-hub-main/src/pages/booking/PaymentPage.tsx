import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, Tag, Clock, QrCode, Check, X, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBooking } from '@/contexts/AppContext';
import { API_ENDPOINTS, apiCall } from '@/lib/api';
import { PaymentMethod } from '@/types/cinema';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedMovie, selectedSeats, concessions, clearBooking } = useBooking();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('momo');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTimeLeft, setQRTimeLeft] = useState(300); // 5 minutes
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [movie, setMovie] = useState<any>(null);

  // Fetch movie from API
  useEffect(() => {
    const fetchMovie = async () => {
      if (!selectedMovie) return;
      try {
        setLoading(true);
        const response = await apiCall<{ success: boolean; data: { movie: any } }>(
          API_ENDPOINTS.MOVIE_DETAIL(parseInt(selectedMovie))
        );
        if (response.success && response.data?.movie) {
          const m = response.data.movie;
          setMovie({
            id: String(m.id),
            title: m.title,
            poster: m.poster_url ? `${API_ENDPOINTS.MOVIES.replace('/api/movies', '')}/uploads/posters/${m.poster_url}` : '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch movie:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [selectedMovie]);

  const ticketTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const concessionTotal = concessions.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subtotal = ticketTotal + concessionTotal;
  const grandTotal = subtotal - discount;

  // QR Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showQRModal && qrTimeLeft > 0) {
      timer = setInterval(() => {
        setQRTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowQRModal(false);
            toast({
              title: 'Hết thời gian thanh toán',
              description: 'Giao dịch đã bị hủy do quá thời gian',
              variant: 'destructive',
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQRModal, qrTimeLeft, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'SUMMER20') {
      setDiscount(20000);
      toast({
        title: 'Áp dụng thành công!',
        description: 'Giảm 20.000đ cho đơn hàng',
      });
    } else {
      toast({
        title: 'Mã không hợp lệ',
        description: 'Vui lòng kiểm tra lại mã giảm giá',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = () => {
    setShowQRModal(true);
    setQRTimeLeft(300);
  };

  const handleSimulateSuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setShowQRModal(false);
      navigate('/booking/success', {
        state: {
          ticketCode: `GXY-2024-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          movie,
          seats: selectedSeats,
          total: grandTotal,
          discount,
          promoCode: discount > 0 ? promoCode : null,
        },
      });
      clearBooking();
    }, 1500);
  };

  const handleSimulateFailure = () => {
    setShowQRModal(false);
    navigate('/booking/failed');
  };

  // Redirect if no movie or seats selected
  useEffect(() => {
    if (!selectedMovie || selectedSeats.length === 0) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedMovie, selectedSeats, navigate]);

  if (loading || !movie) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Đang tải thông tin thanh toán...</p>
          </div>
        </main>
      </div>
    );
  }

  const paymentMethods = [
    { value: 'momo', label: 'Ví MoMo', icon: Smartphone, color: 'bg-pink-500' },
    { value: 'atm', label: 'Thẻ ATM nội địa', icon: Building2, color: 'bg-blue-500' },
    { value: 'visa', label: 'Visa / Mastercard', icon: CreditCard, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Thanh Toán</h1>

        <div className="grid lg:grid-cols-[1fr,400px] gap-6">
          {/* Payment Methods */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-lg mb-4">Phương Thức Thanh Toán</h2>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="space-y-3"
              >
                {paymentMethods.map((method) => (
                  <div
                    key={method.value}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      paymentMethod === method.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                  >
                    <RadioGroupItem value={method.value} id={method.value} />
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', method.color)}>
                      <method.icon className="w-5 h-5 text-white" />
                    </div>
                    <Label htmlFor={method.value} className="cursor-pointer font-medium">
                      {method.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Promo Code */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Mã Giảm Giá
              </h2>
              <div className="flex gap-3">
                <Input
                  placeholder="Nhập mã giảm giá"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleApplyPromo} variant="outline">
                  Áp dụng
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Thử mã: <span className="font-mono bg-muted px-1 rounded">SUMMER20</span>
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-20">
            <h2 className="font-bold text-lg mb-4">Chi Tiết Đơn Hàng</h2>

            {/* Movie Info */}
            <div className="flex gap-4 pb-4 mb-4 border-b border-border">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-16 h-24 object-cover rounded-lg"
              />
              <div>
                <p className="font-semibold">{movie.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ghế: {selectedSeats.map(s => s.id).join(', ')}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vé ({selectedSeats.length})</span>
                <span>{ticketTotal.toLocaleString('vi-VN')}đ</span>
              </div>
              {concessionTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Combo & Bắp nước</span>
                  <span>{concessionTotal.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({promoCode})</span>
                  <span>-{discount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Tổng thanh toán</span>
                <span className="text-primary">{grandTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Tiến Hành Thanh Toán
            </Button>
          </div>
        </div>
      </main>

      {/* QR Payment Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Quét Mã QR Để Thanh Toán</DialogTitle>
              <div className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-full font-mono text-sm font-bold',
                qrTimeLeft <= 60 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              )}>
                <Clock className="w-4 h-4" />
                {formatTime(qrTimeLeft)}
              </div>
            </div>
            <DialogDescription>
              Mở ứng dụng {paymentMethod.toUpperCase()} và quét mã bên dưới
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            {/* Simulated QR Code */}
            <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-lg mb-4">
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
                <QrCode className="w-24 h-24 text-white" />
              </div>
            </div>

            <p className="text-lg font-bold text-primary">
              {grandTotal.toLocaleString('vi-VN')}đ
            </p>
            <p className="text-sm text-muted-foreground">
              Galaxy Cinema - {movie.title}
            </p>
          </div>

          {/* Simulation Buttons */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Demo: Mô phỏng kết quả thanh toán
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSimulateSuccess}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <span className="animate-pulse">Đang xử lý...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Thành công
                  </>
                )}
              </Button>
              <Button
                onClick={handleSimulateFailure}
                variant="destructive"
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-2" />
                Thất bại
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentPage;
