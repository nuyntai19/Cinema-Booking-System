import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { ApiResponse } from '@/types/api';

export interface Booking {
    id: number;
    user_id: number;
    showtime_id: number;
    total_price: number;
    discount_amount: number;
    final_price: number;
    status: 'Pending' | 'Paid' | 'Cancelled' | 'Expired';
    created_at: string;
    updated_at?: string;
    movie_title?: string;
    cinema_name?: string;
    showtime?: string;
}

export interface CreateBookingRequest {
    showtime_id: number;
    seat_ids: number[];
    concession_items?: Array<{
        concession_id: number;
        quantity: number;
    }>;
    promotion_code?: string;
}

export class BookingService {
    /**
     * Get all bookings (Admin only)
     */
    static async getAll(): Promise<ApiResponse<Booking[]>> {
        return apiClient.get<Booking[]>(API_ENDPOINTS.BOOKINGS.ALL);
    }

    /**
     * Get a single booking by ID
     */
    static async getById(id: number): Promise<ApiResponse<Booking>> {
        return apiClient.get<Booking>(API_ENDPOINTS.BOOKINGS.BY_ID(id));
    }

    /**
     * Get bookings for a user
     */
    static async getUserBookings(userId: number): Promise<ApiResponse<Booking[]>> {
        return apiClient.get<Booking[]>(API_ENDPOINTS.BOOKINGS.USER(userId));
    }

    /**
     * Create a new booking (holds seats)
     */
    static async create(bookingData: CreateBookingRequest): Promise<ApiResponse<Booking>> {
        return apiClient.post<Booking>(API_ENDPOINTS.BOOKINGS.ALL, bookingData);
    }

    /**
     * Confirm booking after payment
     */
    static async confirm(bookingId: number, paymentData: any): Promise<ApiResponse<Booking>> {
        return apiClient.put<Booking>(API_ENDPOINTS.BOOKINGS.CONFIRM(bookingId), paymentData);
    }

    /**
     * Cancel a booking
     */
    static async cancel(bookingId: number): Promise<ApiResponse<void>> {
        return apiClient.put<void>(API_ENDPOINTS.BOOKINGS.CANCEL(bookingId), {});
    }
}
