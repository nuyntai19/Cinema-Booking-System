import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { ApiResponse } from '@/types/api';

export interface Movie {
    id: number;
    title: string;
    duration_minutes: number;
    age_rating: string;
    origin: string;
    poster_url: string;
    trailer_url: string;
    description: string;
    release_date: string;
    status: 'Now Showing' | 'Coming Soon' | 'Ended';
    created_at?: string;
    updated_at?: string;
}

export interface Showtime {
    id: number;
    movie_id: number;
    cinema_hall_id: number;
    start_time: string;
    end_time: string;
    cinema_name?: string;
    hall_name?: string;
}

export interface Review {
    id: number;
    user_id: number;
    movie_id: number;
    rating: number;
    comment: string;
    created_at: string;
    user_name?: string;
}

export class MovieService {
    /**
     * Get all movies
     */
    static async getAll(): Promise<ApiResponse<Movie[]>> {
        return apiClient.get<Movie[]>(API_ENDPOINTS.MOVIES.ALL);
    }

    /**
     * Get a single movie by ID
     */
    static async getById(id: number): Promise<ApiResponse<Movie>> {
        return apiClient.get<Movie>(API_ENDPOINTS.MOVIES.BY_ID(id));
    }

    /**
     * Get showtimes for a movie
     */
    static async getShowtimes(movieId: number): Promise<ApiResponse<Showtime[]>> {
        return apiClient.get<Showtime[]>(API_ENDPOINTS.MOVIES.SHOWTIMES(movieId));
    }

    /**
     * Get reviews for a movie
     */
    static async getReviews(movieId: number): Promise<ApiResponse<Review[]>> {
        return apiClient.get<Review[]>(API_ENDPOINTS.MOVIES.REVIEWS(movieId));
    }

    /**
     * Create a new movie (Admin only)
     */
    static async create(movieData: Partial<Movie>): Promise<ApiResponse<Movie>> {
        return apiClient.post<Movie>(API_ENDPOINTS.MOVIES.ALL, movieData);
    }

    /**
     * Update a movie (Admin only)
     */
    static async update(id: number, movieData: Partial<Movie>): Promise<ApiResponse<Movie>> {
        return apiClient.put<Movie>(API_ENDPOINTS.MOVIES.BY_ID(id), movieData);
    }

    /**
     * Delete a movie (Admin only)
     */
    static async delete(id: number): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(API_ENDPOINTS.MOVIES.BY_ID(id));
    }
}
