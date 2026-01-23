import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminSettings: React.FC = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Đã lưu cấu hình',
      description: 'Các thay đổi đã được áp dụng thành công',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cấu Hình Hệ Thống</h1>
        <p className="text-muted-foreground">Điều chỉnh các thông số hoạt động của hệ thống</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Booking Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cấu Hình Đặt Vé</CardTitle>
            <CardDescription>Các thông số liên quan đến quy trình đặt vé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="seatHold">Thời gian giữ ghế (giây)</Label>
              <Input id="seatHold" type="number" defaultValue="600" />
              <p className="text-xs text-muted-foreground">
                Thời gian tối đa người dùng có thể giữ ghế trước khi thanh toán
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentTimeout">Thời gian thanh toán QR (giây)</Label>
              <Input id="paymentTimeout" type="number" defaultValue="300" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cancelLimit">Giới hạn hủy vé (lần/ngày)</Label>
              <Input id="cancelLimit" type="number" defaultValue="3" />
            </div>
          </CardContent>
        </Card>

        {/* Cinema Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cấu Hình Rạp</CardTitle>
            <CardDescription>Thông số vận hành rạp chiếu phim</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="cleanupTime">Thời gian dọn phòng (phút)</Label>
              <Input id="cleanupTime" type="number" defaultValue="15" />
              <p className="text-xs text-muted-foreground">
                Khoảng thời gian giữa 2 suất chiếu để vệ sinh phòng
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vnRatio">Tỷ lệ phim Việt tối thiểu (%)</Label>
              <Input id="vnRatio" type="number" defaultValue="15" />
              <p className="text-xs text-muted-foreground">
                Theo quy định của Bộ VH-TT-DL
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Price Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cấu Hình Giá Vé</CardTitle>
            <CardDescription>Giá vé mặc định cho các loại ghế</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priceStandard">Ghế thường (VND)</Label>
                <Input id="priceStandard" type="number" defaultValue="90000" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceVIP">Ghế VIP (VND)</Label>
                <Input id="priceVIP" type="number" defaultValue="120000" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceCouple">Ghế Couple (VND)</Label>
                <Input id="priceCouple" type="number" defaultValue="200000" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          Lưu Thay Đổi
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
