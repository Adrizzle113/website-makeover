import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Eye,
  Mail,
  Download,
  Users,
  UserPlus,
  Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
  email: string;
  company: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  role: "agent" | "subagent";
  createdAt: string;
  totalBookings: number;
  totalRevenue: number;
}

const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@elitetravel.com",
    company: "Elite Travel Agency",
    status: "approved",
    role: "agent",
    createdAt: "2024-10-15",
    totalBookings: 142,
    totalRevenue: 245000,
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "m.chen@luxuryvoyages.com",
    company: "Luxury Voyages Inc",
    status: "approved",
    role: "agent",
    createdAt: "2024-11-20",
    totalBookings: 98,
    totalRevenue: 189000,
  },
  {
    id: "3",
    name: "Emma Williams",
    email: "emma@globaldest.com",
    company: "Global Destinations",
    status: "pending",
    role: "agent",
    createdAt: "2025-01-18",
    totalBookings: 0,
    totalRevenue: 0,
  },
  {
    id: "4",
    name: "James Rodriguez",
    email: "j.rodriguez@premiumholidays.com",
    company: "Premium Holidays",
    status: "pending",
    role: "agent",
    createdAt: "2025-01-19",
    totalBookings: 0,
    totalRevenue: 0,
  },
  {
    id: "5",
    name: "Lisa Park",
    email: "lisa@firstclass.com",
    company: "First Class Travel",
    status: "suspended",
    role: "agent",
    createdAt: "2024-08-10",
    totalBookings: 45,
    totalRevenue: 87000,
  },
  {
    id: "6",
    name: "David Kim",
    email: "david@elitetravel.com",
    company: "Elite Travel Agency",
    status: "approved",
    role: "subagent",
    createdAt: "2024-12-01",
    totalBookings: 23,
    totalRevenue: 41000,
  },
];

const stats = [
  { title: "Total Agents", value: "156", icon: Users },
  { title: "Pending Approval", value: "8", icon: Clock },
  { title: "Active This Month", value: "134", icon: UserCheck },
  { title: "New This Week", value: "5", icon: UserPlus },
];

const getStatusBadge = (status: Agent["status"]) => {
  const config = {
    pending: { variant: "secondary" as const, label: "Pending" },
    approved: { variant: "default" as const, label: "Approved" },
    rejected: { variant: "destructive" as const, label: "Rejected" },
    suspended: { variant: "outline" as const, label: "Suspended" },
  };
  const { variant, label } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
};

const getRoleBadge = (role: Agent["role"]) => {
  return (
    <Badge variant={role === "agent" ? "default" : "secondary"}>
      {role === "agent" ? "Agent" : "Subagent"}
    </Badge>
  );
};

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredAgents = mockAgents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
    const matchesRole = roleFilter === "all" || agent.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleApprove = (agent: Agent) => {
    toast({
      title: "Agent Approved",
      description: `${agent.name} has been approved successfully.`,
    });
  };

  const handleReject = (agent: Agent) => {
    toast({
      title: "Agent Rejected",
      description: `${agent.name} has been rejected.`,
      variant: "destructive",
    });
  };

  const handleSuspend = (agent: Agent) => {
    toast({
      title: "Agent Suspended",
      description: `${agent.name} has been suspended.`,
    });
  };

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setDrawerOpen(true);
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
                  <h1 className="text-lg font-semibold">Agents Management</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage travel agents and their access
                  </p>
                </div>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Agent
                </Button>
              </div>
            </header>

            <main className="flex-1 space-y-6 p-6">
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="subagent">Subagent</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>

              {/* Agents Table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                              {agent.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {agent.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{agent.company}</TableCell>
                        <TableCell>{getStatusBadge(agent.status)}</TableCell>
                        <TableCell>{getRoleBadge(agent.role)}</TableCell>
                        <TableCell>{agent.createdAt}</TableCell>
                        <TableCell className="text-right">
                          {agent.totalBookings}
                        </TableCell>
                        <TableCell className="text-right">
                          ${agent.totalRevenue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(agent)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {agent.status === "pending" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleApprove(agent)}
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleReject(agent)}
                                    className="text-destructive"
                                  >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {agent.status === "approved" && (
                                <DropdownMenuItem
                                  onClick={() => handleSuspend(agent)}
                                  className="text-destructive"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              {agent.status === "suspended" && (
                                <DropdownMenuItem
                                  onClick={() => handleApprove(agent)}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </main>
          </div>
        </SidebarInset>
      </div>

      {/* Agent Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Agent Details</SheetTitle>
            <SheetDescription>
              View and manage agent information
            </SheetDescription>
          </SheetHeader>
          {selectedAgent && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-medium">
                  {selectedAgent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedAgent.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedAgent.email}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedAgent.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <div className="mt-1">{getRoleBadge(selectedAgent.role)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedAgent.company}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{selectedAgent.createdAt}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold">{selectedAgent.totalBookings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      ${selectedAgent.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedAgent.status === "pending" && (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleApprove(selectedAgent);
                        setDrawerOpen(false);
                      }}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleReject(selectedAgent);
                        setDrawerOpen(false);
                      }}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedAgent.status === "approved" && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      handleSuspend(selectedAgent);
                      setDrawerOpen(false);
                    }}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Suspend Agent
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
