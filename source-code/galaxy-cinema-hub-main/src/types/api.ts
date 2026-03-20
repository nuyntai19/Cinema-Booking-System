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

export interface CheckTicketResponse {
  ticket: TicketDetail;
  booking?: {
    booking_code?: string;
    ticket_count: number;
    seats: string[];
  };
  message: string;
}

// Concession API Types
export interface Concession {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  isAvailable: boolean;
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
