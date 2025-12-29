import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileTextIcon,
  BuildingIcon,
  CreditCardIcon,
  PhoneIcon,
  MailIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  DollarSignIcon,
  UserIcon,
  MapPinIcon,
  GlobeIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Mock contract data
const mockContractData = {
  agreement: {
    number: "AGR-2024-00145",
    date: "2024-01-15",
    status: "active",
    type: "Standard B2B Partner Agreement",
    expiryDate: "2026-01-15",
    autoRenewal: true,
  },
  legalEntity: {
    companyName: "Travel Agency Inc.",
    legalName: "Travel Agency Incorporated LLC",
    taxpayerId: "12-3456789",
    registrationNumber: "LLC-2020-123456",
    registeredAddress: "123 Business District, Suite 500, New York, NY 10001, USA",
    operatingAddress: "456 Travel Hub, Floor 3, New York, NY 10005, USA",
    country: "United States",
    phone: "+1 (555) 123-4567",
    email: "contracts@travelagency.com",
    website: "www.travelagency.com",
  },
  financial: {
    depositAmount: 50000,
    creditLimit: 150000,
    currentBalance: 42350,
    outstandingDebt: 0,
    pendingPayments: 12500,
    currency: "USD",
    lastPaymentDate: "2025-01-10",
    lastPaymentAmount: 25000,
    creditStatus: "good", // good, warning, critical
  },
  paymentTerms: {
    paymentMethod: "Bank Transfer",
    paymentTermDays: 30,
    invoiceFrequency: "Weekly",
    bankName: "First National Bank",
    accountName: "Travel Agency Inc.",
    accountNumber: "****4567",
    routingNumber: "****1234",
    swiftCode: "FNBKUS33",
  },
  support: {
    accountManager: {
      name: "Sarah Johnson",
      email: "sarah.johnson@ratehawk.com",
      phone: "+1 (555) 987-6543",
      photo: "",
    },
    technicalSupport: {
      email: "api-support@ratehawk.com",
      phone: "+1 (555) 888-9999",
      hours: "24/7",
    },
    billingSupport: {
      email: "billing@ratehawk.com",
      phone: "+1 (555) 777-8888",
      hours: "Mon-Fri 9AM-6PM EST",
    },
  },
};

