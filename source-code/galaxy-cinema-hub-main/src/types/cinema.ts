export type UserRole = "admin" | "staff" | "client" | "manager";

export type AgeRating = "P" | "K" | "T13" | "T16" | "T18" | "C";

export type MembershipTier = "bronze" | "silver" | "gold" | "platinum";

export type SeatType = "standard" | "vip" | "couple";

export type SeatStatus = "available" | "selected" | "held" | "sold" | "maintenance";

export type TicketStatus = "holding" | "sold" | "used" | "refunded";

export type BookingStatus =
  | "pending"
  | "success"
  | "failed"
  | "cancelled"
  | "used"
  | "expired";

export type PaymentMethod = "momo" | "atm" | "visa";

export type LoyaltyHistoryType = "PURCHASE" | "REDEEM" | "EVENT" | "BIRTHDAY";

export type VoucherStatus = "ACTIVE" | "USED" | "EXPIRED";

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
  endTime?: string;
  start_time?: string; // For API compatibility
  hall?: string; // For UI display
  cinema?: string; // For UI display
  hall_name?: string; // For API compatibility
  cinema_name?: string; // For API compatibility
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

export interface Ticket {
  id: string;
  bookingId: string;
  seatId: string;
  price: number;
  ticketCode: string; // QR Unique code
  status: TicketStatus; // HOLDING/SOLD/USED/REFUNDED
  holdExpiresAt?: string; // Thời gian hết hạn giữ (cho status HOLDING)
  createdAt: string;
  usedAt?: string;
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
  description?: string;
  startDate?: string;
  isAutoApply?: boolean; // True for Birthday/System events
}

export interface UserVoucher {
  id: string;
  userId: string;
  promotionId: string;
  code?: string; // Specific code for user if needed
  status: VoucherStatus; // ACTIVE/USED/EXPIRED
  assignedAt: string;
  usedAt?: string;
  expiresAt?: string;
}

export interface LoyaltyHistory {
  id: string;
  userId: string;
  pointsChange: number; // + (Earn) or - (Redeem)
  type: LoyaltyHistoryType; // PURCHASE/REDEEM/EVENT/BIRTHDAY
  description: string;
  bookingId?: string; // Liên kết với booking nếu là PURCHASE
  createdAt: string;
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
