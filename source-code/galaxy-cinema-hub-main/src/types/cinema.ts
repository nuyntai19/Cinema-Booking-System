export type UserRole = "admin" | "staff" | "client" | "manager";

export type AgeRating = "P" | "K" | "T13" | "T16" | "T18" | "C";

export type MembershipTier = "bronze" | "silver" | "gold" | "platinum";

export type SeatType = "standard" | "vip" | "couple";

export type SeatStatus = "available" | "selected" | "held" | "sold";

export type BookingStatus =
  | "pending"
  | "success"
  | "failed"
  | "cancelled"
  | "used"
  | "expired";

export type PaymentMethod = "momo" | "atm" | "visa";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  dob?: string;
  avatar?: string;
  membershipTier?: MembershipTier;
  loyaltyPoints?: number;
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
  origin: "VN" | "INT";
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
  features: ("IMAX" | "4DX" | "Standard")[];
  rooms: Room[];
}

export interface Room {
  id: string;
  name: string;
  cinemaId: string;
  type: "Standard" | "IMAX" | "4DX";
  capacity: number;
  rows: number;
  seatsPerRow: number;
  seatMap: Seat[][];
  cleanupDuration?: number; // Thời gian dọn phòng (phút)
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
  endTime?: string; // Thời gian kết thúc suất chiếu
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
  expiresAt?: string; // Thời gian hết hạn giữ ghế
  qrCode?: string;
  loyaltyPointsEarned?: number; // Điểm tích lũy nhận được
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
  type: "percent" | "fixed";
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
  status: "success" | "pending" | "failed" | "refunded";
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

export interface SystemConfig {
  id: string;
  curfewTimeU13: string; // Giờ giới nghiêm cho dưới 13 tuổi (HH:mm)
  curfewTimeU16: string; // Giờ giới nghiêm cho dưới 16 tuổi (HH:mm)
  minVietnameseQuota: number; // Tỷ lệ phim Việt tối thiểu (%)
  seatHoldDuration: number; // Thời gian giữ ghế (phút)
  defaultCleanupDuration: number; // Thời gian dọn phòng mặc định (phút)
  loyaltyPointsRate: number; // Tỷ lệ quy đổi: amount -> points (VD: 10000 = 1 point)
  membershipTiers: {
    bronze: { minSpent: number; discount: number };
    silver: { minSpent: number; discount: number };
    gold: { minSpent: number; discount: number };
    platinum: { minSpent: number; discount: number };
  };
}

export interface ScheduleConflict {
  hasConflict: boolean;
  conflictingShowtime?: {
    id: string;
    movieTitle: string;
    startTime: string;
    endTime: string;
  };
}

export interface QuotaCheck {
  isValid: boolean;
  currentPercent: number;
  requiredPercent: number;
  warning?: string;
}

export interface AgeValidation {
  isValid: boolean;
  userAge: number;
  requiredAge: number;
  message?: string;
}

export interface CurfewValidation {
  isValid: boolean;
  userAge: number;
  showtimeEnd: string;
  curfewTime: string;
  message?: string;
}
