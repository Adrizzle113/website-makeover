import { useState } from "react";
import { format } from "date-fns";
import { WalletIcon, CheckCircleIcon, ClockIcon, DownloadIcon, PlusIcon, MoreHorizontalIcon } from "lucide-react";
import { ReportingLayout, ReportingFilterToolbar, StatusBadge } from "@/components/reporting";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReportingFilters, PayoutEntry } from "@/types/reporting";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Mock data
const mockPayouts: PayoutEntry[] = [
  {
    id: "PO-001",
    agentId: "a1",
    agentName: "Sarah Johnson",
    period: "January 2025",
    commissionEarned: 5200,
    adjustments: -150,
    netPayout: 5050,
    currency: "USD",
    status: "available",
    payoutMethod: "Bank Transfer",
    createdAt: "2025-01-31T00:00:00Z",
  },
  {
    id: "PO-002",
    agentId: "a2",
    agentName: "Michael Chen",
    period: "January 2025",
    commissionEarned: 4320,
    adjustments: 0,
    netPayout: 4320,
    currency: "USD",
    status: "pending",
    payoutMethod: "Bank Transfer",
    createdAt: "2025-01-31T00:00:00Z",
  },
  {
    id: "PO-003",
    agentId: "a3",
    agentName: "John Smith",
    period: "January 2025",
    commissionEarned: 3064,
    adjustments: 200,
    netPayout: 3264,
    currency: "USD",
    status: "paid",
    paidAt: "2025-02-05T10:00:00Z",
    payoutMethod: "Bank Transfer",
    createdAt: "2025-01-31T00:00:00Z",
  },
  {
    id: "PO-004",
    agentId: "a1",
    agentName: "Sarah Johnson",
    subagentId: "s1",
    subagentName: "Alice Brown",
    period: "January 2025",
    commissionEarned: 1200,
    adjustments: 0,
    netPayout: 1200,
    currency: "USD",
    status: "available",
    payoutMethod: "Bank Transfer",
    createdAt: "2025-01-31T00:00:00Z",
  },
  {
    id: "PO-005",
    agentId: "a2",
    agentName: "Michael Chen",
    subagentId: "s2",
    subagentName: "David Wilson",
    period: "December 2024",
    commissionEarned: 2800,
    adjustments: -100,
    netPayout: 2700,
    currency: "USD",
    status: "paid",
    paidAt: "2025-01-10T14:30:00Z",
    payoutMethod: "Bank Transfer",
    createdAt: "2024-12-31T00:00:00Z",
  },
];

// Calculate totals
const availableTotal = mockPayouts.filter(p => p.status === "available").reduce((sum, p) => sum + p.netPayout, 0);
const pendingTotal = mockPayouts.filter(p => p.status === "pending").reduce((sum, p) => sum + p.netPayout, 0);
const paidTotal = mockPayouts.filter(p => p.status === "paid").reduce((sum, p) => sum + p.netPayout, 0);

export function PayoutsReportPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});

  const handleCreatePayout = () => {
    toast({
      title: "Create payout",
      description: "Payout creation dialog would open here.",
    });
  };

  const handleMarkPaid = (payout: PayoutEntry) => {
    toast({
      title: "Payout marked as paid",
      description: `Payout ${payout.id} for ${payout.agentName} has been marked as paid.`,
    });
  };

  const handleExportStatement = (payout: PayoutEntry) => {
    toast({
      title: "Exporting statement",
      description: `Payout statement for ${payout.agentName} is being generated.`,
    });
  };

  return (
    <ReportingLayout title="Payouts" description="Manage agent commissions and payouts">
      <ReportingFilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
        userRole="admin"
        showPaymentFilters={false}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <WalletIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-semibold font-mono text-emerald-600">
                USD {availableTotal.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <ClockIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold font-mono text-amber-600">
                USD {pendingTotal.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <CheckCircleIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid Out</p>
              <p className="text-2xl font-semibold font-mono">
                USD {paidTotal.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 flex items-center justify-center">
          <CardContent className="pt-6">
            <Button onClick={handleCreatePayout} className="gap-2">
              <PlusIcon className="w-4 h-4" />
              Create Payout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs by Status */}
      <Tabs defaultValue="all" className="mt-8">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">All Payouts</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        {["all", "available", "pending", "paid"].map((tabValue) => {
          const filteredPayouts = tabValue === "all" 
            ? mockPayouts 
            : mockPayouts.filter(p => p.status === tabValue);
            
          return (
            <TabsContent key={tabValue} value={tabValue} className="mt-4">
              <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Agent / Subagent</TableHead>
                      <TableHead className="font-semibold">Period</TableHead>
                      <TableHead className="font-semibold text-right">Commission</TableHead>
                      <TableHead className="font-semibold text-right">Adjustments</TableHead>
                      <TableHead className="font-semibold text-right">Net Payout</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Method</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payout.agentName}</p>
                            {payout.subagentName && (
                              <p className="text-sm text-muted-foreground">↳ {payout.subagentName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{payout.period}</TableCell>
                        <TableCell className="text-right font-mono">
                          {payout.currency} {payout.commissionEarned.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={cn(
                            payout.adjustments < 0 ? "text-red-600" : payout.adjustments > 0 ? "text-emerald-600" : ""
                          )}>
                            {payout.adjustments > 0 ? "+" : ""}{payout.currency} {payout.adjustments.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {payout.currency} {payout.netPayout.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={payout.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payout.payoutMethod}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontalIcon className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleExportStatement(payout)}>
                                <DownloadIcon className="w-4 h-4 mr-2" />
                                Export Statement
                              </DropdownMenuItem>
                              {payout.status !== "paid" && (
                                <DropdownMenuItem onClick={() => handleMarkPaid(payout)}>
                                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredPayouts.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    No payouts found in this category.
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </ReportingLayout>
  );
}
