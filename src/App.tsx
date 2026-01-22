import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import SearchPage from "./pages/SearchPage";
import ContactPage from "./pages/ContactPage";
import CalculatorPage from "./pages/CalculatorPage";
import HotelDetailsPage from "./pages/HotelDetailsPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import PaymentPage from "./pages/PaymentPage";
import ProcessingPage from "./pages/ProcessingPage";
import Dashboard from "./pages/Dashboard";
import DashboardSearchPage from "./pages/dashboard/SearchPage";
import { TripsListPage, TripDetailsPage } from "./pages/trips";
import { OrderDetailsPage, BookingConfirmationPage } from "./pages/orders";
import { DocumentsViewerPage, DocumentsListPage } from "./pages/documents";
import {
  BookingsReportPage,
  RevenueReportPage,
  InvoicesReportPage,
  PaymentsReportPage,
  ReconciliationReportPage,
  PayoutsReportPage,
  ExportsReportPage,
} from "./pages/reporting";
import {
  AllClientsPage,
  GroupsPage,
  ContactsPage,
  BillingPage,
  ActivityPage,
} from "./pages/clients";
import { SettingsPage } from "./pages/settings";
import {
  AdminDashboard,
  AdminSearchPage,
  AdminReportsPage,
  AgentsPage,
  AdminSettingsPage,
} from "./pages/admin";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Login, Register, EmailVerification, PendingApproval, ForgotPassword, ResetPassword } from "./pages/auth";

import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider delayDuration={0}>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/verify-email" element={<EmailVerification />} />
            <Route path="/auth/pending-approval" element={<PendingApproval />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            {/* Public Routes */}
            <Route path="/" element={<SearchPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            {/* Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/search"
              element={
                <ProtectedRoute>
                  <ErrorBoundary title="Search temporarily unavailable">
                    <DashboardSearchPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/reports"
              element={
                <ProtectedRoute>
                  <Navigate to="/reporting/bookings" replace />
                </ProtectedRoute>
              }
            />
            <Route path="/hoteldetails/:hotelId" element={<HotelDetailsPage />} />
            <Route path="/booking/:hotelId" element={<BookingPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/processing/:partnerOrderId" element={<ProcessingPage />} />
            {/* My Bookings - Dashboard */}
            <Route
              path="/dashboard/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            {/* Trips */}
            <Route
              path="/trips"
              element={
                <ProtectedRoute>
                  <TripsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:orderGroupId"
              element={
                <ProtectedRoute>
                  <TripDetailsPage />
                </ProtectedRoute>
              }
            />
            {/* Orders */}
            <Route
              path="/orders/:orderId"
              element={
                <ProtectedRoute>
                  <OrderDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/orders/:orderId/confirmation" element={<BookingConfirmationPage />} />
            {/* Documents */}
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents/:documentId"
              element={
                <ProtectedRoute>
                  <DocumentsViewerPage />
                </ProtectedRoute>
              }
            />
            {/* Reporting */}
            <Route
              path="/reporting/bookings"
              element={
                <ProtectedRoute>
                  <BookingsReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporting/revenue"
              element={
                <ProtectedRoute>
                  <RevenueReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporting/invoices"
              element={
                <ProtectedRoute>
                  <InvoicesReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporting/payments"
              element={
                <ProtectedRoute>
                  <PaymentsReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporting/reconciliation"
              element={
                <ProtectedRoute>
                  <ReconciliationReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporting/payouts"
              element={
                <ProtectedRoute>
                  <PayoutsReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporting/exports"
              element={
                <ProtectedRoute>
                  <ExportsReportPage />
                </ProtectedRoute>
              }
            />
            {/* Clients */}
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <AllClientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/groups"
              element={
                <ProtectedRoute>
                  <GroupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/contacts"
              element={
                <ProtectedRoute>
                  <ContactsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/billing"
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/activity"
              element={
                <ProtectedRoute>
                  <ActivityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/clients"
              element={
                <ProtectedRoute>
                  <Navigate to="/clients" replace />
                </ProtectedRoute>
              }
            />
            {/* Settings */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            {/* Admin */}
            <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/search" element={<AdminProtectedRoute><AdminSearchPage /></AdminProtectedRoute>} />
            <Route path="/admin/reports" element={<AdminProtectedRoute><AdminReportsPage /></AdminProtectedRoute>} />
            <Route path="/admin/agents" element={<AdminProtectedRoute><AgentsPage /></AdminProtectedRoute>} />
            <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettingsPage /></AdminProtectedRoute>} />
            <Route path="/admin/contract" element={<Navigate to="/settings" replace />} />
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
