/**
 * Staff Ticket Scanning Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import TicketChecker from '@/components/staff/TicketChecker';
import { TicketDetail } from '@/types/api';

const StaffTicketScanPage: React.FC = () => {
    const navigate = useNavigate();

    const handleTicketScanned = (ticket: TicketDetail) => {
        console.log('Ticket successfully scanned:', ticket);
        // You can add additional logic here, like:
        // - Log to database
        // - Send notification
        // - Update statistics
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Quét Vé Tại Cổng</h1>
                            <p className="text-muted-foreground mt-1">
                                Kiểm tra và xác nhận vé khách hàng
                            </p>
                        </div>
                    </div>

                    {/* Stats - Optional */}
                    <div className="hidden md:flex gap-4">
                        <div className="bg-card border border-border rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-muted-foreground">Đã quét hôm nay</p>
                        </div>
                    </div>
                </div>

                {/* Ticket Checker Component */}
                <TicketChecker onSuccess={handleTicketScanned} />

                {/* Additional Info */}
                <div className="mt-8 max-w-2xl mx-auto">
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                            📋 Hướng dẫn sử dụng
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                            <li className="flex items-start gap-2">
                                <span className="font-bold">1.</span>
                                <span>Yêu cầu khách hàng hiển thị QR code từ email hoặc app</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">2.</span>
                                <span>Nhập mã vé hoặc quét QR code</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">3.</span>
                                <span>Xác nhận thông tin vé trên màn hình</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">4.</span>
                                <span>Nếu vé hợp lệ, khách được vào rạp</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">5.</span>
                                <span>Vé đã quét sẽ tự động chuyển sang trạng thái "Đã sử dụng"</span>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">
                            ⚠️ Lưu ý quan trọng
                        </h3>
                        <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Vé chỉ hợp lệ trong khung giờ: 30 phút trước đến 15 phút sau giờ chiếu</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Vé đã sử dụng không thể quét lại</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Vé chưa thanh toán sẽ bị từ chối</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Kiểm tra tuổi khách hàng với phim có giới hạn độ tuổi</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default StaffTicketScanPage;
