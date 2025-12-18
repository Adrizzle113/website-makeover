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
import { PlusIcon, MoreHorizontalIcon, MailIcon, PhoneIcon, EditIcon } from "lucide-react";
import type { Contact, ContactRole } from "@/types/clients";

// Mock data
const mockContacts: Contact[] = [
  {
    id: "contact-1",
    name: "Sarah Anderson",
    email: "sarah.anderson@techcorp.com",
    phone: "+1 555-0123",
    linkedClientId: "1",
    linkedClientName: "Sarah Anderson",
    linkedGroupId: "grp-1",
    linkedGroupName: "Acme Corporation",
    role: "admin",
    isPrimaryContact: true,
    createdAt: "2024-06-15T10:00:00Z",
  },
  {
    id: "contact-2",
    name: "James Mitchell",
    email: "james.m@globalfinance.co.uk",
    phone: "+44 20 7946 0958",
    linkedClientId: "2",
    linkedClientName: "James Mitchell",
    linkedGroupId: "grp-2",
    linkedGroupName: "Global Finance Team",
    role: "finance",
    isPrimaryContact: true,
    createdAt: "2024-08-20T09:15:00Z",
  },
  {
    id: "contact-3",
    name: "Lisa Chen",
    email: "lisa.chen@techcorp.com",
    phone: "+1 555-0456",
    linkedGroupId: "grp-1",
    linkedGroupName: "Acme Corporation",
    role: "traveler",
    isPrimaryContact: false,
    createdAt: "2024-09-10T14:00:00Z",
  },
  {
    id: "contact-4",
    name: "Robert Johnson",
    email: "robert.j@email.com",
    phone: "+1 555-0789",
    linkedGroupId: "grp-3",
    linkedGroupName: "Johnson Family Reunion",
    role: "admin",
    isPrimaryContact: true,
    createdAt: "2024-11-10T14:00:00Z",
  },
  {
    id: "contact-5",
    name: "Marie Dubois",
    email: "marie.dubois@luxurytravel.fr",
    linkedClientId: "3",
    linkedClientName: "Marie Dubois",
    linkedGroupId: "grp-4",
    linkedGroupName: "Tech Summit 2025 Attendees",
    role: "admin",
    isPrimaryContact: true,
    createdAt: "2024-10-01T08:30:00Z",
  },
];

const roleColors: Record<ContactRole, string> = {
  traveler: "bg-blue-50 text-blue-700 border-blue-200",
  finance: "bg-emerald-50 text-emerald-700 border-emerald-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function ContactsPage() {
  const [contacts] = useState<Contact[]>(mockContacts);
  const [searchFilter, setSearchFilter] = useState("");

  const filteredContacts = contacts.filter((contact) => {
    return (
      !searchFilter ||
      contact.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      contact.linkedClientName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      contact.linkedGroupName?.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  return (
    <ClientsLayout
      title="Clients"
      description="Manage your client relationships and bookings"
      actions={
        <Button size="sm">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      }
    >
      <ClientsFilterToolbar
        onSearchChange={setSearchFilter}
        showCountryFilter={false}
        showAgentFilter={false}
        searchPlaceholder="Search contacts..."
      />

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Linked To</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Primary</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <p className="font-medium">{contact.name}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MailIcon className="w-3.5 h-3.5" />
                    <span className="text-sm">{contact.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {contact.phone ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <PhoneIcon className="w-3.5 h-3.5" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {contact.linkedGroupName && (
                      <p className="font-medium">{contact.linkedGroupName}</p>
                    )}
                    {contact.linkedClientName && !contact.linkedGroupName && (
                      <p className="text-muted-foreground">{contact.linkedClientName}</p>
                    )}
                    {!contact.linkedGroupName && !contact.linkedClientName && (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={roleColors[contact.role]}>
                    {contact.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {contact.isPrimaryContact ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Primary
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
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
                        <EditIcon className="w-4 h-4 mr-2" />
                        Edit Contact
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MailIcon className="w-4 h-4 mr-2" />
                        Send Email
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
