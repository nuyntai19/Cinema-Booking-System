import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { QrCode, Check, Calendar, MapPin, Clock, Download, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BookingSuccessPage: React.FC = () => {
  const location = useLocation();
  const { ticketCode, movie, seats, total, discount, promoCode } = location.state || {};

  if (!ticketCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin vé</h1>
          <Link to="/">
            <Button>Về trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cinema flex items-center justify-center p-4">
      {/* Glassmorphism Container */}
      <div className="w-full max-w-md animate-scale-in">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center glow-success mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Đặt Vé Thành Công!</h1>
          <p className="text-white/70">Vé của bạn đã được xác nhận</p>
        </div>

        {/* E-Ticket Card */}
        <div className="glass-dark rounded-2xl overflow-hidden">
          {/* Movie Banner */}
          <div className="relative h-32">
            <img
              src={movie?.backdrop || movie?.poster}
              alt={movie?.title}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-xl font-bold text-white">{movie?.title}</h2>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-6">
            <div className="bg-white rounded-xl p-4 shadow-2xl">
              <QrCode className="w-32 h-32 text-gray-900" />
            </div>
          </div>

          {/* Ticket Code */}
          <div className="text-center pb-4">
            <p className="text-white/60 text-sm mb-1">Mã vé</p>
            <p className="text-white text-xl font-mono font-bold tracking-wider">{ticketCode}</p>
          </div>

          {/* Valid Badge */}
          <div className="flex justify-center pb-4">
            <span className="px-4 py-1 bg-green-500/20 border border-green-500 text-green-400 rounded-full text-sm font-semibold glow-success">
              ✓ VÉ HỢP LỆ
            </span>
          </div>

          {/* Divider */}
          <div className="relative px-6">
            <div className="border-t border-dashed border-white/20" />
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-cinema rounded-full" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-cinema rounded-full" />
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-white/60 text-xs">Rạp</p>
                <p className="text-white font-medium">Galaxy Nguyễn Du</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-white/60 text-xs">Ngày chiếu</p>
                <p className="text-white font-medium">
                  {new Date().toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-white/60 text-xs">Suất chiếu</p>
                <p className="text-white font-medium">18:30 - Phòng 3</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-xs text-white font-bold">
                {seats?.length}
              </div>
              <div>
                <p className="text-white/60 text-xs">Ghế</p>
                <p className="text-white font-medium">
                  {seats?.map((s: any) => s.id).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="px-6 pb-6">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-primary">
                  {total?.toLocaleString('vi-VN')}đ
                </span>
              </div>
              {discount > 0 && (
                <p className="text-green-400 text-sm mt-1">
                  🎉 Bạn đã tiết kiệm {discount.toLocaleString('vi-VN')}đ với mã {promoCode}!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button className="w-full h-12 bg-white text-secondary hover:bg-white/90 font-semibold">
            <Download className="w-5 h-5 mr-2" />
            Lưu Ảnh Vé
          </Button>
          <Link to="/" className="block">
            <Button variant="outline" className="w-full h-12 border-white/30 text-white hover:bg-white/10">
              <Home className="w-5 h-5 mr-2" />
              Về Trang Chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
