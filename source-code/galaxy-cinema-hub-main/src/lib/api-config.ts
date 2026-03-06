/**
 * API Configuration
 */

// Base API URL - Update this to match your backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
        LIST: '/movies',
        DETAIL: (id: string) => `/movies/${id}`,
        SHOWTIMES: (id: string) => `/movies/${id}/showtimes`,
        REVIEWS: (id: string) => `/movies/${id}/reviews`,
    },

    // Cinemas
    CINEMAS: {
        LIST: '/cinemas',
        DETAIL: (id: string) => `/cinemas/${id}`,
        HALLS: (id: string) => `/cinemas/${id}/halls`,
    },

    // Bookings
    BOOKINGS: {
        LIST: '/bookings',
        DETAIL: (id: string) => `/bookings/${id}`,
        CREATE: '/bookings',
        CONFIRM: (id: string) => `/bookings/${id}/confirm`,
        CANCEL: (id: string) => `/bookings/${id}/cancel`,
        USER_BOOKINGS: (userId: string) => `/bookings/user/${userId}`,
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
        LIST: '/showtimes',
        DETAIL: (id: string) => `/showtimes/${id}`,
        SEATS: (id: string) => `/showtimes/${id}/seats`,
    },
};

// Storage keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'galaxy_cinema_token',
    USER: 'galaxy_cinema_user',
    BOOKING_STATE: 'galaxy_cinema_booking',
};
