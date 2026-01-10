import { useState, useEffect } from "react";
import { useClockFormat } from "@/hooks/useClockFormat";
import { useTimezone } from "@/hooks/useTimezone";
import { useLanguage } from "@/hooks/useLanguage";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  UserIcon,
  BellIcon,
  ShieldIcon,
  CreditCardIcon,
  GlobeIcon,
  PaletteIcon,
  KeyIcon,
  BuildingIcon,
  CodeIcon,
  DatabaseIcon,
  AlertTriangleIcon,
  DownloadIcon,
  Trash2Icon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  CopyIcon,
  MonitorIcon,
  SmartphoneIcon,
  FileTextIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  CalendarIcon,
  DollarSignIcon,
  MapPinIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@agency.com",
    phone: "+1 555-0123",
    company: "Travel Agency Inc.",
    role: "Senior Agent",
  });

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailPayments: true,
    emailMarketing: false,
    pushBookings: true,
    pushPayments: true,
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "America/New_York",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    clockFormat: "24h" as "12h" | "24h",
  });

  const [company, setCompany] = useState({
    name: "Travel Agency Inc.",
    legalName: "Travel Agency Incorporated LLC",
    taxId: "12-3456789",
    address: "123 Business District, Suite 500",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "United States",
    phone: "+1 (555) 123-4567",
    email: "info@travelagency.com",
    website: "www.travelagency.com",
  });

  const [contract] = useState({
    agreement: {
      number: "AGR-2024-00145",
      date: "2024-01-15",
      status: "active",
      type: "Standard B2B Partner Agreement",
      expiryDate: "2026-01-15",
      autoRenewal: true,
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
      creditStatus: "good" as "success" | "warning" | "critical",
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
  });

  const [apiConfig, setApiConfig] = useState({
    environment: "production",
    apiKey: "••••••••••••••••••••",
    apiSecret: "••••••••••••••••••••",
    webhookUrl: "https://api.travelagency.com/webhooks/ratehawk",
    lastTestAt: "2025-01-10T14:30:00Z",
    testStatus: "success" as "success" | "failed" | "pending",
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Mock active sessions
  const [sessions] = useState([
    { id: "1", device: "Chrome on macOS", location: "New York, US", lastActive: "Now", current: true, type: "desktop" },
    { id: "2", device: "Safari on iPhone", location: "New York, US", lastActive: "2 hours ago", current: false, type: "mobile" },
    { id: "3", device: "Firefox on Windows", location: "Boston, US", lastActive: "1 day ago", current: false, type: "desktop" },
  ]);

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const { clockFormat: storedClockFormat, setClockFormat: saveClockFormat } = useClockFormat();
  const { timezone: storedTimezone, setTimezone: saveTimezone } = useTimezone();

  // Language preference hook
  const { language: storedLanguage, setLanguage: saveLanguage } = useLanguage();

  // Sync preferences with hooks on mount
  useEffect(() => {
    setPreferences(prev => ({ 
      ...prev, 
      language: storedLanguage,
      clockFormat: storedClockFormat,
      timezone: storedTimezone 
    }));
  }, [storedLanguage, storedClockFormat, storedTimezone]);

  const handleSavePreferences = () => {
    saveLanguage(preferences.language);
    saveClockFormat(preferences.clockFormat);
    saveTimezone(preferences.timezone);
    toast.success("Preferences saved");
  };

  const handleSaveCompany = () => {
    toast.success("Company information saved");
  };

  const handleSaveApiConfig = () => {
    toast.success("API configuration saved");
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsTestingConnection(false);
    setApiConfig({ ...apiConfig, testStatus: "success", lastTestAt: new Date().toISOString() });
    toast.success("API connection test successful");
  };

  const handleExportData = (type: string) => {
    toast.success(`Exporting ${type} data...`);
  };

  const handleRevokeSession = (sessionId: string) => {
    toast.success("Session revoked successfully");
  };

  const handleRevokeAllSessions = () => {
    toast.success("All other sessions have been revoked");
  };

  const handleDeleteAccount = () => {
    toast.error("This action is irreversible. Please contact support.");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger className="-ml-2" />
              <div className="flex-1">
                <h1 className="text-2xl font-heading font-semibold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6 max-w-4xl">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="flex flex-wrap gap-1 w-full h-auto p-1">
                <TabsTrigger value="profile" className="gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="company" className="gap-2">
                  <BuildingIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Company</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <BellIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2">
                  <GlobeIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Preferences</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <ShieldIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-2">
                  <DatabaseIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Data</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="rounded-lg border border-border bg-card p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Profile Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your personal details and contact information.
                    </p>
                  </div>

                  <Separator />

                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {profile.firstName[0]}{profile.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm">Change Avatar</Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG or GIF. Max 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={profile.role}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                  </div>
                </div>
              </TabsContent>

              {/* Company Tab */}
              <TabsContent value="company" className="space-y-6">
                {/* Company Information Card */}
                <div className="rounded-lg border border-border bg-card p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Company Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your company details and business information.
                    </p>
                  </div>

                  <Separator />

                  {/* Logo */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                      <BuildingIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <Button variant="outline" size="sm">Upload Logo</Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG or SVG. Recommended: 200x200px.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={company.name}
                        onChange={(e) => setCompany({ ...company, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legalName">Legal Name</Label>
                      <Input
                        id="legalName"
                        value={company.legalName}
                        onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID / EIN</Label>
                      <Input
                        id="taxId"
                        value={company.taxId}
                        onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Phone</Label>
                      <Input
                        id="companyPhone"
                        value={company.phone}
                        onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={company.email}
                        onChange={(e) => setCompany({ ...company, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={company.website}
                        onChange={(e) => setCompany({ ...company, website: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-4">Business Address</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          value={company.address}
                          onChange={(e) => setCompany({ ...company, address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={company.city}
                          onChange={(e) => setCompany({ ...company, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State / Province</Label>
                        <Input
                          id="state"
                          value={company.state}
                          onChange={(e) => setCompany({ ...company, state: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={company.postalCode}
                          onChange={(e) => setCompany({ ...company, postalCode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={company.country}
                          onValueChange={(value) => setCompany({ ...company, country: value })}
                        >
                          <SelectTrigger id="country">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                            <SelectItem value="Germany">Germany</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                            <SelectItem value="UAE">United Arab Emirates</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveCompany}>Save Changes</Button>
                  </div>
                </div>

                {/* Agreement Details Card */}
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
                        <p className="font-mono font-medium">{contract.agreement.number}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Agreement Type</p>
                        <p className="font-medium">{contract.agreement.type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Agreement Date</p>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium">{format(new Date(contract.agreement.date), "MMMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Expiry Date</p>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium">{format(new Date(contract.agreement.expiryDate), "MMMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Auto Renewal</p>
                        <div className="flex items-center gap-2">
                          {contract.agreement.autoRenewal ? (
                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
                          )}
                          <p className="font-medium">{contract.agreement.autoRenewal ? "Enabled" : "Disabled"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Summary Card */}
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
                        <span className="font-medium text-emerald-600">
                          {contract.financial.currency} {contract.financial.currentBalance.toLocaleString()} remaining
                        </span>
                      </div>
                      <Progress 
                        value={((contract.financial.creditLimit - contract.financial.currentBalance) / contract.financial.creditLimit) * 100} 
                        className="h-3"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Used: {contract.financial.currency} {(contract.financial.creditLimit - contract.financial.currentBalance).toLocaleString()}</span>
                        <span>Limit: {contract.financial.currency} {contract.financial.creditLimit.toLocaleString()}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                        <p className="text-sm text-muted-foreground">Deposit</p>
                        <p className="text-xl font-semibold">
                          {contract.financial.currency} {contract.financial.depositAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                        <p className="text-sm text-muted-foreground">Credit Limit</p>
                        <p className="text-xl font-semibold">
                          {contract.financial.currency} {contract.financial.creditLimit.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-emerald-500/10 space-y-1">
                        <p className="text-sm text-muted-foreground">Available Balance</p>
                        <p className="text-xl font-semibold text-emerald-600">
                          {contract.financial.currency} {contract.financial.currentBalance.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-amber-500/10 space-y-1">
                        <p className="text-sm text-muted-foreground">Pending Payments</p>
                        <p className="text-xl font-semibold text-amber-600">
                          {contract.financial.currency} {contract.financial.pendingPayments.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Last payment: {contract.financial.currency} {contract.financial.lastPaymentAmount.toLocaleString()} on{" "}
                      {format(new Date(contract.financial.lastPaymentDate), "MMMM d, yyyy")}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Terms & Support Cards */}
                <div className="grid gap-6 lg:grid-cols-2">
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
                          <p className="font-medium">{contract.paymentTerms.paymentMethod}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Payment Terms</p>
                          <p className="font-medium">Net {contract.paymentTerms.paymentTermDays} days</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Invoice Frequency</p>
                          <p className="font-medium">{contract.paymentTerms.invoiceFrequency}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Bank Details</p>
                        <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank Name</span>
                            <span className="font-medium">{contract.paymentTerms.bankName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Account Name</span>
                            <span className="font-medium">{contract.paymentTerms.accountName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Account Number</span>
                            <span className="font-mono">{contract.paymentTerms.accountNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SWIFT Code</span>
                            <span className="font-mono">{contract.paymentTerms.swiftCode}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Support Contacts */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="w-5 h-5 text-primary" />
                        <CardTitle>Support Contacts</CardTitle>
                      </div>
                      <CardDescription>Your dedicated support team</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Account Manager */}
                      <div className="p-4 rounded-lg border border-border space-y-2">
                        <p className="text-sm font-medium">Account Manager</p>
                        <p className="font-medium">{contract.support.accountManager.name}</p>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MailIcon className="w-4 h-4" />
                            {contract.support.accountManager.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4" />
                            {contract.support.accountManager.phone}
                          </div>
                        </div>
                      </div>

                      {/* Technical Support */}
                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Technical Support</p>
                          <Badge variant="outline">{contract.support.technicalSupport.hours}</Badge>
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MailIcon className="w-4 h-4" />
                            {contract.support.technicalSupport.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4" />
                            {contract.support.technicalSupport.phone}
                          </div>
                        </div>
                      </div>

                      {/* Billing Support */}
                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Billing Support</p>
                          <Badge variant="outline">{contract.support.billingSupport.hours}</Badge>
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MailIcon className="w-4 h-4" />
                            {contract.support.billingSupport.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4" />
                            {contract.support.billingSupport.phone}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <div className="rounded-lg border border-border bg-card p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Notification Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose how you want to be notified about activity.
                    </p>
                  </div>

                  <Separator />

                  {/* Email Notifications */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Email Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Booking Updates</p>
                          <p className="text-xs text-muted-foreground">
                            Receive emails about booking confirmations and changes
                          </p>
                        </div>
                        <Switch
                          checked={notifications.emailBookings}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, emailBookings: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Payment Notifications</p>
                          <p className="text-xs text-muted-foreground">
                            Receive emails about payments and invoices
                          </p>
                        </div>
                        <Switch
                          checked={notifications.emailPayments}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, emailPayments: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Marketing & Promotions</p>
                          <p className="text-xs text-muted-foreground">
                            Receive emails about new features and offers
                          </p>
                        </div>
                        <Switch
                          checked={notifications.emailMarketing}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, emailMarketing: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Push Notifications */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Push Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Booking Alerts</p>
                          <p className="text-xs text-muted-foreground">
                            Get instant notifications for booking activity
                          </p>
                        </div>
                        <Switch
                          checked={notifications.pushBookings}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, pushBookings: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Payment Alerts</p>
                          <p className="text-xs text-muted-foreground">
                            Get instant notifications for payment activity
                          </p>
                        </div>
                        <Switch
                          checked={notifications.pushPayments}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, pushPayments: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotifications}>Save Preferences</Button>
                  </div>
                </div>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences">
                <div className="rounded-lg border border-border bg-card p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Regional Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Set your language, timezone, and display preferences.
                    </p>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, language: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover max-h-[300px]">
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية (Arabic)</SelectItem>
                          <SelectItem value="bg">Български (Bulgarian)</SelectItem>
                          <SelectItem value="cs">Čeština (Czech)</SelectItem>
                          <SelectItem value="da">Dansk (Danish)</SelectItem>
                          <SelectItem value="de">Deutsch (German)</SelectItem>
                          <SelectItem value="el">Ελληνικά (Greek)</SelectItem>
                          <SelectItem value="es">Español (Spanish)</SelectItem>
                          <SelectItem value="fi">Suomi (Finnish)</SelectItem>
                          <SelectItem value="fr">Français (French)</SelectItem>
                          <SelectItem value="he">עברית (Hebrew)</SelectItem>
                          <SelectItem value="hu">Magyar (Hungarian)</SelectItem>
                          <SelectItem value="it">Italiano (Italian)</SelectItem>
                          <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                          <SelectItem value="kk">Қазақша (Kazakh)</SelectItem>
                          <SelectItem value="ko">한국어 (Korean)</SelectItem>
                          <SelectItem value="nl">Nederlands (Dutch)</SelectItem>
                          <SelectItem value="no">Norsk (Norwegian)</SelectItem>
                          <SelectItem value="pl">Polski (Polish)</SelectItem>
                          <SelectItem value="pt">Português (Portuguese)</SelectItem>
                          <SelectItem value="pt_PT">Português - Portugal</SelectItem>
                          <SelectItem value="ro">Română (Romanian)</SelectItem>
                          <SelectItem value="ru">Русский (Russian)</SelectItem>
                          <SelectItem value="sq">Shqip (Albanian)</SelectItem>
                          <SelectItem value="sr">Српски (Serbian)</SelectItem>
                          <SelectItem value="sv">Svenska (Swedish)</SelectItem>
                          <SelectItem value="th">ไทย (Thai)</SelectItem>
                          <SelectItem value="tr">Türkçe (Turkish)</SelectItem>
                          <SelectItem value="uk">Українська (Ukrainian)</SelectItem>
                          <SelectItem value="vi">Tiếng Việt (Vietnamese)</SelectItem>
                          <SelectItem value="zh_CN">简体中文 (Simplified Chinese)</SelectItem>
                          <SelectItem value="zh_TW">繁體中文 (Traditional Chinese)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, timezone: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                          <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Currency</Label>
                      <Select
                        value={preferences.currency}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, currency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                          <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Select
                        value={preferences.dateFormat}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, dateFormat: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Clock Format</Label>
                      <Select
                        value={preferences.clockFormat}
                        onValueChange={(value: "12h" | "24h") =>
                          setPreferences({ ...preferences, clockFormat: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="24h">24-hour (14:00)</SelectItem>
                          <SelectItem value="12h">12-hour (2:00 PM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSavePreferences}>Save Preferences</Button>
                  </div>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <div className="space-y-6">
                  {/* Password */}
                  <div className="rounded-lg border border-border bg-card p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your password to keep your account secure.
                      </p>
                    </div>

                    <Separator />

                    <div className="grid gap-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button>Update Password</Button>
                    </div>
                  </div>

                  {/* Two-Factor */}
                  <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account.
                        </p>
                      </div>
                      <Button variant="outline">
                        <KeyIcon className="w-4 h-4 mr-2" />
                        Enable 2FA
                      </Button>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Active Sessions</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your active sessions across devices.
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              {session.type === "desktop" ? (
                                <MonitorIcon className="w-4 h-4 text-primary" />
                              ) : (
                                <SmartphoneIcon className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{session.device}</p>
                              <p className="text-xs text-muted-foreground">
                                {session.location} • {session.lastActive}
                              </p>
                            </div>
                          </div>
                          {session.current ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Current
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRevokeSession(session.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button 
                      variant="outline" 
                      className="text-destructive hover:text-destructive"
                      onClick={handleRevokeAllSessions}
                    >
                      Sign Out All Other Sessions
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Data & Privacy Tab */}
              <TabsContent value="data">
                <div className="space-y-6">
                  {/* Export Data */}
                  <div className="rounded-lg border border-border bg-card p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Export Your Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Download a copy of your data stored in the system.
                      </p>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 rounded-lg border border-border space-y-3">
                        <div className="flex items-center gap-2">
                          <DownloadIcon className="w-5 h-5 text-primary" />
                          <h4 className="font-medium">Booking History</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Export all your booking records as CSV or PDF.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => handleExportData("bookings")}>
                          Export Bookings
                        </Button>
                      </div>
                      <div className="p-4 rounded-lg border border-border space-y-3">
                        <div className="flex items-center gap-2">
                          <DownloadIcon className="w-5 h-5 text-primary" />
                          <h4 className="font-medium">Financial Reports</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Export invoices, payments, and financial summaries.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => handleExportData("financial")}>
                          Export Financial Data
                        </Button>
                      </div>
                      <div className="p-4 rounded-lg border border-border space-y-3">
                        <div className="flex items-center gap-2">
                          <DownloadIcon className="w-5 h-5 text-primary" />
                          <h4 className="font-medium">Client Data</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Export your client and guest information.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => handleExportData("clients")}>
                          Export Clients
                        </Button>
                      </div>
                      <div className="p-4 rounded-lg border border-border space-y-3">
                        <div className="flex items-center gap-2">
                          <DownloadIcon className="w-5 h-5 text-primary" />
                          <h4 className="font-medium">Complete Archive</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Download all your data in a single ZIP archive.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => handleExportData("all")}>
                          Export All Data
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Data Retention */}
                  <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Data Retention</h3>
                      <p className="text-sm text-muted-foreground">
                        Information about how long we keep your data.
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Booking Records</span>
                        <span className="font-medium">7 years (legal requirement)</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Financial Documents</span>
                        <span className="font-medium">7 years (legal requirement)</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Activity Logs</span>
                        <span className="font-medium">90 days</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Session Data</span>
                        <span className="font-medium">30 days after logout</span>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 space-y-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangleIcon className="w-5 h-5 text-destructive" />
                      <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                    </div>

                    <Separator className="bg-destructive/20" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Delete All Booking Data</p>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete all your booking history. This cannot be undone.
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                              Delete Data
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete All Booking Data?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete all your booking records, including confirmations and vouchers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => toast.error("Please contact support to delete data")}
                              >
                                Delete All Data
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <Separator className="bg-destructive/20" />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Close Account</p>
                          <p className="text-sm text-muted-foreground">
                            Permanently close your account and delete all associated data.
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                              <Trash2Icon className="w-4 h-4 mr-2" />
                              Close Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Close Your Account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action is irreversible. Your account, all bookings, financial records, and associated data will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDeleteAccount}
                              >
                                Close Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
