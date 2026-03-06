import { M, V } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";

// API Configuration
// Default to the local PHP built-in server (used in this workspace).
// You can override with VITE_API_URL in your environment (.env.local)
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  // Auth
  SEND_VERIFICATION: `${API_BASE_URL}/api/auth/send-verification`,
  VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  GET_CURRENT_USER: `${API_BASE_URL}/api/auth/me`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,

  // Users
  USERS: `${API_BASE_URL}/api/users`,
  USER_PROFILE: (id: number) => `${API_BASE_URL}/api/users/${id}/profile`,
  CHANGE_PASSWORD: (id: number) =>
    `${API_BASE_URL}/api/users/${id}/change-password`,

  // Movies
  MOVIES: `${API_BASE_URL}/api/movies/index.php`,
  MOVIE_DETAIL: (id: number) =>
    `${API_BASE_URL}/api/movies/detail.php?id=${id}`,
  MOVIE_SHOWTIMES: (id: number) =>
    `${API_BASE_URL}/api/movies/showtimes.php?id=${id}`,
  MOVIE_REVIEWS: (id: number) =>
    `${API_BASE_URL}/api/movies/reviews.php?id=${id}`,
  MOVIE_UPLOAD_POSTER: (id: number) =>
    `${API_BASE_URL}/api/movies/upload-poster.php?id=${id}`,

  // Genres
  GENRES: `${API_BASE_URL}/api/genres/index.php`,

  // Cinemas
  CINEMAS: `${API_BASE_URL}/api/cinemas`,
  CINEMA_DETAIL: (id: number) => `${API_BASE_URL}/api/cinemas/${id}`,
  CINEMA_HALLS: (id: number) => `${API_BASE_URL}/api/cinemas/${id}/halls`,
  CINEMA_SHOWTIMES: (id: number) =>
    `${API_BASE_URL}/api/cinemas/${id}/showtimes`,

  // Halls
  HALLS: `${API_BASE_URL}/api/halls`,
  HALL_DETAIL: (id: number) => `${API_BASE_URL}/api/halls/${id}`,
  HALL_LAYOUT: (id: number) => `${API_BASE_URL}/api/halls/${id}/layout`,

  // Showtimes
  SHOWTIMES: `${API_BASE_URL}/api/showtimes`,
  SHOWTIME_SEATS: (id: number) => `${API_BASE_URL}/api/showtimes/${id}/seats`,
  SHOWTIME_SEAT_MAP: (id: number) =>
    `${API_BASE_URL}/api/showtimes/${id}/seat-map`,

  // Bookings
  BOOKINGS: `${API_BASE_URL}/api/bookings`,
  BOOKING_DETAIL: (id: number) => `${API_BASE_URL}/api/bookings/${id}`,
  USER_BOOKINGS: (userId: number) =>
    `${API_BASE_URL}/api/bookings/user/${userId}`,
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
  USER_VOUCHERS: (userId: number) =>
    `${API_BASE_URL}/api/vouchers/user/${userId}`,
  APPLY_VOUCHER: `${API_BASE_URL}/api/vouchers/apply`,

  // Concessions
  CONCESSIONS: `${API_BASE_URL}/api/concessions`,

  // Reviews
  MOVIE_REVIEWS_LIST: (movieId: number) =>
    `${API_BASE_URL}/api/reviews/movie/${movieId}`,
  CREATE_REVIEW: `${API_BASE_URL}/api/reviews`,

  // Reviews (Admin)
  REVIEWS: `${API_BASE_URL}/api/reviews/index.php`,
  REVIEW_DETAIL: (id: number) =>
    `${API_BASE_URL}/api/reviews/detail.php?id=${id}`,
  REVIEW_APPROVE: (id: number) =>
    `${API_BASE_URL}/api/reviews/approve.php?id=${id}`,
  REVIEW_REJECT: (id: number) =>
    `${API_BASE_URL}/api/reviews/reject.php?id=${id}`,
  REVIEW_REPORT: (id: number) =>
    `${API_BASE_URL}/api/reviews/report.php?id=${id}`,

  // Notifications
  USER_NOTIFICATIONS: (userId: number) =>
    `${API_BASE_URL}/api/notifications/user/${userId}`,
  MARK_READ: (id: number) => `${API_BASE_URL}/api/notifications/${id}/read`,

  // Loyalty
  LOYALTY_HISTORY: (userId: number) =>
    `${API_BASE_URL}/api/loyalty/history/${userId}`,
  EARN_POINTS: `${API_BASE_URL}/api/loyalty/earn`,
  REDEEM_POINTS: `${API_BASE_URL}/api/loyalty/redeem`,

  // Memberships
  MEMBERSHIPS: `${API_BASE_URL}/api/memberships`,
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
  // Relative path - prepend API base URL
  return `${API_BASE_URL}/${path}`;
};
