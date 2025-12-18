import { useState } from "react";
import { format } from "date-fns";
import { DownloadIcon, FileSpreadsheetIcon, ClockIcon, CheckCircleIcon, XCircleIcon, CalendarIcon, RefreshCwIcon } from "lucide-react";
import { ReportingLayout } from "@/components/reporting";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportHistoryItem } from "@/types/reporting";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Mock export history
const mockExportHistory: ExportHistoryItem[] = [
  {
    id: "EXP-001",
    dataset: "bookings",
    format: "csv",
    filters: "Status: Confirmed, Date: Jan 2025",
    dateRange: "Jan 1 - Jan 31, 2025",
    createdAt: "2025-01-18T14:30:00Z",
    downloadUrl: "#",
    status: "completed",
  },
  {
    id: "EXP-002",
    dataset: "revenue",
    format: "excel",
    filters: "All agents, All cities",
    dateRange: "Jan 1 - Jan 31, 2025",
    createdAt: "2025-01-17T10:15:00Z",
    downloadUrl: "#",
    status: "completed",
  },
  {
    id: "EXP-003",
    dataset: "invoices",
    format: "csv",
    filters: "Status: Unpaid",
    dateRange: "Dec 1 - Dec 31, 2024",
    createdAt: "2025-01-16T09:00:00Z",
    downloadUrl: "#",
    status: "completed",
  },
  {
    id: "EXP-004",
    dataset: "payouts",
    format: "excel",
    filters: "Agent: Sarah Johnson",
    dateRange: "Q4 2024",
    createdAt: "2025-01-15T16:45:00Z",
    status: "pending",
  },
  {
    id: "EXP-005",
    dataset: "payments",
    format: "csv",
    filters: "Type: Refunds only",
    dateRange: "Jan 1 - Jan 15, 2025",
    createdAt: "2025-01-14T11:20:00Z",
    status: "failed",
  },
];

const datasetOptions = [
  { value: "bookings", label: "Bookings", icon: "📋" },
  { value: "revenue", label: "Revenue", icon: "💰" },
  { value: "invoices", label: "Invoices", icon: "📄" },
  { value: "payments", label: "Payments", icon: "💳" },
  { value: "payouts", label: "Payouts", icon: "🏦" },
];

export function ExportsReportPage() {
  const [dataset, setDataset] = useState<string>("bookings");
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("csv");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate export generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsGenerating(false);
    toast({
      title: "Export generated",
      description: `Your ${dataset} export is ready for download.`,
    });
  };

  const statusConfig = {
    completed: { icon: CheckCircleIcon, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    pending: { icon: ClockIcon, color: "text-amber-600", bg: "bg-amber-500/10" },
    failed: { icon: XCircleIcon, color: "text-red-600", bg: "bg-red-500/10" },
  };

  return (
    <ReportingLayout title="Exports" description="Generate and download reports">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Export Generator */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Generate Export</CardTitle>
            <CardDescription>Create a new data export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dataset Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Dataset</label>
              <Select value={dataset} onValueChange={setDataset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {datasetOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span>{opt.icon}</span>
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <span>
                          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                        </span>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      "Select date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) => setDateRange(range || {})}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Format Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <div className="flex gap-2">
                <Button
                  variant={exportFormat === "csv" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportFormat("csv")}
                  className="flex-1"
                >
                  CSV
                </Button>
                <Button
                  variant={exportFormat === "excel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportFormat("excel")}
                  className="flex-1"
                >
                  Excel
                </Button>
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              className="w-full gap-2" 
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4" />
                  Generate Export
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Export History</CardTitle>
            <CardDescription>Your recent exports</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Dataset</TableHead>
                  <TableHead className="font-semibold">Date Range</TableHead>
                  <TableHead className="font-semibold">Filters</TableHead>
                  <TableHead className="font-semibold">Format</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockExportHistory.map((exportItem) => {
                  const status = statusConfig[exportItem.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={exportItem.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheetIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="capitalize">{exportItem.dataset}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{exportItem.dateRange}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {exportItem.filters}
                      </TableCell>
                      <TableCell>
                        <span className="uppercase text-xs font-medium bg-muted px-2 py-1 rounded">
                          {exportItem.format}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className={cn("flex items-center gap-1.5 text-sm", status.color)}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="capitalize">{exportItem.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(exportItem.createdAt), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell>
                        {exportItem.status === "completed" && exportItem.downloadUrl && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <DownloadIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ReportingLayout>
  );
}
