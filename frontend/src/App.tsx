import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Main pages
import { HomePage } from './pages/home/HomePage';
import { SearchResultsPage } from './pages/trains/SearchResultsPage';
import { TrainsListPage } from './pages/trains/TrainsListPage';
import { TrainDetailsPage } from './pages/trains/TrainDetailsPage';
import { AvailabilityPage } from './pages/trains/AvailabilityPage';
import { BookingPage } from './pages/bookings/BookingPage';
import { MyBookingsPage } from './pages/bookings/MyBookingsPage';
import { BookingDetailPage } from './pages/bookings/BookingDetailPage';
import { PNRStatusPage } from './pages/pnr/PNRStatusPage';
import { LiveStatusPage } from './pages/trains/LiveStatusPage';
import { StationsPage } from './pages/stations/StationsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { PassengersPage } from './pages/profile/PassengersPage';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

/* ─── Route guards ──────────────────────────────────────────── */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      </Route>

      {/* Protected app routes */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/trains" element={<TrainsListPage />} />
        <Route path="/trains/:id" element={<TrainDetailsPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/stations" element={<StationsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Booking flow */}
        <Route path="/book/:trainId" element={<BookingPage />} />
        <Route path="/booking/review" element={<BookingPage />} />
        <Route path="/payment" element={<BookingPage />} />
        <Route path="/booking/success" element={<MyBookingsPage />} />
        <Route path="/ticket/:pnr" element={<BookingDetailPage />} />

        {/* My Bookings routes */}
        <Route path="/bookings" element={<MyBookingsPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/my-bookings/:id" element={<BookingDetailPage />} />

        {/* Tracking & Profile */}
        <Route path="/pnr" element={<PNRStatusPage />} />
        <Route path="/live-status" element={<LiveStatusPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/passengers" element={<PassengersPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminDashboardPage />} />
        <Route path="/admin/stations" element={<AdminDashboardPage />} />
        <Route path="/admin/trains" element={<AdminDashboardPage />} />
        <Route path="/admin/routes" element={<AdminDashboardPage />} />
        <Route path="/admin/schedules" element={<AdminDashboardPage />} />
        <Route path="/admin/fares" element={<AdminDashboardPage />} />
        <Route path="/admin/bookings" element={<AdminDashboardPage />} />
        <Route path="/admin/payments" element={<AdminDashboardPage />} />
        <Route path="/admin/live-status" element={<AdminDashboardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
