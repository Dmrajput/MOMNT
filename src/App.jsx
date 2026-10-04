import { useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { BookingProvider } from "./context/BookingContext";
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
import { AdminAuthProvider, useAdminAuth } from "./admin/context/AdminAuthContext";
import AdminLayout from "./admin/components/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import Dashboard from "./admin/pages/Dashboard";
import AdminEvents from "./admin/pages/Events";
import AdminEventDetails from "./admin/pages/EventDetails";
import AdminBookings from "./admin/pages/Bookings";
import AdminBookingDetails from "./admin/pages/BookingDetails";
import AdminPayments from "./admin/pages/Payments";
import AdminPaymentDetails from "./admin/pages/PaymentDetails";
import AdminTickets from "./admin/pages/Tickets";
import AdminTicketDetails from "./admin/pages/TicketDetails";
import AdminCustomers from "./admin/pages/Customers";
import AdminCustomerDetails from "./admin/pages/CustomerDetails";
import CheckIn from "./admin/pages/CheckIn";
import Reports from "./admin/pages/Reports";
import Settings from "./admin/pages/Settings";
import AdminProfile from "./admin/pages/AdminProfile";
import { homeFromAccess } from "./admin/utils/adminHelpers";

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
    return <Navigate to={homeFromAccess(admin.access)} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
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
            <Route path="*" element={<NotFound />} />
          </Route>
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
          <Route path="/ticket/validate/:qrToken" element={<TicketValidation />} />
          <Route path="/ticket/:ticketId" element={<Ticket />} />
        </Routes>
        </PaymentProvider>
      </BookingProvider>
    </BrowserRouter>
  );
}
