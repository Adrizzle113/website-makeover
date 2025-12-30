import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, SearchIcon, XIcon, FilterIcon, DownloadIcon, BookmarkIcon, Share2Icon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ReportingFilters, SavedView, BookingStatus, PaymentType, UserRole } from "@/types/reporting";

interface ReportingFilterToolbarProps {
  filters: ReportingFilters;
  onFiltersChange: (filters: ReportingFilters) => void;
  savedViews?: SavedView[];
  onSaveView?: (name: string) => void;
  onLoadView?: (view: SavedView) => void;
  onExport?: (format: "csv" | "excel") => void;
  userRole?: UserRole;
  showPaymentFilters?: boolean;
}

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

const paymentTypeOptions: { value: PaymentType; label: string }[] = [
  { value: "deposit", label: "Deposit" },
  { value: "now_net", label: "Now (Net)" },
  { value: "now_gross", label: "Now (Gross)" },
  { value: "hotel", label: "Pay at Hotel" },
];

const dateModeOptions = [
  { value: "created", label: "Booking Created" },
  { value: "checkin", label: "Check-in Date" },
  { value: "checkout", label: "Check-out Date" },
];

// Mock data for selectors
const mockGroups = [
  { id: "g1", name: "Acme Travel Corp" },
  { id: "g2", name: "Global Adventures" },
  { id: "g3", name: "Sunshine Holidays" },
];

const mockAgents = [
  { id: "a1", name: "John Smith" },
  { id: "a2", name: "Sarah Johnson" },
  { id: "a3", name: "Michael Chen" },
];

const mockSubagents = [
  { id: "s1", name: "Alice Brown" },
  { id: "s2", name: "David Wilson" },
  { id: "s3", name: "Emma Davis" },
];

export function ReportingFilterToolbar({
  filters,
  onFiltersChange,
  savedViews = [],
  onSaveView,
  onLoadView,
  onExport,
  userRole = "admin",
  showPaymentFilters = true,
}: ReportingFilterToolbarProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.dateRange?.from ? new Date(filters.dateRange.from) : undefined,
    to: filters.dateRange?.to ? new Date(filters.dateRange.to) : undefined,
  });

  const hasActiveFilters = !!(
    filters.search ||
    filters.dateRange?.from ||
    filters.status?.length ||
    filters.paymentType?.length ||
    filters.groupId ||
    filters.agentId ||
    filters.subagentId
  );

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    setDateRange(range || {});
    onFiltersChange({
      ...filters,
      dateRange: range?.from ? {
        from: range.from.toISOString(),
        to: range.to?.toISOString() || range.from.toISOString(),
      } : undefined,
    });
  };

  const toggleStatus = (status: BookingStatus) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, status: updated.length ? updated : undefined });
  };

  const togglePaymentType = (type: PaymentType) => {
    const current = filters.paymentType || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, paymentType: updated.length ? updated : undefined });
  };

  const resetFilters = () => {
    setDateRange({});
    onFiltersChange({});
  };

  return (
    <div className="space-y-3">
      {/* Main toolbar row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search booking, guest, hotel..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 h-9 bg-background"
          />
        </div>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <CalendarIcon className="w-4 h-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <span className="text-sm">
                    {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                  </span>
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <Select
                value={filters.dateMode || "created"}
                onValueChange={(value) => onFiltersChange({ ...filters, dateMode: value as ReportingFilters["dateMode"] })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateModeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Calendar
              mode="range"
              selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              Status
              {filters.status?.length ? (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {filters.status.length}
                </Badge>
              ) : null}
              <ChevronDownIcon className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleStatus(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                    filters.status?.includes(opt.value)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center",
                    filters.status?.includes(opt.value)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border"
                  )}>
                    {filters.status?.includes(opt.value) && (
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Payment Type Filter */}
        {showPaymentFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                Payment Type
                {filters.paymentType?.length ? (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {filters.paymentType.length}
                  </Badge>
                ) : null}
                <ChevronDownIcon className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                {paymentTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => togglePaymentType(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                      filters.paymentType?.includes(opt.value)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center",
                      filters.paymentType?.includes(opt.value)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border"
                    )}>
                      {filters.paymentType?.includes(opt.value) && (
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {opt.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Group Selector */}
        <Select
          value={filters.groupId || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, groupId: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {mockGroups.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Agent Selector (Admin only) */}
        {userRole === "admin" && (
          <Select
            value={filters.agentId || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, agentId: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {mockAgents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Subagent Selector (Admin + Agent) */}
        {(userRole === "admin" || userRole === "agent") && (
          <Select
            value={filters.subagentId || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, subagentId: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All Subagents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subagents</SelectItem>
              {mockSubagents.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Reset */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 gap-1 text-muted-foreground">
            <XIcon className="w-3 h-3" />
            Reset
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Saved Views */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <BookmarkIcon className="w-4 h-4" />
              Saved Views
              <ChevronDownIcon className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {savedViews.length > 0 ? (
              <>
                {savedViews.map((view) => (
                  <DropdownMenuItem key={view.id} onClick={() => onLoadView?.(view)}>
                    {view.name}
                    {view.isDefault && <Badge variant="secondary" className="ml-auto text-xs">Default</Badge>}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No saved views</div>
            )}
            <DropdownMenuItem onClick={() => onSaveView?.("New View")}>
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Save current view
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2Icon className="w-4 h-4 mr-2" />
              Share view link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-9 gap-2">
              <DownloadIcon className="w-4 h-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport?.("csv")}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport?.("excel")}>
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
