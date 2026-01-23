import React from "react";
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  XCircle,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const StaffScanner: React.FC = () => {
  const [scanResult, setScanResult] = React.useState<
    "idle" | "valid" | "warning" | "invalid"
  >("idle");

  const simulateScan = (result: "valid" | "warning" | "invalid") => {
    setScanResult(result);
    if (result !== "warning") {
      setTimeout(() => setScanResult("idle"), 3000);
    }
  };

  const handleApprove = () => {
    setScanResult("valid");
    setTimeout(() => setScanResult("idle"), 2000);
  };

  const handleReject = () => {
    setScanResult("invalid");
    setTimeout(() => setScanResult("idle"), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Scanner View */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-square bg-gray-900 flex items-center justify-center">
            {/* Camera Frame */}
            <div className="absolute inset-8 border-2 border-white/50 rounded-xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>

            {/* Scan Line Animation */}
            <div className="absolute inset-8 overflow-hidden rounded-xl">
              <div
                className="absolute left-0 right-0 h-0.5 bg-primary animate-bounce"
                style={{ animationDuration: "2s" }}
              />
            </div>

            {/* Result Overlays */}
            {scanResult === "valid" && (
              <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center animate-scale-in">
                <CheckCircle className="w-24 h-24 text-white mb-4" />
                <p className="text-white text-2xl font-bold">VÉ HỢP LỆ</p>
                <p className="text-white/80 mt-2">Ghế: F5, F6 - Phòng 3</p>
              </div>
            )}

            {scanResult === "warning" && (
              <div className="absolute inset-0 bg-yellow-500/90 flex flex-col items-center justify-center animate-scale-in">
                <AlertTriangle className="w-24 h-24 text-white mb-4" />
                <p className="text-white text-2xl font-bold">KIỂM TRA CMND</p>
                <p className="text-white/80 mt-2 text-center px-4">
                  Phim T18 - Yêu cầu xác minh tuổi khách hàng
                </p>
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    size="lg"
                  >
                    Từ Chối
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    Chấp Nhận
                  </Button>
                </div>
              </div>
            )}

            {scanResult === "invalid" && (
              <div className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center animate-scale-in">
                <XCircle className="w-24 h-24 text-white mb-4" />
                <p className="text-white text-2xl font-bold">VÉ KHÔNG HỢP LỆ</p>
                <p className="text-white/80 mt-2">
                  Vé đã được sử dụng hoặc hết hạn
                </p>
              </div>
            )}

            {scanResult === "idle" && (
              <div className="text-center text-white/60">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Đang chờ quét mã...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Demo: Mô phỏng kết quả quét
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <Button
            onClick={() => simulateScan("valid")}
            variant="outline"
            className="flex flex-col gap-1 h-auto py-3 border-green-500 text-green-600 hover:bg-green-50"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-xs">Hợp lệ</span>
          </Button>
          <Button
            onClick={() => simulateScan("warning")}
            variant="outline"
            className="flex flex-col gap-1 h-auto py-3 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs">Kiểm tra tuổi</span>
          </Button>
          <Button
            onClick={() => simulateScan("invalid")}
            variant="outline"
            className="flex flex-col gap-1 h-auto py-3 border-red-500 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-5 h-5" />
            <span className="text-xs">Không hợp lệ</span>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle>Quét Gần Đây</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { code: "GXY-2024-A1B2C3", status: "valid", time: "10:32" },
            { code: "GXY-2024-D4E5F6", status: "valid", time: "10:28" },
            { code: "GXY-2024-G7H8I9", status: "invalid", time: "10:15" },
          ].map((scan, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-mono text-sm">{scan.code}</p>
                  <p className="text-xs text-muted-foreground">{scan.time}</p>
                </div>
              </div>
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  scan.status === "valid" ? "bg-green-500" : "bg-red-500",
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffScanner;
