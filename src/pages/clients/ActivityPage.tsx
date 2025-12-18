import { useState } from "react";
import { format } from "date-fns";
import { ClientsLayout, ClientsFilterToolbar } from "@/components/clients";
import { Badge } from "@/components/ui/badge";
import {
  UserPlusIcon,
  UserIcon,
  CalendarIcon,
  FileTextIcon,
  CreditCardIcon,
  RefreshCwIcon,
  UsersIcon,
  UserMinusIcon,
} from "lucide-react";
import type { ClientActivity, ActivityEventType } from "@/types/clients";

// Mock data
const mockActivity: ClientActivity[] = [
  {
    id: "act-1",
    eventType: "payment_received",
    clientId: "1",
    clientName: "Sarah Anderson",
    agentName: "John Doe",
    description: "Payment of $1,250 received for INV-2025-001",
    metadata: { amount: 1250, invoiceId: "INV-2025-001" },
    createdAt: "2025-01-18T09:15:00Z",
  },
  {
    id: "act-2",
    eventType: "booking_created",
    clientId: "2",
    clientName: "James Mitchell",
    agentName: "Jane Smith",
    description: "New booking created for Marriott London (Feb 10-14)",
    metadata: { hotelName: "Marriott London", bookingId: "BK-2025-002" },
    createdAt: "2025-01-17T14:22:00Z",
  },
  {
    id: "act-3",
    eventType: "invoice_issued",
    clientId: "3",
    clientName: "Marie Dubois",
    agentName: "John Doe",
    description: "Invoice INV-2025-003 issued for $4,500",
    metadata: { amount: 4500, invoiceId: "INV-2025-003" },
    createdAt: "2025-01-16T11:30:00Z",
  },
  {
    id: "act-4",
    eventType: "client_created",
    clientId: "5",
    clientName: "Elena Rodriguez",
    agentName: "Jane Smith",
    description: "New client created",
    createdAt: "2025-01-15T12:00:00Z",
  },
  {
    id: "act-5",
    eventType: "group_created",
    groupId: "grp-4",
    groupName: "Tech Summit 2025 Attendees",
    agentName: "Mike Johnson",
    description: "New event group created with 25 members",
    metadata: { memberCount: 25 },
    createdAt: "2025-01-14T08:30:00Z",
  },
  {
    id: "act-6",
    eventType: "agent_assigned",
    clientId: "4",
    clientName: "Ahmed Hassan",
    agentName: "Mike Johnson",
    description: "Client assigned to agent Mike Johnson",
    createdAt: "2025-01-13T16:45:00Z",
  },
  {
    id: "act-7",
    eventType: "status_changed",
    clientId: "5",
    clientName: "Elena Rodriguez",
    agentName: "Jane Smith",
    description: "Client status changed from Active to Inactive",
    metadata: { oldStatus: "active", newStatus: "inactive" },
    createdAt: "2025-01-12T09:00:00Z",
  },
  {
    id: "act-8",
    eventType: "group_member_added",
    groupId: "grp-1",
    groupName: "Acme Corporation",
    clientName: "Lisa Chen",
    agentName: "John Doe",
    description: "Lisa Chen added to Acme Corporation group",
    createdAt: "2025-01-11T14:00:00Z",
  },
];

const eventIcons: Record<ActivityEventType, React.ReactNode> = {
  client_created: <UserPlusIcon className="w-4 h-4" />,
  client_updated: <UserIcon className="w-4 h-4" />,
  agent_assigned: <UserIcon className="w-4 h-4" />,
  booking_created: <CalendarIcon className="w-4 h-4" />,
  invoice_issued: <FileTextIcon className="w-4 h-4" />,
  payment_received: <CreditCardIcon className="w-4 h-4" />,
  status_changed: <RefreshCwIcon className="w-4 h-4" />,
  group_created: <UsersIcon className="w-4 h-4" />,
  group_member_added: <UserPlusIcon className="w-4 h-4" />,
  group_member_removed: <UserMinusIcon className="w-4 h-4" />,
};

const eventColors: Record<ActivityEventType, string> = {
  client_created: "bg-emerald-100 text-emerald-700",
  client_updated: "bg-blue-100 text-blue-700",
  agent_assigned: "bg-purple-100 text-purple-700",
  booking_created: "bg-blue-100 text-blue-700",
  invoice_issued: "bg-amber-100 text-amber-700",
  payment_received: "bg-emerald-100 text-emerald-700",
  status_changed: "bg-muted text-muted-foreground",
  group_created: "bg-purple-100 text-purple-700",
  group_member_added: "bg-emerald-100 text-emerald-700",
  group_member_removed: "bg-red-100 text-red-700",
};

const eventLabels: Record<ActivityEventType, string> = {
  client_created: "Client Created",
  client_updated: "Client Updated",
  agent_assigned: "Agent Assigned",
  booking_created: "Booking Created",
  invoice_issued: "Invoice Issued",
  payment_received: "Payment Received",
  status_changed: "Status Changed",
  group_created: "Group Created",
  group_member_added: "Member Added",
  group_member_removed: "Member Removed",
};

export default function ActivityPage() {
  const [activity] = useState<ClientActivity[]>(mockActivity);
  const [searchFilter, setSearchFilter] = useState("");

  const filteredActivity = activity.filter((item) => {
    return (
      !searchFilter ||
      item.clientName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.groupName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.description.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  return (
    <ClientsLayout
      title="Clients"
      description="Manage your client relationships and bookings"
    >
      <ClientsFilterToolbar
        onSearchChange={setSearchFilter}
        showCountryFilter={false}
        searchPlaceholder="Search activity..."
      />

      <div className="space-y-4">
        {filteredActivity.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            {/* Icon */}
            <div className={`p-2 rounded-lg ${eventColors[item.eventType]}`}>
              {eventIcons[item.eventType]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-normal">
                  {eventLabels[item.eventType]}
                </Badge>
                {item.clientName && (
                  <span className="text-sm font-medium">{item.clientName}</span>
                )}
                {item.groupName && !item.clientName && (
                  <span className="text-sm font-medium">{item.groupName}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{format(new Date(item.createdAt), "MMM d, yyyy 'at' HH:mm")}</span>
                {item.agentName && (
                  <>
                    <span>•</span>
                    <span>by {item.agentName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ClientsLayout>
  );
}
