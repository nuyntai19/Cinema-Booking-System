import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { ApiResponse } from '@/types/api';

export interface Showtime {
    id: number;
    movie_id: number;
    cinema_hall_id: number;
    start_time: string;
    end_time: string;
    created_at?: string;
    movie_title?: string;
    cinema_name?: string;
    hall_name?: string;
}

export interface Seat {
    id: number;
    cinema_hall_id: number;
    row_code: string;
    number: number;
    seat_type_id: number;
    status: 'Active' | 'Maintenance' | 'Removed';
    is_available?: boolean;
    seat_type_name?: string;
    price_multiplier?: number;
}

export class ShowtimeService {
    /**
     * Get all showtimes
     */
    static async getAll(): Promise<ApiResponse<Showtime[]>> {
        return apiClient.get<Showtime[]>(API_ENDPOINTS.SHOWTIMES.ALL);
    }

    /**
     * Get a single showtime by ID
     */
    static async getById(id: number): Promise<ApiResponse<Showtime>> {
        return apiClient.get<Showtime>(API_ENDPOINTS.SHOWTIMES.BY_ID(id));
    }

    /**
     * Get available seats for a showtime
     */
    static async getAvailableSeats(showtimeId: number): Promise<ApiResponse<Seat[]>> {
        return apiClient.get<Seat[]>(API_ENDPOINTS.SHOWTIMES.SEATS(showtimeId));
    }

    /**
     * Get seat map for a showtime
     */
    static async getSeatMap(showtimeId: number): Promise<ApiResponse<any>> {
        return apiClient.get<any>(API_ENDPOINTS.SHOWTIMES.SEAT_MAP(showtimeId));
    }

    /**
     * Create a new showtime (Manager only)
     */
    static async create(showtimeData: Partial<Showtime>): Promise<ApiResponse<Showtime>> {
        return apiClient.post<Showtime>(API_ENDPOINTS.SHOWTIMES.ALL, showtimeData);
    }

    /**
     * Update a showtime (Manager only)
     */
    static async update(id: number, showtimeData: Partial<Showtime>): Promise<ApiResponse<Showtime>> {
        return apiClient.put<Showtime>(API_ENDPOINTS.SHOWTIMES.BY_ID(id), showtimeData);
    }

    /**
     * Delete a showtime (Manager only)
     */
    static async delete(id: number): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(API_ENDPOINTS.SHOWTIMES.BY_ID(id));
    }
}
