import { M, V } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost/Cinema-Booking-System/backend";

export const API_ENDPOINTS = {
  // Auth
  SEND_VERIFICATION: `${API_BASE_URL}/auth/send-verification`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  GET_CURRENT_USER: `${API_BASE_URL}/auth/me`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,

  // Users
  USERS: `${API_BASE_URL}/users`,
  USER_PROFILE: (id: number) => `${API_BASE_URL}/users/${id}/profile`,
  CHANGE_PASSWORD: (id: number) =>
    `${API_BASE_URL}/users/${id}/change-password`,

  // Movies
  MOVIES: `${API_BASE_URL}/movies`,
  MOVIE_DETAIL: (id: number) => `${API_BASE_URL}/movies/${id}`,
  MOVIE_SHOWTIMES: (id: number) => `${API_BASE_URL}/movies/${id}/showtimes`,
  MOVIE_REVIEWS: (id: number) => `${API_BASE_URL}/movies/${id}/reviews`,
  MOVIE_UPLOAD_POSTER: (id: number) =>
    `${API_BASE_URL}/movies/${id}/upload-poster`,

  // Genres
  GENRES: `${API_BASE_URL}/genres`,

  // Cinemas
  CINEMAS: `${API_BASE_URL}/cinemas`,
  CINEMA_DETAIL: (id: number) => `${API_BASE_URL}/cinemas/${id}`,
  CINEMA_HALLS: (id: number) => `${API_BASE_URL}/cinemas/${id}/halls`,
  CINEMA_SHOWTIMES: (id: number) => `${API_BASE_URL}/cinemas/${id}/showtimes`,

  // Halls
  HALLS: `${API_BASE_URL}/halls`,
  HALL_DETAIL: (id: number) => `${API_BASE_URL}/halls/${id}`,
  HALL_LAYOUT: (id: number) => `${API_BASE_URL}/halls/${id}/layout`,

  // Showtimes
  SHOWTIMES: `${API_BASE_URL}/showtimes`,
  SHOWTIME_SEATS: (id: number) => `${API_BASE_URL}/showtimes/${id}/seats`,
  SHOWTIME_SEAT_MAP: (id: number) => `${API_BASE_URL}/showtimes/${id}/seat-map`,

  // Bookings
  BOOKINGS: `${API_BASE_URL}/bookings`,
  BOOKING_DETAIL: (id: number) => `${API_BASE_URL}/bookings/${id}`,
  USER_BOOKINGS: (userId: number) => `${API_BASE_URL}/bookings/user/${userId}`,
  CONFIRM_BOOKING: (id: number) => `${API_BASE_URL}/bookings/${id}/confirm`,
  CANCEL_BOOKING: (id: number) => `${API_BASE_URL}/bookings/${id}/cancel`,

  // Transactions
  TRANSACTIONS: `${API_BASE_URL}/api/transactions`,
  USER_TRANSACTIONS: (userId: number) =>
    `${API_BASE_URL}/api/transactions/user/${userId}`,
  MOMO_PAYMENT: `${API_BASE_URL}/api/transactions/momo`,
  VNPAY_PAYMENT: `${API_BASE_URL}/api/transactions/vnpay`,
  MOMO_VERIFY: `${API_BASE_URL}/api/transactions/momo/verify`,
  VNPAY_VERIFY: `${API_BASE_URL}/api/transactions/vnpay/verify`,

  // Promotions & Vouchers
  PROMOTIONS: `${API_BASE_URL}/promotions`,
  USER_VOUCHERS: (userId: number) => `${API_BASE_URL}/vouchers/user/${userId}`,
  APPLY_VOUCHER: `${API_BASE_URL}/vouchers/apply`,

  // Concessions
  CONCESSIONS: `${API_BASE_URL}/concessions`,

  // Tickets
  TICKETS: `${API_BASE_URL}/tickets`,
  TICKET_BY_CODE: (code: string) => `${API_BASE_URL}/tickets/code/${code}`,
  TICKET_BY_BOOKING: (bookingId: number) =>
    `${API_BASE_URL}/tickets/booking/${bookingId}`,

  // Reviews
  MOVIE_REVIEWS_LIST: (movieId: number) =>
    `${API_BASE_URL}/reviews/movie/${movieId}`,
  CREATE_REVIEW: `${API_BASE_URL}/reviews`,

  // Reviews (Admin)
  REVIEWS: `${API_BASE_URL}/reviews`,
  REVIEW_DETAIL: (id: number) => `${API_BASE_URL}/reviews/${id}`,
  REVIEW_APPROVE: (id: number) => `${API_BASE_URL}/reviews/${id}/approve`,
  REVIEW_REJECT: (id: number) => `${API_BASE_URL}/reviews/${id}/reject`,
  REVIEW_REPORT: (id: number) => `${API_BASE_URL}/reviews/${id}/report`,

  // Notifications
  USER_NOTIFICATIONS: (userId: number) =>
    `${API_BASE_URL}/notifications/user/${userId}`,
  MARK_READ: (id: number) => `${API_BASE_URL}/notifications/${id}/read`,

  // Loyalty
  LOYALTY_HISTORY: (userId: number) =>
    `${API_BASE_URL}/loyalty/history/${userId}`,
  EARN_POINTS: `${API_BASE_URL}/loyalty/earn`,
  REDEEM_POINTS: `${API_BASE_URL}/loyalty/redeem`,

  // Memberships
  MEMBERSHIPS: `${API_BASE_URL}/memberships`,
};

// Helper function for API calls
export const apiCall = async <T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> => {
  const token = localStorage.getItem("token");

  // Debug: Log token status
  if (!token) {
    console.warn(
      "⚠️ No auth token found in localStorage. User may need to login again.",
    );
  }

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(endpoint, config);
    const data = await response.json();

    if (!response.ok) {
      // Better error handling for 403
      if (response.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Helper function to get full image URL
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path; // Already full URL
  }
  // Relative path - for uploads, use base URL without /api
  // Because uploads are at /backend/uploads/, not /backend/api/uploads/
  const baseUrl = API_BASE_URL.replace(/\/api$/, ""); // Remove /api suffix
  return `${baseUrl}/${path}`;
};
