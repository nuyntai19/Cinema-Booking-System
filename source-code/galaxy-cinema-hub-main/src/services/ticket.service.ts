/**
 * Ticket API Service
 */

import { apiClient, ApiResponse } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import {
  TicketDetail,
  CheckTicketRequest,
  CheckTicketResponse,
  ApproveEntryRequest,
  TicketScanHistoryResponse,
} from "@/types/api";

type ScanHistoryFilters = {
  booking_code?: string;
  ticket_code_input?: string;
  scanned_by_email?: string;
  scan_result?: string;
  date_from?: string;
  date_to?: string;
};

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
  static async getByBooking(
    bookingId: string,
  ): Promise<ApiResponse<TicketDetail[]>> {
    return apiClient.get<TicketDetail[]>(
      API_ENDPOINTS.TICKETS.GET_BY_BOOKING(bookingId),
    );
  }

  /**
   * Check/scan ticket at gate (Staff)
   * Validates ticket and updates status to USED
   */
  static async checkTicket(
    request: CheckTicketRequest,
  ): Promise<ApiResponse<CheckTicketResponse>> {
    return apiClient.post<CheckTicketResponse>(
      API_ENDPOINTS.TICKETS.CHECK,
      request,
    );
  }

  /**
   * Approve entry at gate (Staff)
   * Saves scan history and marks ticket status to USED
   */
  static async approveEntry(
    request: ApproveEntryRequest,
  ): Promise<ApiResponse<CheckTicketResponse>> {
    return apiClient.post<CheckTicketResponse>(
      API_ENDPOINTS.TICKETS.APPROVE_ENTRY,
      request,
    );
  }

  /**
   * Get staff ticket scan history
   */
  static async getScanHistory(
    limit = 50,
    offset = 0,
    filters: ScanHistoryFilters = {},
  ): Promise<ApiResponse<TicketScanHistoryResponse>> {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    Object.entries(filters).forEach(([key, value]) => {
      if (value && String(value).trim() !== "") {
        params.set(key, String(value).trim());
      }
    });

    return apiClient.get<TicketScanHistoryResponse>(
      `${API_ENDPOINTS.TICKETS.SCAN_HISTORY}?${params.toString()}`,
    );
  }

  /**
   * Mark ticket as used (Staff)
   */
  static async markAsUsed(
    ticketId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    return apiClient.put<{ id: string }>(
      API_ENDPOINTS.TICKETS.MARK_AS_USED(ticketId),
    );
  }

  /**
   * Refund a ticket
   * Must be at least 2 hours before showtime
   */
  static async refund(
    ticketId: string,
  ): Promise<ApiResponse<{ id: string; refundAmount: number }>> {
    return apiClient.post<{ id: string; refundAmount: number }>(
      API_ENDPOINTS.TICKETS.REFUND(ticketId),
    );
  }

  /**
   * Send ticket email
   */
  static async sendEmail(
    ticketId: string,
  ): Promise<ApiResponse<{ id: string; emailSentTo: string }>> {
    return apiClient.post<{ id: string; emailSentTo: string }>(
      API_ENDPOINTS.TICKETS.SEND_EMAIL(ticketId),
    );
  }
}
