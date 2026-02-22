import { M, V } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost/Cinema-Booking-System/backend";

export const API_ENDPOINTS = {
  // Auth
  SEND_VERIFICATION: `${API_BASE_URL}/api/auth/send-verification`,
  VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  GET_CURRENT_USER: `${API_BASE_URL}/api/auth/me`,

  // Users
  USERS: `${API_BASE_URL}/api/users`,
  USER_PROFILE: (id: number) => `${API_BASE_URL}/api/users/${id}/profile`,
  CHANGE_PASSWORD: (id: number) => `${API_BASE_URL}/api/users/${id}/change-password`,

  // Movies
  MOVIES: `${API_BASE_URL}/api/movies`,
  MOVIE_DETAIL: (id: number) => `${API_BASE_URL}/api/movies/${id}`,
  MOVIE_SHOWTIMES: (id: number) => `${API_BASE_URL}/api/movies/${id}/showtimes`,
  MOVIE_REVIEWS: (id: number) => `${API_BASE_URL}/api/movies/${id}/reviews`,

  // Cinemas
  CINEMAS: `${API_BASE_URL}/api/cinemas`,
  CINEMA_DETAIL: (id: number) => `${API_BASE_URL}/api/cinemas/${id}`,
  CINEMA_HALLS: (id: number) => `${API_BASE_URL}/api/cinemas/${id}/halls`,

  // Showtimes
  SHOWTIMES: `${API_BASE_URL}/api/showtimes`,
  SHOWTIME_SEATS: (id: number) => `${API_BASE_URL}/api/showtimes/${id}/seats`,

  // Bookings
  BOOKINGS: `${API_BASE_URL}/api/bookings`,
  BOOKING_DETAIL: (id: number) => `${API_BASE_URL}/api/bookings/${id}`,
  USER_BOOKINGS: (userId: number) => `${API_BASE_URL}/api/bookings/user/${userId}`,
  CONFIRM_BOOKING: (id: number) => `${API_BASE_URL}/api/bookings/${id}/confirm`,
  CANCEL_BOOKING: (id: number) => `${API_BASE_URL}/api/bookings/${id}/cancel`,

  // Transactions
  TRANSACTIONS: `${API_BASE_URL}/api/transactions`,
  USER_TRANSACTIONS: (userId: number) => `${API_BASE_URL}/api/transactions/user/${userId}`,
  MOMO_PAYMENT: `${API_BASE_URL}/api/transactions/momo`,
  VNPAY_PAYMENT: `${API_BASE_URL}/api/transactions/vnpay`,
  MOMO_VERIFY: `${API_BASE_URL}/api/transactions/momo/verify`,
  VNPAY_VERIFY: `${API_BASE_URL}/api/transactions/vnpay/verify`,

  // Promotions & Vouchers
  PROMOTIONS: `${API_BASE_URL}/api/promotions`,
  USER_VOUCHERS: (userId: number) => `${API_BASE_URL}/api/vouchers/user/${userId}`,
  APPLY_VOUCHER: `${API_BASE_URL}/api/vouchers/apply`,

  // Concessions
  CONCESSIONS: `${API_BASE_URL}/api/concessions`,

  // Reviews
  MOVIE_REVIEWS_LIST: (movieId: number) => `${API_BASE_URL}/api/reviews/movie/${movieId}`,
  CREATE_REVIEW: `${API_BASE_URL}/api/reviews`,

  // Notifications
  USER_NOTIFICATIONS: (userId: number) => `${API_BASE_URL}/api/notifications/user/${userId}`,
  MARK_READ: (id: number) => `${API_BASE_URL}/api/notifications/${id}/read`,

  // Loyalty
  LOYALTY_HISTORY: (userId: number) => `${API_BASE_URL}/api/loyalty/history/${userId}`,
  EARN_POINTS: `${API_BASE_URL}/api/loyalty/earn`,
  REDEEM_POINTS: `${API_BASE_URL}/api/loyalty/redeem`,

  // Memberships
  MEMBERSHIPS: `${API_BASE_URL}/api/memberships`,
};

// Helper function for API calls
export const apiCall = async <T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const token = localStorage.getItem("token");

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
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
