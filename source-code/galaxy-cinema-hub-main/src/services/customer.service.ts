/**
 * Customer API Service (POS - Khách Vãng Lai)
 */

import { apiClient, ApiResponse } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import {
  POSCustomer,
  LookupOrCreateCustomerRequest,
  LookupOrCreateCustomerResponse,
  GuestCustomerStats,
  POSCustomerBookingHistoryItem,
} from "@/types/api";

export class CustomerService {
  /**
   * Lookup or create guest customer by phone
   * If phone exists, returns existing customer
   * If not, creates new customer entry
   *
   * @param phone - Customer phone number (required, e.g., "0908765432")
   * @param name - Customer name (optional)
   * @returns POSCustomer object with id, phone, name, guest_customer_code
   */
  static async lookupOrCreate(
    phone: string,
    name?: string,
  ): Promise<ApiResponse<LookupOrCreateCustomerResponse>> {
    const request: LookupOrCreateCustomerRequest = {
      phone: phone.trim(),
      ...(name && { name: name.trim() }),
    };

    return apiClient.post<LookupOrCreateCustomerResponse>(
      API_ENDPOINTS.CUSTOMERS.LOOKUP_OR_CREATE,
      request,
    );
  }

  /**
   * Get customer by phone number
   */
  static async getByPhone(
    phone: string,
  ): Promise<ApiResponse<{ customer: POSCustomer | null }>> {
    return apiClient.get<{ customer: POSCustomer | null }>(
      API_ENDPOINTS.CUSTOMERS.BY_PHONE(phone),
    );
  }

  /**
   * Get customer by ID
   */
  static async getById(
    id: number,
  ): Promise<ApiResponse<{ customer: POSCustomer }>> {
    return apiClient.get<{ customer: POSCustomer }>(
      API_ENDPOINTS.CUSTOMERS.DETAIL(id.toString()),
    );
  }

  /**
   * Get POS customer statistics
   */
  static async getStats(): Promise<ApiResponse<{ stats: GuestCustomerStats }>> {
    return apiClient.get<{ stats: GuestCustomerStats }>(
      API_ENDPOINTS.CUSTOMERS.STATS,
    );
  }

  /**
   * Get booking history of a POS guest customer
   */
  static async getBookingHistory(
    customerId: number,
    limit = 20,
  ): Promise<
    ApiResponse<{ bookings: POSCustomerBookingHistoryItem[]; total: number }>
  > {
    return apiClient.get<{
      bookings: POSCustomerBookingHistoryItem[];
      total: number;
    }>(
      `${API_ENDPOINTS.CUSTOMERS.BOOKING_HISTORY(customerId.toString())}?limit=${limit}`,
    );
  }
}
