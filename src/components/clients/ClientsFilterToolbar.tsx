import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchIcon, FilterIcon, DownloadIcon, XIcon } from "lucide-react";
import type { ClientStatus } from "@/types/clients";

interface ClientsFilterToolbarProps {
  onSearchChange: (value: string) => void;
  onStatusChange?: (value: ClientStatus | "all") => void;
  onCountryChange?: (value: string) => void;
  onAgentChange?: (value: string) => void;
  showAgentFilter?: boolean;
  showCountryFilter?: boolean;
  searchPlaceholder?: string;
}

const countries = [
  { value: "all", label: "All Countries" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "AE", label: "UAE" },
  { value: "SA", label: "Saudi Arabia" },
];

const agents = [
  { value: "all", label: "All Agents" },
  { value: "agent-1", label: "John Doe" },
  { value: "agent-2", label: "Jane Smith" },
  { value: "agent-3", label: "Mike Johnson" },
];

export function ClientsFilterToolbar({
  onSearchChange,
  onStatusChange,
  onCountryChange,
  onAgentChange,
  showAgentFilter = true,
  showCountryFilter = true,
  searchPlaceholder = "Search clients...",
}: ClientsFilterToolbarProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClientStatus | "all">("all");
  const [country, setCountry] = useState("all");
  const [agent, setAgent] = useState("all");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const handleStatusChange = (value: ClientStatus | "all") => {
    setStatus(value);
    onStatusChange?.(value);
  };

  const handleCountryChange = (value: string) => {
    setCountry(value);
    onCountryChange?.(value);
  };

  const handleAgentChange = (value: string) => {
    setAgent(value);
    onAgentChange?.(value);
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setCountry("all");
    setAgent("all");
    onSearchChange("");
    onStatusChange?.("all");
    onCountryChange?.("all");
    onAgentChange?.("all");
  };

  const hasActiveFilters = search || status !== "all" || country !== "all" || agent !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3 pb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Status */}
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      {/* Country */}
      {showCountryFilter && (
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Agent */}
      {showAgentFilter && (
        <Select value={agent} onValueChange={handleAgentChange}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-9">
          <XIcon className="w-4 h-4 mr-1" />
          Reset
        </Button>
      )}

      {/* Export */}
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem>Export as Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
