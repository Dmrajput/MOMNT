import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";
import { EventCatalogProvider } from "./context/EventCatalogContext";
import { PaymentProvider } from "./context/PaymentContext";
import PaymentHeader from "./components/payment/PaymentHeader";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import BookingLayout from "./components/booking/BookingLayout";
import Home from "./pages/Home";
import Experiences from "./pages/Experiences";
import EventDetails from "./pages/EventDetails";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import Booking from "./pages/Booking";
import BookingDetails from "./pages/BookingDetails";
import BookingReview from "./pages/BookingReview";
import BookingSuccess from "./pages/BookingSuccess";
import Payment from "./pages/Payment";
import PaymentStatus from "./pages/PaymentStatus";
import Ticket from "./pages/Ticket";
import TicketValidation from "./pages/TicketValidation";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyBookings from "./pages/MyBookings";
import { AdminAuthProvider, useAdminAuth } from "./admin/context/AdminAuthContext";
import AdminLayout from "./admin/components/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import AccessDenied from "./admin/pages/AccessDenied";
import { homeFromAccess } from "./admin/utils/adminHelpers";

const Dashboard = lazy(() => import("./admin/pages/Dashboard"));
const AdminEvents = lazy(() => import("./admin/pages/Events"));
const AdminEventDetails = lazy(() => import("./admin/pages/EventDetails"));
const AdminBookings = lazy(() => import("./admin/pages/Bookings"));
const AdminBookingDetails = lazy(() => import("./admin/pages/BookingDetails"));
const AdminPayments = lazy(() => import("./admin/pages/Payments"));
const AdminPaymentDetails = lazy(() => import("./admin/pages/PaymentDetails"));
const AdminTickets = lazy(() => import("./admin/pages/Tickets"));
const AdminTicketDetails = lazy(() => import("./admin/pages/TicketDetails"));
const AdminCustomers = lazy(() => import("./admin/pages/Customers"));
const AdminCustomerDetails = lazy(() => import("./admin/pages/CustomerDetails"));
const CheckIn = lazy(() => import("./admin/pages/CheckIn"));
const Reports = lazy(() => import("./admin/pages/Reports"));
const Settings = lazy(() => import("./admin/pages/Settings"));
const AdminProfile = lazy(() => import("./admin/pages/AdminProfile"));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PaymentLayout() {
  return (
    <div className="min-h-screen">
      <a
        href="#payment-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-[12px] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>
      <PaymentHeader />
      <main
        id="payment-main"
        className="mx-auto w-full max-w-[1200px] px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:px-6 lg:py-12"
      >
        <Outlet />
      </main>
    </div>
  );
}

function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-[12px] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function RequireUser() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="min-h-screen bg-bg" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function AdminRoot() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}

function AdminIndex() {
  const { admin, ready } = useAdminAuth();
  if (!ready) return <div className="min-h-screen bg-bg" />;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <Navigate to={homeFromAccess(admin.access)} replace />;
}

function AdminGate({ anyOf, children }) {
  const { admin, ready } = useAdminAuth();
  const location = useLocation();
  if (!ready) return <div className="min-h-screen bg-bg" />;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (anyOf && !anyOf.some((key) => admin.access?.includes(key))) {
    return <AccessDenied />;
  }
  return <Suspense fallback={<div className="min-h-40 animate-pulse rounded-2xl bg-white/5" />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <EventCatalogProvider>
      <BookingProvider>
        <PaymentProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/admin" element={<AdminRoot />}>
            <Route index element={<AdminIndex />} />
            <Route path="login" element={<AdminLogin />} />
            <Route element={<AdminGate><AdminLayout /></AdminGate>}>
              <Route path="dashboard" element={<AdminGate anyOf={["dashboard"]}><Dashboard /></AdminGate>} />
              <Route path="events" element={<AdminGate anyOf={["events"]}><AdminEvents /></AdminGate>} />
              <Route path="events/new" element={<AdminGate anyOf={["events_write"]}><AdminEventDetails /></AdminGate>} />
              <Route path="events/:eventId" element={<AdminGate anyOf={["events"]}><AdminEventDetails /></AdminGate>} />
              <Route path="bookings" element={<AdminGate anyOf={["bookings"]}><AdminBookings /></AdminGate>} />
              <Route path="bookings/:bookingId" element={<AdminGate anyOf={["bookings"]}><AdminBookingDetails /></AdminGate>} />
              <Route path="payments" element={<AdminGate anyOf={["payments"]}><AdminPayments /></AdminGate>} />
              <Route path="payments/:paymentId" element={<AdminGate anyOf={["payments"]}><AdminPaymentDetails /></AdminGate>} />
              <Route path="tickets" element={<AdminGate anyOf={["tickets"]}><AdminTickets /></AdminGate>} />
              <Route path="tickets/:ticketId" element={<AdminGate anyOf={["tickets"]}><AdminTicketDetails /></AdminGate>} />
              <Route path="customers" element={<AdminGate anyOf={["customers"]}><AdminCustomers /></AdminGate>} />
              <Route path="customers/:customerId" element={<AdminGate anyOf={["customers"]}><AdminCustomerDetails /></AdminGate>} />
              <Route path="check-in" element={<AdminGate anyOf={["check_in"]}><CheckIn /></AdminGate>} />
              <Route path="reports" element={<AdminGate anyOf={["reports", "payment_reports"]}><Reports /></AdminGate>} />
              <Route path="settings" element={<AdminGate anyOf={["settings"]}><Settings /></AdminGate>} />
              <Route path="profile" element={<AdminGate anyOf={["profile"]}><AdminProfile /></AdminGate>} />
            </Route>
          </Route>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/experiences/:slug" element={<EventDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<RequireUser />}>
              <Route path="/my-bookings" element={<MyBookings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route element={<RequireUser />}>
          <Route element={<BookingLayout />}>
            <Route path="/booking" element={<Booking />} />
            <Route path="/booking/details" element={<BookingDetails />} />
            <Route path="/booking/review" element={<BookingReview />} />
            <Route path="/booking/success" element={<BookingSuccess />} />
          </Route>
          <Route element={<PaymentLayout />}>
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment/status/:bookingId" element={<PaymentStatus />} />
          </Route>
          </Route>
          <Route path="/ticket/validate/:qrToken" element={<TicketValidation />} />
          <Route path="/ticket/:ticketId" element={<Ticket />} />
        </Routes>
        </PaymentProvider>
      </BookingProvider>
      </EventCatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
