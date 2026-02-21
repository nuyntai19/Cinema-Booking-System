/**
 * Concession API Service
 */

import { apiClient, ApiResponse } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { Concession, CreateConcessionRequest, UpdateConcessionRequest } from '@/types/api';

export class ConcessionService {
    /**
     * Get all concessions
     */
    static async getAll(): Promise<ApiResponse<Concession[]>> {
        return apiClient.get<Concession[]>(API_ENDPOINTS.CONCESSIONS.LIST);
    }

    /**
     * Get only available concessions
     */
    static async getAvailable(): Promise<ApiResponse<Concession[]>> {
        return apiClient.get<Concession[]>(API_ENDPOINTS.CONCESSIONS.AVAILABLE);
    }

    /**
     * Get concession details by ID
     */
    static async getById(id: string): Promise<ApiResponse<Concession>> {
        return apiClient.get<Concession>(API_ENDPOINTS.CONCESSIONS.DETAIL(id));
    }

    /**
     * Create a new concession (Manager only)
     */
    static async create(data: CreateConcessionRequest): Promise<ApiResponse<Concession>> {
        return apiClient.post<Concession>(API_ENDPOINTS.CONCESSIONS.CREATE, data);
    }

    /**
     * Update an existing concession (Manager only)
     */
    static async update(id: string, data: UpdateConcessionRequest): Promise<ApiResponse<Concession>> {
        return apiClient.put<Concession>(API_ENDPOINTS.CONCESSIONS.UPDATE(id), data);
    }

    /**
     * Delete a concession (Manager only)
     */
    static async delete(id: string): Promise<ApiResponse<{ id: string }>> {
        return apiClient.delete<{ id: string }>(API_ENDPOINTS.CONCESSIONS.DELETE(id));
    }
}
