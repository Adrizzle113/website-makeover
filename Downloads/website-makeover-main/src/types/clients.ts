// Client Types for B2B Travel Platform

export type ClientStatus = 'active' | 'inactive' | 'archived';
export type ContactRole = 'traveler' | 'finance' | 'admin';
export type GroupType = 'corporate' | 'family' | 'event' | 'other';
export type PaymentTerms = 'net_0' | 'net_7' | 'net_14' | 'net_30';
export type ActivityEventType = 
  | 'client_created' 
  | 'client_updated' 
  | 'agent_assigned' 
  | 'booking_created' 
  | 'invoice_issued' 
  | 'payment_received' 
  | 'status_changed'
  | 'group_created'
  | 'group_member_added'
  | 'group_member_removed';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country: string;
  defaultResidency?: string;
  defaultCitizenship?: string;
  preferredCurrency: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedSubagentId?: string;
  assignedSubagentName?: string;
  defaultPaymentMethod?: string;
  status: ClientStatus;
  totalBookings: number;
  totalSpend: number;
  avgBookingValue: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientGroup {
  id: string;
  name: string;
  type: GroupType;
  primaryContactId?: string;
  primaryContactName?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  clientCount: number;
  totalBookings: number;
  outstandingBalance: number;
  status: ClientStatus;
  // Billing settings
  invoiceConsolidation: boolean;
  paymentTerms: PaymentTerms;
  defaultCurrency: string;
  taxId?: string;
  vatId?: string;
  paymentMethodPreference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  linkedClientId?: string;
  linkedClientName?: string;
  linkedGroupId?: string;
  linkedGroupName?: string;
  role: ContactRole;
  isPrimaryContact: boolean;
  createdAt: string;
}

export interface ClientBilling {
  id: string;
  clientId?: string;
  clientName?: string;
  groupId?: string;
  groupName?: string;
  outstandingBalance: number;
  openInvoices: number;
  overdueInvoices: number;
  lastPaymentDate?: string;
  creditLimit?: number;
}

export interface ClientActivity {
  id: string;
  eventType: ActivityEventType;
  clientId?: string;
  clientName?: string;
  groupId?: string;
  groupName?: string;
  agentId?: string;
  agentName?: string;
  description: string;
  metadata?: Record<string, string | number>;
  createdAt: string;
}

export interface ClientNote {
  id: string;
  clientId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ClientBooking {
  id: string;
  etgOrderId: string;
  status: 'confirmed' | 'processing' | 'cancelled' | 'failed';
  hotelName: string;
  city: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export interface ClientInvoice {
  id: string;
  status: 'draft' | 'sent' | 'unpaid' | 'partial' | 'paid' | 'overdue';
  totalDue: number;
  currency: string;
  dueDate: string;
  createdAt: string;
}

export interface ClientPayment {
  id: string;
  type: 'payment' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  method: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

// Filter types
export interface ClientFilters {
  search: string;
  agentId?: string;
  subagentId?: string;
  country?: string;
  status?: ClientStatus;
  hasOutstandingBalance?: boolean;
}

export interface GroupFilters {
  search: string;
  type?: GroupType;
  agentId?: string;
  status?: ClientStatus;
}

export interface ActivityFilters {
  search: string;
  clientId?: string;
  agentId?: string;
  eventType?: ActivityEventType;
  dateRange?: { from: Date; to: Date };
}
