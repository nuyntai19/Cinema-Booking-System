import React from "react";
import { cn } from "@/lib/utils";
import { Armchair } from "lucide-react";

interface SeatHeatmapProps {
  className?: string;
}

interface HeatmapSeat {
  row: string;
  number: number;
  bookingCount: number;
}

const SeatHeatmap: React.FC<SeatHeatmapProps> = ({ className }) => {
  // Mock data: số lần đặt của mỗi ghế trong tuần qua
  // Trong thực tế, data này sẽ được tính từ booking history
  const generateHeatmapData = (): HeatmapSeat[] => {
    const seats: HeatmapSeat[] = [];
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const seatsPerRow = 10;

    // Generate random booking counts (0-20 bookings per seat in past week)
    // Middle rows and center seats typically have higher booking rates
    rows.forEach((row, rowIndex) => {
      for (let i = 1; i <= seatsPerRow; i++) {
        // Center seats (5,6) and middle rows (D,E,F) are most popular
        const isCenter = i >= 4 && i <= 7;
        const isMiddleRow = rowIndex >= 3 && rowIndex <= 5;

        let baseCount = Math.floor(Math.random() * 8);
        if (isCenter) baseCount += 5;
        if (isMiddleRow) baseCount += 4;

        seats.push({
          row,
          number: i,
          bookingCount: Math.min(baseCount, 20),
        });
      }
    });

    return seats;
  };

  const heatmapData = React.useMemo(() => generateHeatmapData(), []);

  // Calculate max booking count for color scaling
  const maxBookings = Math.max(...heatmapData.map((s) => s.bookingCount));

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
                  key={`${seat.row}${seat.number}`}
                  className={cn(
                    "relative w-7 h-7 rounded border flex items-center justify-center text-[10px] font-medium cursor-pointer transition-all hover:scale-110 group",
                    getHeatColor(seat.bookingCount),
                  )}
                  title={`Ghế ${seat.row}${seat.number}: ${seat.bookingCount} lượt đặt - ${getHeatLabel(seat.bookingCount)}`}
                >
                  <Armchair className="w-3 h-3 opacity-40" />

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {seat.row}
                    {seat.number}: {seat.bookingCount} lượt
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
          <p className="text-2xl font-bold text-primary">{maxBookings}</p>
          <p className="text-xs text-muted-foreground">Ghế phổ biến nhất</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {heatmapData.filter((s) => s.bookingCount === 0).length}
          </p>
          <p className="text-xs text-muted-foreground">Ghế chưa đặt lần nào</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {(
              heatmapData.reduce((sum, s) => sum + s.bookingCount, 0) /
              heatmapData.length
            ).toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">Trung bình/ghế</p>
        </div>
      </div>
    </div>
  );
};

export default SeatHeatmap;
