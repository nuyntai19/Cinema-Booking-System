/**
 * Ticket API Service
 */

import { apiClient, ApiResponse } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { TicketDetail, CheckTicketRequest, CheckTicketResponse } from '@/types/api';

export class TicketService {
    /**
     * Get ticket by QR code
     */
    static async getByCode(code: string): Promise<ApiResponse<TicketDetail>> {
        return apiClient.get<TicketDetail>(API_ENDPOINTS.TICKETS.GET_BY_CODE(code));
    }

    /**
     * Get all tickets for a booking
     */
    static async getByBooking(bookingId: string): Promise<ApiResponse<TicketDetail[]>> {
        return apiClient.get<TicketDetail[]>(API_ENDPOINTS.TICKETS.GET_BY_BOOKING(bookingId));
    }

    /**
     * Check/scan ticket at gate (Staff)
     * Validates ticket and updates status to USED
     */
    static async checkTicket(request: CheckTicketRequest): Promise<ApiResponse<CheckTicketResponse>> {
        return apiClient.post<CheckTicketResponse>(API_ENDPOINTS.TICKETS.CHECK, request);
    }

    /**
     * Mark ticket as used (Staff)
     */
    static async markAsUsed(ticketId: string): Promise<ApiResponse<{ id: string }>> {
        return apiClient.put<{ id: string }>(API_ENDPOINTS.TICKETS.MARK_AS_USED(ticketId));
    }

    /**
     * Refund a ticket
     * Must be at least 2 hours before showtime
     */
    static async refund(ticketId: string): Promise<ApiResponse<{ id: string; refundAmount: number }>> {
        return apiClient.post<{ id: string; refundAmount: number }>(
            API_ENDPOINTS.TICKETS.REFUND(ticketId)
        );
    }

    /**
     * Send ticket email
     */
    static async sendEmail(ticketId: string): Promise<ApiResponse<{ id: string; emailSentTo: string }>> {
        return apiClient.post<{ id: string; emailSentTo: string }>(
            API_ENDPOINTS.TICKETS.SEND_EMAIL(ticketId)
        );
    }
}
