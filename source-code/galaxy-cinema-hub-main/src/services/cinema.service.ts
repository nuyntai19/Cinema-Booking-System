import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { ApiResponse } from '@/types/api';

export interface Cinema {
    id: number;
    name: string;
    address: string;
    manager_id?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CinemaHall {
    id: number;
    cinema_id: number;
    name: string;
    total_seats: number;
    created_at?: string;
}

export class CinemaService {
    /**
     * Get all cinemas
     */
    static async getAll(): Promise<ApiResponse<Cinema[]>> {
        return apiClient.get<Cinema[]>(API_ENDPOINTS.CINEMAS.ALL);
    }

    /**
     * Get a single cinema by ID
     */
    static async getById(id: number): Promise<ApiResponse<Cinema>> {
        return apiClient.get<Cinema>(API_ENDPOINTS.CINEMAS.BY_ID(id));
    }

    /**
     * Get halls for a cinema
     */
    static async getHalls(cinemaId: number): Promise<ApiResponse<CinemaHall[]>> {
        return apiClient.get<CinemaHall[]>(API_ENDPOINTS.CINEMAS.HALLS(cinemaId));
    }

    /**
     * Get showtimes for a cinema
     */
    static async getShowtimes(cinemaId: number): Promise<ApiResponse<any[]>> {
        return apiClient.get<any[]>(API_ENDPOINTS.CINEMAS.SHOWTIMES(cinemaId));
    }

    /**
     * Create a new cinema (Admin only)
     */
    static async create(cinemaData: Partial<Cinema>): Promise<ApiResponse<Cinema>> {
        return apiClient.post<Cinema>(API_ENDPOINTS.CINEMAS.ALL, cinemaData);
    }

    /**
     * Update a cinema (Admin only)
     */
    static async update(id: number, cinemaData: Partial<Cinema>): Promise<ApiResponse<Cinema>> {
        return apiClient.put<Cinema>(API_ENDPOINTS.CINEMAS.BY_ID(id), cinemaData);
    }

    /**
     * Delete a cinema (Admin only)
     */
    static async delete(id: number): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(API_ENDPOINTS.CINEMAS.BY_ID(id));
    }
}
