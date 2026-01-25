import React from "react";
import { Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CurfewWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAge: number;
  showtimeEnd: string;
  curfewTime: string;
  message: string;
}

const CurfewWarningDialog: React.FC<CurfewWarningDialogProps> = ({
  open,
  onOpenChange,
  userAge,
  showtimeEnd,
  curfewTime,
  message,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="h-6 w-6" />
            <AlertDialogTitle>Cảnh Báo Giờ Giới Nghiêm</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-4">
            <p className="text-base">{message}</p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Độ tuổi của bạn:</span>
                <span className="font-bold">{userAge} tuổi</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Suất chiếu kết thúc lúc:</span>
                <span className="font-bold text-orange-600">{showtimeEnd}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Giờ giới nghiêm:</span>
                <span className="font-bold text-red-600">{curfewTime}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Theo quy định pháp luật Việt Nam, khách hàng dưới 13 tuổi không
              được xem phim kết thúc sau 22:00, và dưới 16 tuổi không được xem
              phim kết thúc sau 23:00.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Đã Hiểu
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CurfewWarningDialog;
