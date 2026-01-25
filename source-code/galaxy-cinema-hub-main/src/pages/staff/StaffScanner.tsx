import React from "react";
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  XCircle,
  QrCode,
  Shield,
  User,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatAgeRating,
  getAgeRatingColor,
  calculateAge,
} from "@/lib/validation";
import { AgeRating } from "@/types/cinema";

const StaffScanner: React.FC = () => {
  const [scanResult, setScanResult] = React.useState<
    "idle" | "valid" | "warning" | "invalid"
  >("idle");

  // Mock scan data - in real app, this would come from QR code scan
  const [scannedTicket, setScannedTicket] = React.useState<{
    movieTitle: string;
    ageRating: AgeRating;
    customerDOB?: string;
    customerName?: string;
    seatNumbers: string[];
    roomNumber: number;
  } | null>(null);

  const simulateScan = (result: "valid" | "warning" | "invalid") => {
    setScanResult(result);

    // Set mock ticket data based on scan type
    if (result === "warning") {
      setScannedTicket({
        movieTitle: "John Wick 4",
        ageRating: "T18",
        customerDOB: "2010-05-15", // 14 years old - requires ID check
        customerName: "Nguyễn Văn A",
        seatNumbers: ["F5", "F6"],
        roomNumber: 3,
      });
    } else if (result === "valid") {
      setScannedTicket({
        movieTitle: "Doraemon: Nobita và Vùng Đất Lý Tưởng",
        ageRating: "P",
        customerName: "Trần Thị B",
        seatNumbers: ["C3"],
        roomNumber: 2,
      });
    }

    if (result !== "warning") {
      setTimeout(() => {
        setScanResult("idle");
        setScannedTicket(null);
      }, 3000);
    }
  };

  const handleApprove = () => {
    setScanResult("valid");
    setTimeout(() => {
      setScanResult("idle");
      setScannedTicket(null);
    }, 2000);
  };

  const handleReject = () => {
    setScanResult("invalid");
    setTimeout(() => {
      setScanResult("idle");
      setScannedTicket(null);
    }, 2000);
  };

  // Calculate customer age if DOB is provided
  const customerAge = scannedTicket?.customerDOB
    ? calculateAge(scannedTicket.customerDOB)
    : null;

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
            {scanResult === "valid" && scannedTicket && (
              <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center animate-scale-in p-6">
                <CheckCircle className="w-24 h-24 text-white mb-4" />
                <p className="text-white text-2xl font-bold mb-2">VÉ HỢP LỆ</p>

                <div className="bg-white/20 rounded-lg p-4 mt-3 space-y-2 text-white">
                  <div className="flex items-center gap-2 justify-center">
                    <Film className="w-4 h-4" />
                    <p className="font-semibold">{scannedTicket.movieTitle}</p>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Badge
                      className={cn(
                        "text-xs",
                        getAgeRatingColor(scannedTicket.ageRating),
                      )}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {formatAgeRating(scannedTicket.ageRating)}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    Ghế: {scannedTicket.seatNumbers.join(", ")} - Phòng{" "}
                    {scannedTicket.roomNumber}
                  </p>
                  {scannedTicket.customerName && (
                    <div className="flex items-center gap-2 justify-center pt-2 border-t border-white/30">
                      <User className="w-4 h-4" />
                      <p className="text-sm">{scannedTicket.customerName}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {scanResult === "warning" && scannedTicket && (
              <div className="absolute inset-0 bg-yellow-500/90 flex flex-col items-center justify-center animate-scale-in p-6">
                <AlertTriangle className="w-24 h-24 text-white mb-4" />
                <p className="text-white text-2xl font-bold mb-2">
                  KIỂM TRA CMND/CCCD
                </p>

                <div className="bg-white/20 rounded-lg p-4 mt-3 space-y-3 text-white max-w-md">
                  <div className="flex items-center gap-2 justify-center">
                    <Film className="w-4 h-4" />
                    <p className="font-semibold">{scannedTicket.movieTitle}</p>
                  </div>

                  <div className="flex items-center gap-2 justify-center">
                    <Badge className="bg-red-600 text-white hover:bg-red-700">
                      <Shield className="w-3 h-3 mr-1" />
                      {formatAgeRating(scannedTicket.ageRating)}
                    </Badge>
                    <span className="text-sm font-medium">
                      Yêu cầu kiểm tra độ tuổi
                    </span>
                  </div>

                  {customerAge !== null && (
                    <div className="pt-2 border-t border-white/30 space-y-1">
                      <div className="flex items-center gap-2 justify-center">
                        <User className="w-4 h-4" />
                        <p className="text-sm">{scannedTicket.customerName}</p>
                      </div>
                      <p className="text-sm text-center">
                        Tuổi hiện tại:{" "}
                        <span className="font-bold">{customerAge} tuổi</span>
                      </p>
                      <p className="text-xs text-center text-white/80">
                        Vui lòng kiểm tra CMND/CCCD để xác nhận độ tuổi
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-center pt-2 border-t border-white/30">
                    Ghế: {scannedTicket.seatNumbers.join(", ")} - Phòng{" "}
                    {scannedTicket.roomNumber}
                  </p>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    size="lg"
                    className="min-w-[120px]"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Từ Chối
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                    size="lg"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Xác Nhận OK
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
            {
              code: "GXY-2024-A1B2C3",
              status: "valid",
              time: "10:32",
              movie: "Doraemon",
              ageRating: "P" as AgeRating,
            },
            {
              code: "GXY-2024-D4E5F6",
              status: "valid",
              time: "10:28",
              movie: "Avatar 3",
              ageRating: "T13" as AgeRating,
            },
            {
              code: "GXY-2024-G7H8I9",
              status: "invalid",
              time: "10:15",
              movie: "John Wick 4",
              ageRating: "T18" as AgeRating,
            },
          ].map((scan, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <QrCode className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{scan.code}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        getAgeRatingColor(scan.ageRating),
                      )}
                    >
                      {formatAgeRating(scan.ageRating)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {scan.time} • {scan.movie}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "w-3 h-3 rounded-full flex-shrink-0",
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
