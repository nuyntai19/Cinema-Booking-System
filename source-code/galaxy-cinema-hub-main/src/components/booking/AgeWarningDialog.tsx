import React from "react";
import { AlertTriangle } from "lucide-react";
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

interface AgeWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAge: number;
  requiredAge: number;
  message: string;
}

const AgeWarningDialog: React.FC<AgeWarningDialogProps> = ({
  open,
  onOpenChange,
  userAge,
  requiredAge,
  message,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <AlertDialogTitle>Cảnh Báo Độ Tuổi</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-4">
            <p className="text-base">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Độ tuổi của bạn:</span>
                <span className="font-bold">{userAge} tuổi</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Độ tuổi yêu cầu:</span>
                <span className="font-bold text-red-600">
                  {requiredAge}+ tuổi
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Vui lòng chọn phim phù hợp với độ tuổi của bạn theo quy định pháp
              luật Việt Nam về phân loại phim.
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

export default AgeWarningDialog;
