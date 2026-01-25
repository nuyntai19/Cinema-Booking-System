import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        onExpire();
        return 0;
      }

      return Math.floor(diff / 1000);
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);

      if (left <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isWarning = timeLeft <= 120; // Cảnh báo khi còn 2 phút
  const isCritical = timeLeft <= 60; // Nguy hiểm khi còn 1 phút

  return (
    <Alert
      className={`${isCritical ? "border-red-500 bg-red-50" : isWarning ? "border-yellow-500 bg-yellow-50" : "border-blue-500 bg-blue-50"}`}
    >
      <Clock
        className={`h-4 w-4 ${isCritical ? "text-red-600" : isWarning ? "text-yellow-600" : "text-blue-600"}`}
      />
      <AlertDescription
        className={`flex items-center gap-2 ${isCritical ? "text-red-900" : isWarning ? "text-yellow-900" : "text-blue-900"}`}
      >
        <span className="font-medium">Thời gian giữ ghế:</span>
        <span className="text-xl font-bold tabular-nums">
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </span>
        {isCritical && (
          <span className="ml-2 text-sm animate-pulse">
            Vui lòng thanh toán ngay!
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default CountdownTimer;
