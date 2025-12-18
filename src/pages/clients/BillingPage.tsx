import { useState } from "react";
import { format } from "date-fns";
import { ClientsLayout, ClientsFilterToolbar } from "@/components/clients";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  FileTextIcon,
  SendIcon,
  CreditCardIcon,
  HistoryIcon,
} from "lucide-react";
import type { ClientBilling } from "@/types/clients";

// Mock data
const mockBilling: ClientBilling[] = [
  {
    id: "bill-1",
    clientId: "1",
    clientName: "Sarah Anderson",
    groupId: "grp-1",
    groupName: "Acme Corporation",
    outstandingBalance: 8500,
    openInvoices: 3,
    overdueInvoices: 1,
    lastPaymentDate: "2025-01-10T14:30:00Z",
    creditLimit: 25000,
  },
  {
    id: "bill-2",
    clientId: "2",
    clientName: "James Mitchell",
    groupName: "Global Finance Team",
    outstandingBalance: 0,
    openInvoices: 0,
    overdueInvoices: 0,
    lastPaymentDate: "2025-01-08T11:00:00Z",
    creditLimit: 15000,
  },
  {
    id: "bill-3",
    clientId: "3",
    clientName: "Marie Dubois",
    outstandingBalance: 4500,
    openInvoices: 2,
    overdueInvoices: 0,
    lastPaymentDate: "2025-01-05T16:45:00Z",
  },
  {
    id: "bill-4",
    clientId: "4",
    clientName: "Ahmed Hassan",
    groupName: "Emirates Business Group",
    outstandingBalance: 12000,
    openInvoices: 4,
    overdueInvoices: 2,
    lastPaymentDate: "2024-12-20T10:20:00Z",
    creditLimit: 50000,
  },
  {
    id: "bill-5",
    groupId: "grp-3",
    groupName: "Johnson Family Reunion",
    outstandingBalance: 2400,
    openInvoices: 1,
    overdueInvoices: 0,
    lastPaymentDate: "2025-01-02T09:00:00Z",
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BillingPage() {
  const [billing] = useState<ClientBilling[]>(mockBilling);
  const [searchFilter, setSearchFilter] = useState("");

  const filteredBilling = billing.filter((item) => {
    return (
      !searchFilter ||
      item.clientName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.groupName?.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  // Summary stats
  const totalOutstanding = billing.reduce((sum, b) => sum + b.outstandingBalance, 0);
  const totalOpenInvoices = billing.reduce((sum, b) => sum + b.openInvoices, 0);
  const totalOverdue = billing.reduce((sum, b) => sum + b.overdueInvoices, 0);

  return (
    <ClientsLayout
      title="Clients"
      description="Manage your client relationships and bookings"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-semibold text-amber-600">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Open Invoices</p>
          <p className="text-2xl font-semibold">{totalOpenInvoices}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Overdue Invoices</p>
          <p className="text-2xl font-semibold text-red-600">{totalOverdue}</p>
        </div>
      </div>

      <ClientsFilterToolbar
        onSearchChange={setSearchFilter}
        showCountryFilter={false}
        showAgentFilter={false}
        searchPlaceholder="Search clients or groups..."
      />

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Client / Group</TableHead>
              <TableHead className="font-semibold text-right">Outstanding</TableHead>
              <TableHead className="font-semibold text-right">Open Invoices</TableHead>
              <TableHead className="font-semibold text-right">Overdue</TableHead>
              <TableHead className="font-semibold">Last Payment</TableHead>
              <TableHead className="font-semibold text-right">Credit Limit</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBilling.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.clientName || item.groupName}</p>
                    {item.clientName && item.groupName && (
                      <p className="text-xs text-muted-foreground">{item.groupName}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={item.outstandingBalance > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                    {formatCurrency(item.outstandingBalance)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">{item.openInvoices}</TableCell>
                <TableCell className="text-right">
                  {item.overdueInvoices > 0 ? (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {item.overdueInvoices}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {item.lastPaymentDate
                    ? format(new Date(item.lastPaymentDate), "MMM d, yyyy")
                    : "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {item.creditLimit ? formatCurrency(item.creditLimit) : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontalIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        Create Invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <SendIcon className="w-4 h-4 mr-2" />
                        Send Reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CreditCardIcon className="w-4 h-4 mr-2" />
                        Apply Credit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <HistoryIcon className="w-4 h-4 mr-2" />
                        Payment History
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ClientsLayout>
  );
}
