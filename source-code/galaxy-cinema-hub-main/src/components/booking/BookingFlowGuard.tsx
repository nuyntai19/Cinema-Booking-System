import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth, useBooking } from "@/contexts/AppContext";
import { BookingService } from "@/services/booking.service";

const isBookingPath = (path: string) => path.startsWith("/booking");
// Do NOT cancel pending booking when leaving from the success or failed page
// (backend has already handled the booking status at that point)
const isBookingTerminalPath = (path: string) =>
  path === "/booking/success" || path === "/booking/failed";

const BookingFlowGuard: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { selectedShowtime, clearBooking } = useBooking();
  const previousPathRef = useRef(location.pathname);
  const isCancellingRef = useRef(false);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const currentPath = location.pathname;
    previousPathRef.current = currentPath;

    const hasLeftBookingFlow =
      isBookingPath(previousPath) &&
      !isBookingPath(currentPath) &&
      !isBookingTerminalPath(previousPath);

    if (!hasLeftBookingFlow || isCancellingRef.current) {
      return;
    }

    const userId = user?.id;
    const showtimeId = selectedShowtime?.id;

    if (!userId || !showtimeId) {
      clearBooking();
      return;
    }

    isCancellingRef.current = true;

    const releasePendingBooking = async () => {
      try {
        const existing = await BookingService.getBookingByUserAndShowtime(
          userId,
          showtimeId,
        );

        if (existing.success && existing.data?.status === "Pending") {
          await BookingService.cancel(String(existing.data.id));
        }
      } catch (error) {
        console.error("Failed to release pending booking on flow exit:", error);
      } finally {
        clearBooking();
        isCancellingRef.current = false;
      }
    };

    void releasePendingBooking();
  }, [location.pathname, user?.id, selectedShowtime?.id, clearBooking]);

  return null;
};

export default BookingFlowGuard;
