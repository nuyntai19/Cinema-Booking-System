import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Booking, Seat, ConcessionItem, Showtime } from '@/types/cinema';
import { demoUsers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
  updateConcession: (id: string, quantity: number) => void;
  getTotalAmount: () => number;
  clearBooking: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    const credentials: Record<string, string> = {
      'admin@cinema.com': 'admin123',
      'staff@cinema.com': 'staff123',
      'client@gmail.com': 'client123',
    };

    if (credentials[email] === password) {
      const foundUser = demoUsers.find(u => u.email === email);
      if (foundUser) {
        setUser(foundUser);
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<string | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [concessions, setConcessions] = useState<ConcessionItem[]>([]);

  const addSeat = (seat: Seat) => {
    if (!selectedSeats.find(s => s.id === seat.id)) {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const removeSeat = (seatId: string) => {
    setSelectedSeats(selectedSeats.filter(s => s.id !== seatId));
  };

  const updateConcession = (id: string, quantity: number) => {
    const existing = concessions.find(c => c.id === id);
    if (existing) {
      if (quantity === 0) {
        setConcessions(concessions.filter(c => c.id !== id));
      } else {
        setConcessions(concessions.map(c => c.id === id ? { ...c, quantity } : c));
      }
    } else if (quantity > 0) {
      const item = { id, name: '', nameVi: '', price: 0, quantity, image: '' };
      setConcessions([...concessions, item]);
    }
  };

  const getTotalAmount = () => {
    const seatTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    const concessionTotal = concessions.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return seatTotal + concessionTotal;
  };

  const clearBooking = () => {
    setSelectedMovie(null);
    setSelectedCinema(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setConcessions([]);
  };

  return (
    <BookingContext.Provider value={{
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
      updateConcession,
      getTotalAmount,
      clearBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
};
