/**
 * API Configuration
 */

// Base API URL
// Accept both:
// - VITE_API_URL=http://localhost:8000
// - VITE_API_URL=http://localhost:8000/api
const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
export const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
    },

    // Tickets
    TICKETS: {
        GET_BY_CODE: (code: string) => `/tickets/code/${code}`,
        GET_BY_BOOKING: (bookingId: string) => `/tickets/booking/${bookingId}`,
        CHECK: '/tickets/check',
        MARK_AS_USED: (id: string) => `/tickets/${id}/use`,
        REFUND: (id: string) => `/tickets/${id}/refund`,
        SEND_EMAIL: (id: string) => `/tickets/${id}/send-email`,
    },

    // Concessions
    CONCESSIONS: {
        LIST: '/concessions',
        AVAILABLE: '/concessions/available',
        DETAIL: (id: string) => `/concessions/${id}`,
        CREATE: '/concessions',
        UPDATE: (id: string) => `/concessions/${id}`,
        DELETE: (id: string) => `/concessions/${id}`,
    },

    // Movies
    MOVIES: {
        ALL: '/movies',
        LIST: '/movies',
        BY_ID: (id: number | string) => `/movies/${id}`,
        DETAIL: (id: number | string) => `/movies/${id}`,
        SHOWTIMES: (id: number | string) => `/movies/${id}/showtimes`,
        REVIEWS: (id: number | string) => `/movies/${id}/reviews`,
    },

    // Cinemas
    CINEMAS: {
        ALL: '/cinemas',
        LIST: '/cinemas',
        BY_ID: (id: number | string) => `/cinemas/${id}`,
        DETAIL: (id: number | string) => `/cinemas/${id}`,
        HALLS: (id: number | string) => `/cinemas/${id}/halls`,
        SHOWTIMES: (id: number | string) => `/cinemas/${id}/showtimes`,
    },

    // Bookings
    BOOKINGS: {
        ALL: '/bookings',
        LIST: '/bookings',
        BY_ID: (id: number | string) => `/bookings/${id}`,
        DETAIL: (id: number | string) => `/bookings/${id}`,
        CREATE: '/bookings',
        CONFIRM: (id: number | string) => `/bookings/${id}/confirm`,
        CANCEL: (id: number | string) => `/bookings/${id}/cancel`,
        USER: (userId: number | string) => `/bookings/user/${userId}`,
        USER_BOOKINGS: (userId: number | string) => `/bookings/user/${userId}`,
    },

    // Transactions
    TRANSACTIONS: {
        CREATE: '/transactions',
        MOMO: '/transactions/momo',
        VNPAY: '/transactions/vnpay',
        MOMO_VERIFY: '/transactions/momo/verify',
        VNPAY_VERIFY: '/transactions/vnpay/verify',
        BY_BOOKING: (bookingId: string) => `/transactions/booking/${bookingId}`,
        USER_HISTORY: (userId: string) => `/transactions/user/${userId}`,
    },

    // Showtimes
    SHOWTIMES: {
        ALL: '/showtimes',
        LIST: '/showtimes',
        BY_ID: (id: number | string) => `/showtimes/${id}`,
        DETAIL: (id: number | string) => `/showtimes/${id}`,
        SEATS: (id: number | string) => `/showtimes/${id}/seats`,
        SEAT_MAP: (id: number | string) => `/showtimes/${id}/seat-map`,
    },
};

// Storage keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'galaxy_cinema_token',
    USER: 'galaxy_cinema_user',
    BOOKING_STATE: 'galaxy_cinema_booking',
};
