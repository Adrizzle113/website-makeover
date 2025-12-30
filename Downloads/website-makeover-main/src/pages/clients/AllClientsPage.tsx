import { useState } from "react";
import { ClientsLayout, ClientDrawer, ClientsFilterToolbar } from "@/components/clients";
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
import { PlusIcon, MoreHorizontalIcon, UserIcon, UsersIcon, ArchiveIcon } from "lucide-react";
import type { Client, ClientStatus } from "@/types/clients";

// Mock data
const mockClients: Client[] = [
  {
    id: "1",
    name: "Sarah Anderson",
    email: "sarah.anderson@techcorp.com",
    phone: "+1 555-0123",
    company: "TechCorp Inc.",
    country: "United States",
    defaultResidency: "US",
    defaultCitizenship: "US",
    preferredCurrency: "USD",
    assignedAgentId: "agent-1",
    assignedAgentName: "John Doe",
    assignedSubagentId: "subagent-1",
    assignedSubagentName: "Mike Wilson",
    status: "active",
    totalBookings: 24,
    totalSpend: 45600,
    avgBookingValue: 1900,
    outstandingBalance: 2100,
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2025-01-10T14:30:00Z",
  },
  {
    id: "2",
    name: "James Mitchell",
    email: "james.m@globalfinance.co.uk",
    phone: "+44 20 7946 0958",
    company: "Global Finance Ltd",
    country: "United Kingdom",
    defaultResidency: "UK",
    preferredCurrency: "GBP",
    assignedAgentId: "agent-2",
    assignedAgentName: "Jane Smith",
    status: "active",
    totalBookings: 18,
    totalSpend: 32400,
    avgBookingValue: 1800,
    outstandingBalance: 0,
    createdAt: "2024-08-20T09:15:00Z",
    updatedAt: "2025-01-08T11:00:00Z",
  },
  {
    id: "3",
    name: "Marie Dubois",
    email: "marie.dubois@luxurytravel.fr",
    company: "Luxury Travel France",
    country: "France",
    preferredCurrency: "EUR",
    assignedAgentId: "agent-1",
    assignedAgentName: "John Doe",
    status: "active",
    totalBookings: 42,
    totalSpend: 89500,
    avgBookingValue: 2131,
    outstandingBalance: 4500,
    createdAt: "2024-03-10T14:00:00Z",
    updatedAt: "2025-01-12T16:45:00Z",
  },
  {
    id: "4",
    name: "Ahmed Hassan",
    email: "ahmed.h@emiratesbiz.ae",
    company: "Emirates Business Group",
    country: "UAE",
    preferredCurrency: "AED",
    assignedAgentId: "agent-3",
    assignedAgentName: "Mike Johnson",
    status: "active",
    totalBookings: 15,
    totalSpend: 67800,
    avgBookingValue: 4520,
    outstandingBalance: 12000,
    createdAt: "2024-09-01T08:30:00Z",
    updatedAt: "2025-01-05T10:20:00Z",
  },
  {
    id: "5",
    name: "Elena Rodriguez",
    email: "elena.r@ibericahotels.es",
    company: "Iberica Hotels Chain",
    country: "Spain",
    preferredCurrency: "EUR",
    assignedAgentId: "agent-2",
    assignedAgentName: "Jane Smith",
    status: "inactive",
    totalBookings: 8,
    totalSpend: 12300,
    avgBookingValue: 1538,
    outstandingBalance: 0,
    createdAt: "2024-11-15T12:00:00Z",
    updatedAt: "2024-12-20T09:00:00Z",
  },
];

const formatCurrency = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AllClientsPage() {
  const [clients] = useState<Client[]>(mockClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      !searchFilter ||
      client.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      client.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus = statusFilter === "all" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (client: Client) => {
    setSelectedClient(client);
    setDrawerOpen(true);
  };

  return (
    <ClientsLayout
      title="Clients"
      description="Manage your client relationships and bookings"
      actions={
        <Button size="sm">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      }
    >
      <ClientsFilterToolbar
        onSearchChange={setSearchFilter}
        onStatusChange={setStatusFilter}
        searchPlaceholder="Search by name, email, or company..."
      />

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="font-semibold">Company</TableHead>
              <TableHead className="font-semibold">Country</TableHead>
              <TableHead className="font-semibold">Agent</TableHead>
              <TableHead className="font-semibold text-right">Bookings</TableHead>
              <TableHead className="font-semibold text-right">Total Spend</TableHead>
              <TableHead className="font-semibold text-right">Outstanding</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(client)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.company || "—"}
                </TableCell>
                <TableCell>{client.country}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{client.assignedAgentName || "Unassigned"}</p>
                    {client.assignedSubagentName && (
                      <p className="text-xs text-muted-foreground">{client.assignedSubagentName}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{client.totalBookings}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(client.totalSpend)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={client.outstandingBalance > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                    {formatCurrency(client.outstandingBalance)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      client.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : client.status === "inactive"
                        ? "bg-muted text-muted-foreground border-border"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontalIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRowClick(client)}>
                        <UserIcon className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Booking
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UsersIcon className="w-4 h-4 mr-2" />
                        Assign to Group
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <ArchiveIcon className="w-4 h-4 mr-2" />
                        Archive Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ClientDrawer client={selectedClient} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </ClientsLayout>
  );
}
