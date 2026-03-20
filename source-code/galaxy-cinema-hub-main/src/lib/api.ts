// API Configuration
// Default to the local PHP built-in server (used in this workspace).
// You can override with VITE_API_URL in your environment (.env.local)
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

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
  MOVIES: `${API_BASE_URL}/api/movies`,
  MOVIE_DETAIL: (id: number) => `${API_BASE_URL}/api/movies/${id}`,
  MOVIE_SHOWTIMES: (id: number) => `${API_BASE_URL}/api/movies/${id}/showtimes`,
  MOVIE_REVIEWS: (id: number) => `${API_BASE_URL}/api/movies/${id}/reviews`,
  MOVIE_UPLOAD_POSTER: (id: number) =>
    `${API_BASE_URL}/api/movies/${id}/upload-poster`,

  // Genres
  GENRES: `${API_BASE_URL}/api/genres`,

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
  SHOWTIMES_AUTO_GENERATE: `${API_BASE_URL}/api/showtimes/auto-generate`,
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
  USER_TRANSACTIONS: (userId: number) =>
    `${API_BASE_URL}/api/transactions/user/${userId}`,
  MOMO_PAYMENT: `${API_BASE_URL}/api/transactions/momo`,
  VNPAY_PAYMENT: `${API_BASE_URL}/api/transactions/vnpay`,
  MOMO_VERIFY: `${API_BASE_URL}/api/transactions/momo/verify`,
  VNPAY_VERIFY: `${API_BASE_URL}/api/transactions/vnpay/verify`,

  // Promotions & Vouchers
  PROMOTIONS_ACTIVE: `${API_BASE_URL}/api/promotions/active`,
  PROMOTIONS: `${API_BASE_URL}/api/promotions`,
  USER_VOUCHERS: (userId: number) =>
    `${API_BASE_URL}/api/vouchers/user/${userId}`,
  APPLY_VOUCHER: `${API_BASE_URL}/api/vouchers/apply`,
  REWARD_TIERS: `${API_BASE_URL}/api/vouchers/reward-tiers`,
  REDEEM_POINTS_VOUCHER: `${API_BASE_URL}/api/vouchers/redeem-points`,

  // Concessions
  CONCESSIONS: `${API_BASE_URL}/api/concessions`,

  // Reviews
  MOVIE_REVIEWS_LIST: (movieId: number) =>
    `${API_BASE_URL}/api/reviews/movie/${movieId}`,
  CREATE_REVIEW: `${API_BASE_URL}/api/reviews`,

  // Reviews (Admin)
  REVIEWS: `${API_BASE_URL}/api/reviews`,
  REVIEW_DETAIL: (id: number) => `${API_BASE_URL}/api/reviews/${id}`,
  REVIEW_APPROVE: (id: number) => `${API_BASE_URL}/api/reviews/${id}/approve`,
  REVIEW_REJECT: (id: number) => `${API_BASE_URL}/api/reviews/${id}/reject`,
  REVIEW_REPORT: (id: number) => `${API_BASE_URL}/api/reviews/${id}/report`,

  // Notifications
  PUBLIC_NOTIFICATIONS: `${API_BASE_URL}/api/notifications/public`,
  USER_NOTIFICATIONS: (userId: number) =>
    `${API_BASE_URL}/api/notifications/user/${userId}`,
  MARK_READ: (id: number) => `${API_BASE_URL}/api/notifications/${id}/read`,
  ADMIN_NOTIFICATIONS: `${API_BASE_URL}/api/admin/notifications`,
  ADMIN_NOTIFICATION_DETAIL: (id: number) =>
    `${API_BASE_URL}/api/admin/notifications/${id}`,

  // Admin dashboard
  ADMIN_STATS: `${API_BASE_URL}/api/admin/stats`,
  ADMIN_REVENUE: `${API_BASE_URL}/api/admin/revenue`,
  ADMIN_SEAT_HEATMAP: `${API_BASE_URL}/api/admin/seat-heatmap`,
  ADMIN_RECENT_TRANSACTIONS: `${API_BASE_URL}/api/admin/recent-transactions`,

  // Loyalty
  LOYALTY_POINTS: (userId: number) =>
    `${API_BASE_URL}/api/loyalty/points/${userId}`,
  LOYALTY_HISTORY: (userId: number) =>
    `${API_BASE_URL}/api/loyalty/history/${userId}`,
  EARN_POINTS: `${API_BASE_URL}/api/loyalty/earn`,
  REDEEM_POINTS: `${API_BASE_URL}/api/loyalty/redeem`,

  // Memberships
  MEMBERSHIPS: `${API_BASE_URL}/api/memberships`,
  MEMBERSHIP_USER_TIER: (userId: number) =>
    `${API_BASE_URL}/api/memberships/user/${userId}`,
  MEMBERSHIP_CHECK_UPGRADE: (userId: number) =>
    `${API_BASE_URL}/api/memberships/check-upgrade/${userId}`,
};

// Helper function for API calls
let hasWarnedMissingToken = false;
let hasHandledUnauthorized = false;

const handleUnauthorized = () => {
  if (hasHandledUnauthorized) return;
  hasHandledUnauthorized = true;

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("galaxy_cinema_token");
  localStorage.removeItem("galaxy_cinema_user");

  window.dispatchEvent(new CustomEvent("auth:unauthorized"));
};

export const apiCall = async <T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> => {
  const token = localStorage.getItem("token");

  // Debug: Log token status
  console.log("📡 apiCall to:", endpoint, "- Token present:", !!token);
  if (!token && !hasWarnedMissingToken) {
    hasWarnedMissingToken = true;
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
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const raw = await response.text();

    let data: any = null;
    if (isJson) {
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          `Phản hồi API không phải JSON hợp lệ (${response.status}) tại ${endpoint}`,
        );
      }
    } else {
      // If API returns HTML/text, surface a precise diagnostic.
      throw new Error(
        `API trả về ${contentType || "text/plain"} thay vì JSON (${response.status}) tại ${endpoint}`,
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      // Better error handling for 403
      if (response.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw new Error(data.message || "API request failed");
    }

    if (hasHandledUnauthorized) {
      hasHandledUnauthorized = false;
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
