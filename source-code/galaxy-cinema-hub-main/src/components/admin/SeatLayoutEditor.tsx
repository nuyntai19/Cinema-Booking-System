import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Armchair, Save, Trash2, Plus, Minus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall } from "@/lib/api";

interface Seat {
    row_code: string;
    number: number;
    seat_type_id: number;
}

interface SeatLayoutEditorProps {
    hallId: number;
    initialSeats?: Seat[];
    onSave?: () => void;
}

const SEAT_TYPES = [
    { id: 1, name: "Standard", color: "bg-blue-500", icon_color: "text-white" },
    { id: 2, name: "VIP", color: "bg-purple-600", icon_color: "text-white" },
    { id: 3, name: "Sweetbox", color: "bg-pink-500", icon_color: "text-white" },
    { id: 0, name: "Lối đi", color: "bg-gray-200", icon_color: "text-gray-400" },
];

const SeatLayoutEditor: React.FC<SeatLayoutEditorProps> = ({
    hallId,
    initialSeats = [],
    onSave,
}) => {
    const { toast } = useToast();
    const [rows, setRows] = useState(8);
    const [cols, setCols] = useState(10);
    const [grid, setGrid] = useState<number[][]>([]);
    const [selectedType, setSelectedType] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize or update grid from initialSeats
    useEffect(() => {
        if (initialSeats.length > 0) {
            // Find max row and col to dimension the grid
            let maxRowIdx = 0;
            let maxCol = 10;

            initialSeats.forEach(s => {
                const rowIdx = s.row_code.charCodeAt(0) - 65;
                if (rowIdx > maxRowIdx) maxRowIdx = rowIdx;
                if (s.number > maxCol) maxCol = s.number;
            });

            const newRows = maxRowIdx + 1;
            const newCols = maxCol;
            setRows(newRows);
            setCols(newCols);

            const newGrid = Array(newRows).fill(0).map(() => Array(newCols).fill(0));
            initialSeats.forEach(s => {
                const r = s.row_code.charCodeAt(0) - 65;
                const c = s.number - 1;
                if (r >= 0 && r < newRows && c >= 0 && c < newCols) {
                    newGrid[r][c] = s.seat_type_id;
                }
            });
            setGrid(newGrid);
        } else {
            setGrid(Array(rows).fill(0).map(() => Array(cols).fill(1)));
        }
    }, [initialSeats]);

    const handleResize = () => {
        const newGrid = Array(rows).fill(0).map((_, r) =>
            Array(cols).fill(0).map((_, c) => (grid[r]?.[c] !== undefined ? grid[r][c] : 1))
        );
        setGrid(newGrid);
    };

    const toggleSeat = (r: number, c: number) => {
        const newGrid = [...grid];
        newGrid[r] = [...newGrid[r]];
        // If clicking on same type, turn into space, else change to selected type
        if (newGrid[r][c] === selectedType) {
            newGrid[r][c] = 0;
        } else {
            newGrid[r][c] = selectedType;
        }
        setGrid(newGrid);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const seats: Seat[] = [];
            grid.forEach((row, rIdx) => {
                row.forEach((typeId, cIdx) => {
                    if (typeId !== 0) {
                        seats.push({
                            row_code: String.fromCharCode(65 + rIdx),
                            number: cIdx + 1,
                            seat_type_id: typeId,
                        });
                    }
                });
            });

            await apiCall(API_ENDPOINTS.HALL_LAYOUT(hallId), {
                method: "POST",
                body: JSON.stringify({ seats }),
            });

            toast({
                title: "Thành công",
                description: "Đã cập nhật sơ đồ ghế",
            });
            if (onSave) onSave();
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể lưu sơ đồ ghế",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-4 bg-muted/30 p-4 rounded-lg">
                <div className="space-y-2">
                    <Label>Số hàng (A, B, C...)</Label>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setRows(Math.max(1, rows - 1))}>
                            <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{rows}</span>
                        <Button variant="outline" size="icon" onClick={() => setRows(rows + 1)}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Số ghế mỗi hàng</Label>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCols(Math.max(1, cols - 1))}>
                            <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{cols}</span>
                        <Button variant="outline" size="icon" onClick={() => setCols(cols + 1)}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <Button onClick={handleResize} variant="secondary">Cập nhật lưới</Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium mr-2">Chọn loại ghế để đặt:</span>
                {SEAT_TYPES.map(type => (
                    <Button
                        key={type.id}
                        variant={selectedType === type.id ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => setSelectedType(type.id)}
                    >
                        <div className={cn("w-4 h-4 rounded-sm border", type.color)} />
                        {type.name}
                    </Button>
                ))}
            </div>

            <Card className="overflow-auto border-2 border-dashed border-muted-foreground/20">
                <CardContent className="p-8">
                    <div className="flex flex-col items-center gap-6 min-w-max">
                        {/* Screen */}
                        <div className="w-full max-w-xl">
                            <div className="h-2 bg-gradient-to-b from-primary/50 to-primary/10 rounded-t-full mb-2" />
                            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">Màn hình</p>
                        </div>

                        {/* Grid */}
                        <div className="space-y-2">
                            {grid.map((row, rIdx) => (
                                <div key={rIdx} className="flex items-center gap-3">
                                    <span className="w-6 text-sm font-bold text-muted-foreground">
                                        {String.fromCharCode(65 + rIdx)}
                                    </span>
                                    <div className="flex gap-2">
                                        {row.map((typeId, cIdx) => {
                                            const type = SEAT_TYPES.find(t => t.id === typeId) || SEAT_TYPES[0];
                                            return (
                                                <div
                                                    key={cIdx}
                                                    onClick={() => toggleSeat(rIdx, cIdx)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-all hover:scale-110",
                                                        type.color,
                                                        type.id === 0 ? "border border-dashed border-gray-300" : "shadow-sm border border-black/10"
                                                    )}
                                                    title={`Ghế ${String.fromCharCode(65 + rIdx)}${cIdx + 1} - ${type.name}`}
                                                >
                                                    {typeId !== 0 ? (
                                                        <Armchair className={cn("w-4 h-4", type.icon_color)} />
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400">{cIdx + 1}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <span className="w-6 text-sm font-bold text-muted-foreground">
                                        {String.fromCharCode(65 + rIdx)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-primary">
                    <Info className="w-4 h-4" />
                    <span>Click vào ghế để đổi loại. Ghế cùng loại với "Chọn loại" sẽ thành lối đi.</span>
                </div>
                <div className="flex gap-3">
                    <div className="text-right mr-4">
                        <p className="text-sm font-medium">Tổng số ghế: {grid.flat().filter(id => id !== 0).length}</p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        <Save className="w-4 h-4" />
                        {isSaving ? "Đang lưu..." : "Lưu sơ đồ"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SeatLayoutEditor;
