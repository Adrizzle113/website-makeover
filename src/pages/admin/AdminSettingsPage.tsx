import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Save, RefreshCw, AlertTriangle } from "lucide-react";

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  // Platform settings state
  const [platformName, setPlatformName] = useState("TravelHub");
  const [supportEmail, setSupportEmail] = useState("support@travelhub.com");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [defaultCommission, setDefaultCommission] = useState("15");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [agentRegistrations, setAgentRegistrations] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);

  // API settings
  const [apiEndpoint, setApiEndpoint] = useState("https://api.travelhub.com");
  const [rateLimit, setRateLimit] = useState("1000");

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold">Platform Settings</h1>
                  <p className="text-sm text-muted-foreground">
                    Configure platform-wide settings and preferences
                  </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </header>

            <main className="flex-1 p-6">
              <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="commission">Commission</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="api">API Configuration</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Information</CardTitle>
                      <CardDescription>
                        Basic platform configuration and branding
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="platformName">Platform Name</Label>
                          <Input
                            id="platformName"
                            value={platformName}
                            onChange={(e) => setPlatformName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supportEmail">Support Email</Label>
                          <Input
                            id="supportEmail"
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="currency">Default Currency</Label>
                          <Select
                            value={defaultCurrency}
                            onValueChange={setDefaultCurrency}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Default Timezone</Label>
                          <Select defaultValue="utc">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="utc">UTC</SelectItem>
                              <SelectItem value="est">Eastern Time</SelectItem>
                              <SelectItem value="pst">Pacific Time</SelectItem>
                              <SelectItem value="gmt">GMT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Terms & Policies</CardTitle>
                      <CardDescription>
                        Manage platform terms and conditions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="terms">Terms of Service URL</Label>
                        <Input
                          id="terms"
                          placeholder="https://example.com/terms"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="privacy">Privacy Policy URL</Label>
                        <Input
                          id="privacy"
                          placeholder="https://example.com/privacy"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Commission Settings */}
                <TabsContent value="commission" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Default Commission Rates</CardTitle>
                      <CardDescription>
                        Set default commission percentages for agents
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="agentCommission">
                            Agent Commission (%)
                          </Label>
                          <Input
                            id="agentCommission"
                            type="number"
                            value={defaultCommission}
                            onChange={(e) => setDefaultCommission(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subagentCommission">
                            Subagent Commission (%)
                          </Label>
                          <Input
                            id="subagentCommission"
                            type="number"
                            defaultValue="10"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Commission Tiers</h4>
                        <div className="rounded-lg border p-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Bronze (0-50 bookings)</Label>
                              <Input type="number" defaultValue="12" />
                            </div>
                            <div className="space-y-2">
                              <Label>Silver (51-150 bookings)</Label>
                              <Input type="number" defaultValue="15" />
                            </div>
                            <div className="space-y-2">
                              <Label>Gold (150+ bookings)</Label>
                              <Input type="number" defaultValue="18" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Notifications</CardTitle>
                      <CardDescription>
                        Configure which notifications admins receive
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications for platform events
                          </p>
                        </div>
                        <Switch
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Booking Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when bookings are created or cancelled
                            </p>
                          </div>
                          <Switch
                            checked={bookingAlerts}
                            onCheckedChange={setBookingAlerts}
                            disabled={!emailNotifications}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Agent Registrations</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when new agents register
                            </p>
                          </div>
                          <Switch
                            checked={agentRegistrations}
                            onCheckedChange={setAgentRegistrations}
                            disabled={!emailNotifications}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Payment Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified about payment issues
                            </p>
                          </div>
                          <Switch
                            checked={paymentAlerts}
                            onCheckedChange={setPaymentAlerts}
                            disabled={!emailNotifications}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* API Configuration */}
                <TabsContent value="api" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>API Settings</CardTitle>
                      <CardDescription>
                        Configure API endpoints and rate limiting
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiEndpoint">API Endpoint</Label>
                        <Input
                          id="apiEndpoint"
                          value={apiEndpoint}
                          onChange={(e) => setApiEndpoint(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rateLimit">
                          Rate Limit (requests/hour)
                        </Label>
                        <Input
                          id="rateLimit"
                          type="number"
                          value={rateLimit}
                          onChange={(e) => setRateLimit(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                      <CardDescription className="text-amber-700 dark:text-amber-300">
                        These actions are irreversible. Please proceed with caution.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Clear Cache</p>
                          <p className="text-sm text-muted-foreground">
                            Clear all cached data from the platform
                          </p>
                        </div>
                        <Button variant="outline">Clear Cache</Button>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Reset API Keys</p>
                          <p className="text-sm text-muted-foreground">
                            Regenerate all API keys (will invalidate existing keys)
                          </p>
                        </div>
                        <Button variant="destructive">Reset Keys</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
