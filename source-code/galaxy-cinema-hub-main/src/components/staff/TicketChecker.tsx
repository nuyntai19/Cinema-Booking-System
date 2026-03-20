/**
 * Ticket Checker Component - For Staff to Scan Tickets
 */

import React, { useState } from "react";
import {
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  MapPin,
  Armchair,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TicketService } from "@/services/ticket.service";
import { TicketDetail } from "@/types/api";
import { ApiError } from "@/lib/api-client";

interface TicketCheckerProps {
  onSuccess?: (ticket: TicketDetail) => void;
}

const TicketChecker: React.FC<TicketCheckerProps> = ({ onSuccess }) => {
  const [ticketCode, setTicketCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    ticket?: TicketDetail;
    booking?: {
      booking_code?: string;
      ticket_count: number;
      seats: string[];
    };
    message: string;
  } | null>(null);

  const handleCheck = async () => {
    if (!ticketCode.trim()) {
      setResult({
        success: false,
        message: "Vui lòng nhập mã vé",
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await TicketService.checkTicket({ code: ticketCode });

      if (response.success && response.data) {
        setResult({
          success: true,
          ticket: response.data.ticket,
          booking: response.data.booking,
          message: response.data.message || "Vé hợp lệ - Cho phép vào",
        });

        if (onSuccess) {
          onSuccess(response.data.ticket);
        }

        // Auto clear after 3 seconds
        setTimeout(() => {
          setTicketCode("");
          setResult(null);
        }, 3000);
      }
    } catch (err) {
      const error = err as ApiError;
      setResult({
        success: false,
        message: error.message || "Có lỗi xảy ra khi kiểm tra vé",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCheck();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-6 h-6" />
            Quét Vé Tại Cổng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Section */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Nhập mã vé hoặc quét QR code..."
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-12 text-lg"
              autoFocus
              disabled={loading}
            />
            <Button
              onClick={handleCheck}
              disabled={loading || !ticketCode.trim()}
              className="h-12 px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Kiểm tra
                </>
              )}
            </Button>
          </div>

          {/* Result Section */}
          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className="animate-fade-in"
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <AlertDescription className="text-lg font-semibold">
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Ticket Details */}
          {result?.success && result.ticket && (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 animate-fade-in">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xl text-green-900 dark:text-green-100">
                      {result.ticket.movieTitle}
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {result.ticket.cinemaName}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-600 text-white border-green-700"
                  >
                    VÀO ĐƯỢC
                  </Badge>
                </div>

                {result.booking && (
                  <div className="rounded-md border border-green-200 dark:border-green-800 px-3 py-2 text-sm text-green-900 dark:text-green-100">
                    <p>
                      <span className="font-semibold">Mã booking:</span>{" "}
                      {result.booking.booking_code || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Số vé:</span>{" "}
                      {result.booking.ticket_count}
                    </p>
                    {Array.isArray(result.booking.seats) &&
                      result.booking.seats.length > 0 && (
                        <p>
                          <span className="font-semibold">Ghế:</span>{" "}
                          {result.booking.seats.join(", ")}
                        </p>
                      )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Clock className="w-4 h-4" />
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Giờ chiếu
                      </p>
                      <p className="font-semibold">
                        {new Date(
                          result.ticket.showtimeStart,
                        ).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Armchair className="w-4 h-4" />
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Ghế
                      </p>
                      <p className="font-semibold">
                        {result.ticket.rowNumber}
                        {result.ticket.seatNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <MapPin className="w-4 h-4" />
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Phòng
                      </p>
                      <p className="font-semibold">{result.ticket.roomName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <QrCode className="w-4 h-4" />
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Loại ghế
                      </p>
                      <p className="font-semibold">
                        {result.ticket.seatTypeName}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Details for Invalid Tickets */}
          {result &&
            !result.success &&
            result.message.includes("chưa mở cửa") && (
              <Alert
                variant="default"
                className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
              >
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  Khách hàng đến quá sớm. Vui lòng yêu cầu quay lại sau 30 phút
                  trước giờ chiếu.
                </AlertDescription>
              </Alert>
            )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Hướng dẫn:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Nhập mã vé hoặc quét QR code từ vé điện tử</li>
              <li>
                • Vé hợp lệ sẽ tự động chuyển sang trạng thái "Đã sử dụng"
              </li>
              <li>
                • Khách được vào trước 30 phút và chậm nhất 15 phút sau giờ
                chiếu
              </li>
              <li>• Vé đã sử dụng không thể quét lại</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketChecker;
