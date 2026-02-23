/**
 * Booking API Service
 */

import {
  apiClient,
  ApiResponse,
  PaginatedData,
  PaginatedResponse,
} from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";

export interface BookingDetailResponse {
  id: string;
  booking_code: string;
  user_id: number;
  showtime_id: number;
  status: "Pending" | "Paid" | "Cancelled" | "Refunded";
  total_price: number;
  created_at: string;

  // Showtime details
  movie_id: number;
  movie_title: string;
  movie_poster?: string;
  movie_duration: number;
  movie_age_rating?: string;
  showtime_date: string;
  showtime_start_time: string;
  cinema_name: string;
  hall_name: string;

  // Seats
  seats: Array<{
    id: number;
    seat_code: string;
    row_number: string;
    seat_number: number;
    seat_type: string;
    price: number;
  }>;

  // Concessions (optional)
  concessions?: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;

  // Payment info
  payment_method?: string;
  paid_at?: string;
}

export interface CreateBookingRequest {
  user_id: number;
  showtime_id: number;
  seat_ids: number[];
  concessions?: Array<{
    concession_id: number;
    quantity: number;
  }>;
  user_voucher_id?: number;
}

export class BookingService {
  /**
   * Get all bookings (Admin/Manager only)
   */
  static async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<BookingDetailResponse[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    const url = `${API_ENDPOINTS.BOOKINGS.LIST}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
    return apiClient.get<PaginatedData<BookingDetailResponse[]>>(
      url,
    ) as Promise<PaginatedResponse<BookingDetailResponse[]>>;
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(
    userId: string | number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<BookingDetailResponse[]>> {
    const url = `${API_ENDPOINTS.BOOKINGS.USER_BOOKINGS(userId.toString())}?page=${page}&limit=${limit}`;
    return apiClient.get<PaginatedData<BookingDetailResponse[]>>(
      url,
    ) as Promise<PaginatedResponse<BookingDetailResponse[]>>;
  }

  /**
   * Get booking details by ID
   */
  static async getById(
    id: string,
  ): Promise<ApiResponse<BookingDetailResponse>> {
    return apiClient.get<BookingDetailResponse>(
      API_ENDPOINTS.BOOKINGS.DETAIL(id),
    );
  }

  /**
   * Create a new booking
   */
  static async create(
    data: CreateBookingRequest,
  ): Promise<ApiResponse<BookingDetailResponse>> {
    return apiClient.post<BookingDetailResponse>(
      API_ENDPOINTS.BOOKINGS.CREATE,
      data,
    );
  }

  /**
   * Confirm booking (after payment)
   */
  static async confirm(
    id: string,
  ): Promise<ApiResponse<{ booking_id: string }>> {
    return apiClient.put<{ booking_id: string }>(
      API_ENDPOINTS.BOOKINGS.CONFIRM(id),
      {},
    );
  }

  /**
   * Cancel booking
   */
  static async cancel(
    id: string,
  ): Promise<ApiResponse<{ booking_id: string }>> {
    return apiClient.put<{ booking_id: string }>(
      API_ENDPOINTS.BOOKINGS.CANCEL(id),
      {},
    );
  }
}
