import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BookingFailedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md animate-fade-in">
        {/* Error Icon */}
        <div className="w-24 h-24 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-14 h-14 text-destructive" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-foreground mb-3">Thanh Toán Thất Bại</h1>
        <p className="text-muted-foreground mb-8">
          Giao dịch đã bị hủy hoặc quá thời gian thanh toán. Ghế đã được giải phóng để người khác có thể đặt.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link to="/movies">
            <Button className="w-full h-12 bg-primary hover:bg-primary/90">
              <RefreshCw className="w-5 h-5 mr-2" />
              Thử Lại
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full h-12">
              <Home className="w-5 h-5 mr-2" />
              Về Trang Chủ
            </Button>
          </Link>
        </div>

        {/* Help */}
        <p className="text-sm text-muted-foreground mt-8">
          Cần hỗ trợ? Liên hệ hotline: <span className="font-semibold">1900 2224</span>
        </p>
      </div>
    </div>
  );
};

export default BookingFailedPage;
