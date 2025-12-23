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
import { SettingsPage } from "./pages/settings";
import NotFound from "./pages/NotFound";
import { Login, Register, EmailVerification, PendingApproval } from "./pages/auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={0}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/search" element={<ProtectedRoute><DashboardSearchPage /></ProtectedRoute>} />
          <Route path="/dashboard/reports" element={<Navigate to="/reporting/bookings" replace />} />
          <Route path="/hoteldetails/:hotelId" element={<HotelDetailsPage />} />
          <Route path="/booking" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          {/* Trips */}
          <Route path="/trips" element={<ProtectedRoute><TripsListPage /></ProtectedRoute>} />
          <Route path="/trips/:orderGroupId" element={<ProtectedRoute><TripDetailsPage /></ProtectedRoute>} />
          {/* Orders */}
          <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
          <Route path="/orders/:orderId/confirmation" element={<ProtectedRoute><BookingConfirmationPage /></ProtectedRoute>} />
          {/* Documents */}
          <Route path="/documents/:documentId" element={<ProtectedRoute><DocumentsViewerPage /></ProtectedRoute>} />
          {/* Reporting */}
          <Route path="/reporting/bookings" element={<ProtectedRoute><BookingsReportPage /></ProtectedRoute>} />
          <Route path="/reporting/revenue" element={<ProtectedRoute><RevenueReportPage /></ProtectedRoute>} />
          <Route path="/reporting/invoices" element={<ProtectedRoute><InvoicesReportPage /></ProtectedRoute>} />
          <Route path="/reporting/payments" element={<ProtectedRoute><PaymentsReportPage /></ProtectedRoute>} />
          <Route path="/reporting/reconciliation" element={<ProtectedRoute><ReconciliationReportPage /></ProtectedRoute>} />
          <Route path="/reporting/payouts" element={<ProtectedRoute><PayoutsReportPage /></ProtectedRoute>} />
          <Route path="/reporting/exports" element={<ProtectedRoute><ExportsReportPage /></ProtectedRoute>} />
          {/* Clients */}
          <Route path="/clients" element={<ProtectedRoute><AllClientsPage /></ProtectedRoute>} />
          <Route path="/clients/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
          <Route path="/clients/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
          <Route path="/clients/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
          <Route path="/clients/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
          <Route path="/dashboard/clients" element={<Navigate to="/clients" replace />} />
          {/* Settings */}
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
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
