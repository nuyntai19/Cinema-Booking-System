import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, BookingProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
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
import AdminMovieDetailPage from "./pages/admin/MovieDetailPage";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCinemas from "./pages/admin/AdminCinemas";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminConcessions from "./pages/admin/AdminConcessions";
import AdminScheduler from "./pages/admin/AdminScheduler";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSettings from "./pages/admin/AdminSettings";
import ManagerLayout from "./components/manager/ManagerLayout";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import StaffLayout from "./components/staff/StaffLayout";
import StaffScanner from "./pages/staff/StaffScanner";
import StaffPOS from "./pages/staff/StaffPOS";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
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
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
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
                <Route
                  path="/booking/success"
                  element={<BookingSuccessPage />}
                />
                <Route path="/booking/failed" element={<BookingFailedPage />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="movies" element={<AdminMovies />} />
                  <Route path="movies/:id" element={<AdminMovieDetailPage />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="cinemas" element={<AdminCinemas />} />
                  <Route path="promotions" element={<AdminPromotions />} />
                  <Route path="concessions" element={<AdminConcessions />} />
                  <Route path="scheduler" element={<AdminScheduler />} />
                  <Route path="transactions" element={<AdminTransactions />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route
                    path="notifications"
                    element={<AdminNotifications />}
                  />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Manager Routes */}
                <Route path="/manager" element={<ManagerLayout />}>
                  <Route index element={<ManagerDashboard />} />
                  <Route path="movies" element={<AdminMovies />} />
                  <Route path="cinemas" element={<AdminCinemas />} />
                  <Route path="scheduler" element={<AdminScheduler />} />
                  <Route path="concessions" element={<AdminConcessions />} />
                  <Route path="promotions" element={<AdminPromotions />} />
                  <Route path="transactions" element={<AdminTransactions />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route
                    path="notifications"
                    element={<AdminNotifications />}
                  />
                  <Route path="staff" element={<AdminUsers />} />
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
