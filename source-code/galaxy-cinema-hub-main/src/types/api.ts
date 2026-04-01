/**
 * API Response Types
 */

import { Ticket, ConcessionItem } from "./cinema";

// Ticket API Types
export interface TicketDetail extends Ticket {
  seatNumber: string;
  rowNumber: string;
  seatTypeName: string;
  seatTypePrice: number;
  showtimeStart: string;
  showtimeEnd: string;
  movieTitle: string;
  movieDuration: number;
  roomName: string;
  cinemaName: string;
  cinemaAddress?: string;
  userEmail?: string;
}

export interface CheckTicketRequest {
  code: string;
}

export interface TicketScanUser {
  user_id?: number | null;
  user_email?: string | null;
  user_full_name?: string | null;
  user_phone?: string | null;
  user_avatar?: string | null;
}

export interface TicketGateValidation {
  can_approve?: boolean;
  scan_state?: "ALLOW_ENTRY" | "TOO_EARLY" | "EXPIRED";
  message?: string;
  showtime_start?: string;
  showtime_end?: string | null;
  can_enter_at?: string;
  server_time?: string;
  approved?: boolean;
  approved_at?: string;
}

export interface CheckTicketResponse {
  ticket: TicketDetail;
  booking?: {
    booking_code?: string;
    ticket_count: number;
    seats: string[];
  };
  user?: TicketScanUser;
  gate?: TicketGateValidation;
  code?: string;
  message: string;
}

export interface ApproveEntryRequest {
  code: string;
}

export interface TicketScanHistoryItem {
  id: number;
  booking_id: number;
  booking_code: string;
  ticket_code_input: string;
  scanned_by_user_id?: number | null;
  scanned_by_email?: string | null;
  scan_result: string;
  note?: string | null;
  scanned_at: string;
  movie_title?: string;
  showtime_start?: string;
  showtime_end?: string;
}

export interface TicketScanHistoryResponse {
  items: TicketScanHistoryItem[];
  limit: number;
  offset: number;
}

// Concession API Types
export interface Concession {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  imageUrl?: string;
  category?: string;
  isAvailable?: boolean;
  is_available?: boolean | number;
  createdAt: string;
}

export interface CreateConcessionRequest {
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface UpdateConcessionRequest {
  name?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

// Booking Concession Types
export interface BookingConcession {
  id: string;
  bookingId: string;
  concessionId: string;
  concessionName: string;
  category?: string;
  imageUrl?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface AddConcessionToBookingRequest {
  bookingId: string;
  items: Array<{
    concessionId: string;
    quantity: number;
  }>;
}

// POS Customer Types (Khách Vãng Lai)
export interface POSCustomer {
  id: number;
  phone: string;
  name?: string;
  guest_customer_code: string;
  total_bookings: number;
  first_visit_date?: string;
  created_by_staff_id?: number | null;
  has_account?: boolean;
  linked_user_id?: number | null;
  linked_user_email?: string | null;
  linked_user_full_name?: string | null;
}

export interface LookupOrCreateCustomerRequest {
  phone: string;
  name?: string;
}

export interface LookupOrCreateCustomerResponse {
  customer: POSCustomer;
  is_new: boolean;
  message: string;
}

export interface GuestCustomerStats {
  total_customers: number;
  total_pos_bookings: number;
  latest_visit?: string;
}

export interface POSCustomerBookingHistoryItem {
  id: number;
  booking_code: string;
  status: string;
  payment_status?: string;
  movie_title: string;
  cinema_name: string;
  hall_name: string;
  start_time: string;
  seats?: string;
  final_price: number;
  created_at: string;
}
