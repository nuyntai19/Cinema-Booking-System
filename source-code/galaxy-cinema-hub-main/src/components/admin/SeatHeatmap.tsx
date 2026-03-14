import React from "react";
import { cn } from "@/lib/utils";
import { Armchair } from "lucide-react";

interface SeatHeatmapProps {
  className?: string;
  items: HeatmapSeat[];
  stats?: {
    max_booking_count?: number;
    zero_booking_seats?: number;
    average_booking_count?: number;
  };
}

interface HeatmapSeat {
  row: string;
  number: number;
  booking_count: number;
}

const SeatHeatmap: React.FC<SeatHeatmapProps> = ({
  className,
  items,
  stats,
}) => {
  const heatmapData = React.useMemo(() => {
    const merged = new Map<string, HeatmapSeat>();

    (items || []).forEach((seat) => {
      const key = `${seat.row}-${seat.number}`;
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, { ...seat });
        return;
      }

      existing.booking_count += seat.booking_count;
    });

    return Array.from(merged.values()).sort((a, b) => {
      if (a.row === b.row) return a.number - b.number;
      return a.row.localeCompare(b.row);
    });
  }, [items]);

  if (heatmapData.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Chưa có dữ liệu ghế trong 7 ngày gần đây.
      </div>
    );
  }

  // Calculate max booking count for color scaling
  const maxBookings = Math.max(...heatmapData.map((s) => s.booking_count), 1);

  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-gray-100 border-gray-200";

    const intensity = count / maxBookings;

    if (intensity < 0.2) return "bg-blue-100 border-blue-200";
    if (intensity < 0.4) return "bg-green-100 border-green-300";
    if (intensity < 0.6) return "bg-yellow-100 border-yellow-300";
    if (intensity < 0.8) return "bg-orange-200 border-orange-400";
    return "bg-red-300 border-red-500";
  };

  const getHeatLabel = (count: number) => {
    if (count === 0) return "Chưa đặt";

    const intensity = count / maxBookings;

    if (intensity < 0.2) return "Ít";
    if (intensity < 0.4) return "Khá ít";
    if (intensity < 0.6) return "Trung bình";
    if (intensity < 0.8) return "Phổ biến";
    return "Rất phổ biến";
  };

  // Group seats by row
  const seatsByRow: Record<string, HeatmapSeat[]> = {};
  heatmapData.forEach((seat) => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat);
  });

  const maxBookingCount = stats?.max_booking_count ?? maxBookings;
  const zeroBookingSeats =
    stats?.zero_booking_seats ??
    heatmapData.filter((s) => s.booking_count === 0).length;
  const averageBookingCount =
    stats?.average_booking_count ??
    heatmapData.reduce((sum, s) => sum + s.booking_count, 0) /
      heatmapData.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium">Mức độ phổ biến:</span>
        {[
          { label: "Chưa đặt", color: "bg-gray-100 border-gray-200" },
          { label: "Ít", color: "bg-blue-100 border-blue-200" },
          { label: "Khá ít", color: "bg-green-100 border-green-300" },
          { label: "Trung bình", color: "bg-yellow-100 border-yellow-300" },
          { label: "Phổ biến", color: "bg-orange-200 border-orange-400" },
          { label: "Rất phổ biến", color: "bg-red-300 border-red-500" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={cn("w-3 h-3 rounded border", color)} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Screen */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-full max-w-3xl h-2 bg-gradient-to-b from-gray-400 to-gray-200 rounded-t-full" />
        <p className="text-xs text-muted-foreground">Màn hình</p>
      </div>

      {/* Seat Map */}
      <div className="space-y-2">
        {Object.entries(seatsByRow).map(([row, seats]) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-6 text-sm font-medium text-muted-foreground">
              {row}
            </span>
            <div className="flex gap-1.5 flex-1 justify-center">
              {seats.map((seat) => (
                <div
                  key={`${row}-${seat.number}`}
                  className={cn(
                    "relative w-7 h-7 rounded border flex items-center justify-center text-[10px] font-medium cursor-pointer transition-all hover:scale-110 group",
                    getHeatColor(seat.booking_count),
                  )}
                  title={`Ghế ${seat.row}${seat.number}: ${seat.booking_count} lượt đặt - ${getHeatLabel(seat.booking_count)}`}
                >
                  <Armchair className="w-3 h-3 opacity-40" />

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {seat.row}
                    {seat.number}: {seat.booking_count} lượt
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{maxBookingCount}</p>
          <p className="text-xs text-muted-foreground">Ghế phổ biến nhất</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{zeroBookingSeats}</p>
          <p className="text-xs text-muted-foreground">Ghế chưa đặt lần nào</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {averageBookingCount.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">Trung bình/ghế</p>
        </div>
      </div>
    </div>
  );
};

export default SeatHeatmap;