export default function ContractInfoPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const data = mockContractData;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success("Contract information refreshed");
  };

  const creditUsagePercent = ((data.financial.creditLimit - data.financial.currentBalance) / data.financial.creditLimit) * 100;
  const creditRemaining = data.financial.currentBalance;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case "expired":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCreditStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-emerald-600";
      case "warning":
        return "text-amber-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="-ml-2" />
                <div className="flex-1">
                  <h1 className="text-2xl font-heading font-semibold text-foreground">Contract Information</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    View your agreement details and financial status
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCwIcon className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="p-6 space-y-6">
            {/* Agreement Details */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="w-5 h-5 text-primary" />
                  <CardTitle>Agreement Details</CardTitle>
                </div>
                <CardDescription>Your current contract and agreement information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Agreement Number</p>
                    <p className="font-mono font-medium">{data.agreement.number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div>{getStatusBadge(data.agreement.status)}</div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Agreement Type</p>
                    <p className="font-medium">{data.agreement.type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Agreement Date</p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{format(new Date(data.agreement.date), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{format(new Date(data.agreement.expiryDate), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Auto Renewal</p>
                    <div className="flex items-center gap-2">
                      {data.agreement.autoRenewal ? (
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
                      )}
                      <p className="font-medium">{data.agreement.autoRenewal ? "Enabled" : "Disabled"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-primary" />
                  <CardTitle>Financial Summary</CardTitle>
                </div>
                <CardDescription>Your credit status and account balance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Credit Usage Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Credit Usage</span>
                    <span className={`font-medium ${getCreditStatusColor(data.financial.creditStatus)}`}>
                      {data.financial.currency} {creditRemaining.toLocaleString()} remaining
                    </span>
                  </div>
                  <Progress 
                    value={creditUsagePercent} 
                    className="h-3"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Used: {data.financial.currency} {(data.financial.creditLimit - data.financial.currentBalance).toLocaleString()}</span>
                    <span>Limit: {data.financial.currency} {data.financial.creditLimit.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-sm text-muted-foreground">Deposit</p>
                    <p className="text-xl font-semibold">
                      {data.financial.currency} {data.financial.depositAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-sm text-muted-foreground">Credit Limit</p>
                    <p className="text-xl font-semibold">
                      {data.financial.currency} {data.financial.creditLimit.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-500/10 space-y-1">
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-xl font-semibold text-emerald-600">
                      {data.financial.currency} {data.financial.currentBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/10 space-y-1">
                    <p className="text-sm text-muted-foreground">Pending Payments</p>
                    <p className="text-xl font-semibold text-amber-600">
                      {data.financial.currency} {data.financial.pendingPayments.toLocaleString()}
                    </p>
                  </div>
                </div>

                {data.financial.outstandingDebt > 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangleIcon className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-600">Outstanding Debt</p>
                      <p className="text-sm text-muted-foreground">
                        You have {data.financial.currency} {data.financial.outstandingDebt.toLocaleString()} overdue. Please settle immediately.
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" className="ml-auto">
                      Pay Now
                    </Button>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Last payment: {data.financial.currency} {data.financial.lastPaymentAmount.toLocaleString()} on{" "}
                  {format(new Date(data.financial.lastPaymentDate), "MMMM d, yyyy")}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Legal Entity Information */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="w-5 h-5 text-primary" />
                    <CardTitle>Legal Entity</CardTitle>
                  </div>
                  <CardDescription>Your company registration details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-medium">{data.legalEntity.companyName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Legal Name</p>
                    <p className="font-medium">{data.legalEntity.legalName}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Taxpayer ID</p>
                      <p className="font-mono">{data.legalEntity.taxpayerId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Registration No.</p>
                      <p className="font-mono">{data.legalEntity.registrationNumber}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPinIcon className="w-4 h-4" />
                      Registered Address
                    </div>
                    <p className="text-sm">{data.legalEntity.registeredAddress}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPinIcon className="w-4 h-4" />
                      Operating Address
                    </div>
                    <p className="text-sm">{data.legalEntity.operatingAddress}</p>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                      {data.legalEntity.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <MailIcon className="w-4 h-4 text-muted-foreground" />
                      {data.legalEntity.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <GlobeIcon className="w-4 h-4 text-muted-foreground" />
                      {data.legalEntity.website}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Terms */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <DollarSignIcon className="w-5 h-5 text-primary" />
                    <CardTitle>Payment Terms</CardTitle>
                  </div>
                  <CardDescription>Payment methods and banking details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium">{data.paymentTerms.paymentMethod}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Payment Terms</p>
                      <p className="font-medium">Net {data.paymentTerms.paymentTermDays} days</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Invoice Frequency</p>
                      <p className="font-medium">{data.paymentTerms.invoiceFrequency}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Bank Details</p>
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Name</span>
                        <span className="font-medium">{data.paymentTerms.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Name</span>
                        <span className="font-medium">{data.paymentTerms.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number</span>
                        <span className="font-mono">{data.paymentTerms.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Routing Number</span>
                        <span className="font-mono">{data.paymentTerms.routingNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SWIFT Code</span>
                        <span className="font-mono">{data.paymentTerms.swiftCode}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Support Contacts */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5 text-primary" />
                  <CardTitle>Support Contacts</CardTitle>
                </div>
                <CardDescription>Your dedicated support team contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Account Manager */}
                  <div className="p-4 rounded-lg border border-border bg-card space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{data.support.accountManager.name}</p>
                        <p className="text-sm text-muted-foreground">Account Manager</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <a 
                        href={`mailto:${data.support.accountManager.email}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <MailIcon className="w-4 h-4" />
                        {data.support.accountManager.email}
                      </a>
                      <a 
                        href={`tel:${data.support.accountManager.phone}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <PhoneIcon className="w-4 h-4" />
                        {data.support.accountManager.phone}
                      </a>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <MailIcon className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </div>

                  {/* Technical Support */}
                  <div className="p-4 rounded-lg border border-border bg-card space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <ExternalLinkIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Technical Support</p>
                        <p className="text-sm text-muted-foreground">{data.support.technicalSupport.hours}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <a 
                        href={`mailto:${data.support.technicalSupport.email}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <MailIcon className="w-4 h-4" />
                        {data.support.technicalSupport.email}
                      </a>
                      <a 
                        href={`tel:${data.support.technicalSupport.phone}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <PhoneIcon className="w-4 h-4" />
                        {data.support.technicalSupport.phone}
                      </a>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLinkIcon className="w-4 h-4 mr-2" />
                      API Docs
                    </Button>
                  </div>

                  {/* Billing Support */}
                  <div className="p-4 rounded-lg border border-border bg-card space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CreditCardIcon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">Billing Support</p>
                        <p className="text-sm text-muted-foreground">{data.support.billingSupport.hours}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <a 
                        href={`mailto:${data.support.billingSupport.email}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <MailIcon className="w-4 h-4" />
                        {data.support.billingSupport.email}
                      </a>
                      <a 
                        href={`tel:${data.support.billingSupport.phone}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <PhoneIcon className="w-4 h-4" />
                        {data.support.billingSupport.phone}
                      </a>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <CreditCardIcon className="w-4 h-4 mr-2" />
                      View Invoices
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
