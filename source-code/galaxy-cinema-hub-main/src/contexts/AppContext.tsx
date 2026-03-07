import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  User,
  Booking,
  Seat,
  ConcessionItem,
  Showtime,
  UserRole,
} from "@/types/cinema";
import { API_ENDPOINTS } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; user?: User }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

interface BookingContextType {
  selectedMovie: string | null;
  selectedCinema: string | null;
  selectedShowtime: Showtime | null;
  selectedSeats: Seat[];
  concessions: ConcessionItem[];
  setSelectedMovie: (id: string | null) => void;
  setSelectedCinema: (id: string | null) => void;
  setSelectedShowtime: (showtime: Showtime | null) => void;
  addSeat: (seat: Seat) => void;
  removeSeat: (seatId: string) => void;
  clearSeats: () => void;
  updateConcession: (item: ConcessionItem) => void;
  getTotalAmount: () => number;
  clearBooking: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initialize user synchronously from localStorage to prevent race conditions
  // (e.g., AdminLayout checking isAuthenticated before useEffect runs)
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return null;
      }
    }
    return null;
  });

  // Helper function to map role_id to role
  const mapRoleIdToRole = (roleId: number): UserRole => {
    switch (roleId) {
      case 5:
        return "admin";
      case 4:
        return "manager";
      case 3:
        return "staff";
      case 2:
      case 1:
      default:
        return "client";
    }
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: User }> => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Login failed:", data.message);
        return { success: false };
      }

      // Map backend response to User type
      const userData: User = {
        id: data.data.user.id.toString(),
        name: data.data.user.full_name,
        email: data.data.user.email,
        role: mapRoleIdToRole(data.data.user.role_id),
        avatar: data.data.user.avatar || undefined,
        loyaltyPoints: data.data.user.current_points || 0,
        phone: data.data.user.phone,
        dob: data.data.user.dob,
      };

      // Save token and user to localStorage
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false };
    }
  };

  const logout = () => {
    console.log("👋 Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    // Redirect to home page
    console.log("🏠 Redirecting to home page...");
    window.location.href = "/";
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found, cannot refresh user");
        return;
      }

      console.log("🔄 Refreshing user data...");
      const response = await fetch(API_ENDPOINTS.GET_CURRENT_USER, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("📦 Refreshed user data:", data);

      if (data.success && data.data.user) {
        const userData: User = {
          id: data.data.user.id.toString(),
          name: data.data.user.full_name,
          email: data.data.user.email,
          role: mapRoleIdToRole(data.data.user.role_id),
          avatar: data.data.user.avatar || undefined,
          loyaltyPoints: data.data.user.current_points || 0,
          phone: data.data.user.phone,
          dob: data.data.user.dob,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        console.log("✅ User data refreshed successfully");
      }
    } catch (error) {
      console.error("❌ Error refreshing user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, refreshUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<string | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(
    null,
  );
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [concessions, setConcessions] = useState<ConcessionItem[]>([]);

  const addSeat = useCallback((seat: Seat) => {
    setSelectedSeats((prev) => {
      if (prev.find((s) => s.id === seat.id)) return prev;
      return [...prev, seat];
    });
  }, []);

  const removeSeat = useCallback((seatId: string) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  }, []);

  const clearSeats = useCallback(() => {
    setSelectedSeats((prev) => (prev.length === 0 ? prev : []));
  }, []);

  const updateConcession = useCallback((item: ConcessionItem) => {
    setConcessions((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        if (item.quantity === 0) {
          return prev.filter((c) => c.id !== item.id);
        }
        return prev.map((c) => (c.id === item.id ? item : c));
      } else if (item.quantity > 0) {
        return [...prev, item];
      }
      return prev;
    });
  }, []);

  const getTotalAmount = useCallback(() => {
    const seatTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    const concessionTotal = concessions.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    return seatTotal + concessionTotal;
  }, [selectedSeats, concessions]);

  const clearBooking = useCallback(() => {
    setSelectedMovie(null);
    setSelectedCinema(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setConcessions([]);
  }, []);

  const contextValue = useMemo(
    () => ({
      selectedMovie,
      selectedCinema,
      selectedShowtime,
      selectedSeats,
      concessions,
      setSelectedMovie,
      setSelectedCinema,
      setSelectedShowtime,
      addSeat,
      removeSeat,
      clearSeats,
      updateConcession,
      getTotalAmount,
      clearBooking,
    }),
    [
      selectedMovie,
      selectedCinema,
      selectedShowtime,
      selectedSeats,
      concessions,
      addSeat,
      removeSeat,
      clearSeats,
      updateConcession,
      getTotalAmount,
      clearBooking,
    ],
  );

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context)
    throw new Error("useBooking must be used within BookingProvider");
  return context;
};
