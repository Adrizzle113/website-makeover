import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import HotelDetailsPage from "./pages/HotelDetailsPage";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import Dashboard from "./pages/Dashboard";
import DashboardSearchPage from "./pages/dashboard/SearchPage";
import { TripsListPage, TripDetailsPage } from "./pages/trips";
import { OrderDetailsPage, BookingConfirmationPage } from "./pages/orders";
import { DocumentsViewerPage } from "./pages/documents";
import { 
  BookingsReportPage, 
  RevenueReportPage, 
  InvoicesReportPage, 
  PaymentsReportPage, 
  ReconciliationReportPage, 
  PayoutsReportPage, 
  ExportsReportPage 
} from "./pages/reporting";
import {
  AllClientsPage,
  GroupsPage,
  ContactsPage,
  BillingPage,
  ActivityPage,
} from "./pages/clients";
import NotFound from "./pages/NotFound";
import { Login, Register, EmailVerification, PendingApproval } from "./pages/auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={0}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/search" element={<DashboardSearchPage />} />
          <Route path="/dashboard/reports" element={<Navigate to="/reporting/bookings" replace />} />
          <Route path="/hotel/:id" element={<HotelDetailsPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          {/* Trips */}
          <Route path="/trips" element={<TripsListPage />} />
          <Route path="/trips/:orderGroupId" element={<TripDetailsPage />} />
          {/* Orders */}
          <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="/orders/:orderId/confirmation" element={<BookingConfirmationPage />} />
          {/* Documents */}
          <Route path="/documents/:documentId" element={<DocumentsViewerPage />} />
          {/* Reporting */}
          <Route path="/reporting/bookings" element={<BookingsReportPage />} />
          <Route path="/reporting/revenue" element={<RevenueReportPage />} />
          <Route path="/reporting/invoices" element={<InvoicesReportPage />} />
          <Route path="/reporting/payments" element={<PaymentsReportPage />} />
          <Route path="/reporting/reconciliation" element={<ReconciliationReportPage />} />
          <Route path="/reporting/payouts" element={<PayoutsReportPage />} />
          <Route path="/reporting/exports" element={<ExportsReportPage />} />
          {/* Clients */}
          <Route path="/clients" element={<AllClientsPage />} />
          <Route path="/clients/groups" element={<GroupsPage />} />
          <Route path="/clients/contacts" element={<ContactsPage />} />
          <Route path="/clients/billing" element={<BillingPage />} />
          <Route path="/clients/activity" element={<ActivityPage />} />
          <Route path="/dashboard/clients" element={<Navigate to="/clients" replace />} />
          {/* Auth */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/email-verification" element={<EmailVerification />} />
          <Route path="/auth/pending-approval" element={<PendingApproval />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
