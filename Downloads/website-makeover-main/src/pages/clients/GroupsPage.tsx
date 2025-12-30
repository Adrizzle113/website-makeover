import { useState } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  PlusIcon,
  MoreHorizontalIcon,
  UsersIcon,
  FileTextIcon,
  CalendarIcon,
  SettingsIcon,
  UserPlusIcon,
} from "lucide-react";
import type { ClientGroup, GroupType, ClientStatus } from "@/types/clients";

// Mock data
const mockGroups: ClientGroup[] = [
  {
    id: "grp-1",
    name: "Acme Corporation",
    type: "corporate",
    primaryContactName: "Sarah Anderson",
    assignedAgentId: "agent-1",
    assignedAgentName: "John Doe",
    clientCount: 12,
    totalBookings: 48,
    outstandingBalance: 8500,
    status: "active",
    invoiceConsolidation: true,
    paymentTerms: "net_30",
    defaultCurrency: "USD",
    taxId: "US-123456789",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2025-01-10T14:30:00Z",
  },
  {
    id: "grp-2",
    name: "Global Finance Team",
    type: "corporate",
    primaryContactName: "James Mitchell",
    assignedAgentId: "agent-2",
    assignedAgentName: "Jane Smith",
    clientCount: 8,
    totalBookings: 32,
    outstandingBalance: 0,
    status: "active",
    invoiceConsolidation: true,
    paymentTerms: "net_14",
    defaultCurrency: "GBP",
    createdAt: "2024-03-20T09:15:00Z",
    updatedAt: "2025-01-08T11:00:00Z",
  },
  {
    id: "grp-3",
    name: "Johnson Family Reunion",
    type: "family",
    primaryContactName: "Robert Johnson",
    assignedAgentId: "agent-1",
    assignedAgentName: "John Doe",
    clientCount: 6,
    totalBookings: 3,
    outstandingBalance: 2400,
    status: "active",
    invoiceConsolidation: false,
    paymentTerms: "net_0",
    defaultCurrency: "USD",
    createdAt: "2024-11-10T14:00:00Z",
    updatedAt: "2025-01-05T16:45:00Z",
  },
  {
    id: "grp-4",
    name: "Tech Summit 2025 Attendees",
    type: "event",
    primaryContactName: "Marie Dubois",
    assignedAgentId: "agent-3",
    assignedAgentName: "Mike Johnson",
    clientCount: 25,
    totalBookings: 25,
    outstandingBalance: 15000,
    status: "active",
    invoiceConsolidation: true,
    paymentTerms: "net_7",
    defaultCurrency: "EUR",
    vatId: "FR-987654321",
    createdAt: "2024-10-01T08:30:00Z",
    updatedAt: "2025-01-12T10:20:00Z",
  },
];

const typeColors: Record<GroupType, string> = {
  corporate: "bg-blue-50 text-blue-700 border-blue-200",
  family: "bg-purple-50 text-purple-700 border-purple-200",
  event: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-muted text-muted-foreground border-border",
};

const paymentTermsLabels: Record<string, string> = {
  net_0: "Due on receipt",
  net_7: "Net 7",
  net_14: "Net 14",
  net_30: "Net 30",
};

const formatCurrency = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function GroupsPage() {
  const [groups] = useState<ClientGroup[]>(mockGroups);
  const [selectedGroup, setSelectedGroup] = useState<ClientGroup | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const filteredGroups = groups.filter((group) => {
    return (
      !searchFilter ||
      group.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      group.primaryContactName?.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  const handleRowClick = (group: ClientGroup) => {
    setSelectedGroup(group);
    setDrawerOpen(true);
  };

  return (
    <ClientsLayout
      title="Clients"
      description="Manage your client relationships and bookings"
      actions={
        <Button size="sm">
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      }
    >
      <ClientsFilterToolbar
        onSearchChange={setSearchFilter}
        showCountryFilter={false}
        searchPlaceholder="Search groups..."
      />

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Group Name</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Primary Contact</TableHead>
              <TableHead className="font-semibold">Agent</TableHead>
              <TableHead className="font-semibold text-right">Clients</TableHead>
              <TableHead className="font-semibold text-right">Bookings</TableHead>
              <TableHead className="font-semibold text-right">Outstanding</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.map((group) => (
              <TableRow
                key={group.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(group)}
              >
                <TableCell>
                  <p className="font-medium">{group.name}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={typeColors[group.type]}>
                    {group.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {group.primaryContactName || "—"}
                </TableCell>
                <TableCell>{group.assignedAgentName || "Unassigned"}</TableCell>
                <TableCell className="text-right font-medium">{group.clientCount}</TableCell>
                <TableCell className="text-right font-medium">{group.totalBookings}</TableCell>
                <TableCell className="text-right">
                  <span className={group.outstandingBalance > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                    {formatCurrency(group.outstandingBalance, group.defaultCurrency)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      group.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-muted text-muted-foreground border-border"
                    }
                  >
                    {group.status}
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
                      <DropdownMenuItem onClick={() => handleRowClick(group)}>
                        <UsersIcon className="w-4 h-4 mr-2" />
                        View Group
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlusIcon className="w-4 h-4 mr-2" />
                        Add Members
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Create Group Booking
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        Create Group Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Group Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedGroup && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-xl font-heading">{selectedGroup.name}</SheetTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={typeColors[selectedGroup.type]}>
                        {selectedGroup.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          selectedGroup.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {selectedGroup.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-2">
                <TabsList className="w-full grid grid-cols-4 h-9">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="members" className="text-xs">Members</TabsTrigger>
                  <TabsTrigger value="bookings" className="text-xs">Bookings</TabsTrigger>
                  <TabsTrigger value="billing" className="text-xs">Billing</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Group Information</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Primary Contact</span>
                        <span>{selectedGroup.primaryContactName || "Not set"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assigned Agent</span>
                        <span>{selectedGroup.assignedAgentName || "Unassigned"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Members</span>
                        <span>{selectedGroup.clientCount}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Total Bookings</p>
                      <p className="text-lg font-semibold">{selectedGroup.totalBookings}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                      <p className={`text-lg font-semibold ${selectedGroup.outstandingBalance > 0 ? "text-amber-600" : ""}`}>
                        {formatCurrency(selectedGroup.outstandingBalance, selectedGroup.defaultCurrency)}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="members" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{selectedGroup.clientCount} members in this group</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      <UserPlusIcon className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="bookings" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{selectedGroup.totalBookings} bookings</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      View All Bookings
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="billing" className="mt-4 space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Billing Settings</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invoice Consolidation</span>
                        <Badge variant="outline" className={selectedGroup.invoiceConsolidation ? "bg-emerald-50 text-emerald-700" : ""}>
                          {selectedGroup.invoiceConsolidation ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Terms</span>
                        <span>{paymentTermsLabels[selectedGroup.paymentTerms]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Default Currency</span>
                        <span>{selectedGroup.defaultCurrency}</span>
                      </div>
                      {selectedGroup.taxId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax ID</span>
                          <span>{selectedGroup.taxId}</span>
                        </div>
                      )}
                      {selectedGroup.vatId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">VAT ID</span>
                          <span>{selectedGroup.vatId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Edit Billing Settings
                  </Button>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </ClientsLayout>
  );
}
