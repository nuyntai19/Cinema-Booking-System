export type UserRole = 'admin' | 'staff' | 'client';

export type AgeRating = 'P' | 'T13' | 'T16' | 'T18' | 'C';

export type SeatType = 'standard' | 'vip' | 'couple';

export type SeatStatus = 'available' | 'selected' | 'held' | 'sold';

export type BookingStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'used' | 'expired';

export type PaymentMethod = 'momo' | 'atm' | 'visa';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  dob?: string;
  avatar?: string;
  rank?: 'silver' | 'gold' | 'platinum';
  totalSpent?: number;
}

export interface Movie {
  id: string;
  title: string;
  titleVi?: string;
  poster: string;
  backdrop?: string;
  duration: number;
  ageRating: AgeRating;
  origin: 'VN' | 'INT';
  genre: string[];
  director: string;
  cast: string[];
  releaseDate: string;
  description: string;
  trailerUrl?: string;
  rating?: number;
  isNowShowing: boolean;
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  hotline: string;
  features: ('IMAX' | '4DX' | 'Standard')[];
  rooms: Room[];
}

export interface Room {
  id: string;
  name: string;
  cinemaId: string;
  type: 'Standard' | 'IMAX' | '4DX';
  capacity: number;
  rows: number;
  seatsPerRow: number;
  seatMap: Seat[][];
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  type: SeatType;
  status: SeatStatus;
  price: number;
}

export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  roomId: string;
  date: string;
  time: string;
  price: {
    standard: number;
    vip: number;
    couple: number;
  };
  availableSeats: number;
  totalSeats: number;
}

export interface Booking {
  id: string;
  ticketCode: string;
  userId: string;
  movieId: string;
  showtimeId: string;
  seats: Seat[];
  concessions: ConcessionItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  promoCode?: string;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  createdAt: string;
  qrCode?: string;
}

export interface ConcessionItem {
  id: string;
  name: string;
  nameVi: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Promo {
  id: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  minAmount: number;
  maxDiscount?: number;
  validUntil: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  promoCode?: string;
  discountAmount?: number;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  movieId: string;
  movieTitle: string;
  rating: number;
  content: string;
  isVerified: boolean;
  isVisible: boolean;
  createdAt: string;
}
