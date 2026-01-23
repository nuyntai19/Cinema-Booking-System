import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, BookingProvider } from "@/contexts/AppContext";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import BookingHistoryPage from "./pages/BookingHistoryPage";
import SearchPage from "./pages/SearchPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import SchedulePage from "./pages/SchedulePage";
import MoviesPage from "./pages/CinemasPage";
import CinemasListPage from "./pages/CinemasListPage";
import PromotionsPage from "./pages/PromotionsPage";
import SeatSelectionPage from "./pages/booking/SeatSelectionPage";
import ConcessionsPage from "./pages/booking/ConcessionsPage";
import PaymentPage from "./pages/booking/PaymentPage";
import BookingSuccessPage from "./pages/booking/BookingSuccessPage";
import BookingFailedPage from "./pages/booking/BookingFailedPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMovies from "./pages/admin/AdminMovies";
import AdminCinemas from "./pages/admin/AdminCinemas";
import AdminScheduler from "./pages/admin/AdminScheduler";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSettings from "./pages/admin/AdminSettings";
import StaffLayout from "./components/staff/StaffLayout";
import StaffScanner from "./pages/staff/StaffScanner";
import StaffPOS from "./pages/staff/StaffPOS";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BookingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Client Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/bookings" element={<BookingHistoryPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/movies" element={<MoviesPage />} />
              <Route path="/cinemas" element={<CinemasListPage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/movie/:id" element={<MovieDetailPage />} />
              <Route path="/booking/seats" element={<SeatSelectionPage />} />
              <Route
                path="/booking/concessions"
                element={<ConcessionsPage />}
              />
              <Route path="/booking/payment" element={<PaymentPage />} />
              <Route path="/booking/success" element={<BookingSuccessPage />} />
              <Route path="/booking/failed" element={<BookingFailedPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="movies" element={<AdminMovies />} />
                <Route path="cinemas" element={<AdminCinemas />} />
                <Route path="scheduler" element={<AdminScheduler />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Staff Routes */}
              <Route path="/staff" element={<StaffLayout />}>
                <Route index element={<StaffScanner />} />
                <Route path="scanner" element={<StaffScanner />} />
                <Route path="pos" element={<StaffPOS />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BookingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
