import { useState, useEffect } from "react";
import { useBooking } from "@/contexts/AppContext";
import { systemConfig } from "@/data/mockData";

export function useHoldTimer() {
  const { holdStartedAt, holdPausedAt } = useBooking();
  const duration = systemConfig.seatHoldDuration * 60; // seconds

  const computeTimeLeft = () => {
    if (!holdStartedAt) return duration;
    // If paused, freeze at the moment of pause
    const now = holdPausedAt ?? Date.now();
    const elapsed = Math.floor((now - holdStartedAt) / 1000);
    return Math.max(0, duration - elapsed);
  };

  const [timeLeft, setTimeLeft] = useState(computeTimeLeft);

  useEffect(() => {
    if (!holdStartedAt) {
      setTimeLeft(duration);
      return;
    }

    // Immediately sync
    setTimeLeft(computeTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(computeTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdStartedAt, holdPausedAt, duration]);

  return {
    timeLeft,
    isActive: holdStartedAt !== null,
    isExpired: holdStartedAt !== null && timeLeft <= 0,
  };
}

export function formatHoldTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
