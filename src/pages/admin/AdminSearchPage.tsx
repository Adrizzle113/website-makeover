import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin";
import { SearchBar, SearchResultsSection } from "@/components/search";
import { SearchHero } from "@/components/dashboard/search";
import { useBookingStore } from "@/stores/bookingStore";
import { Button } from "@/components/ui/button";
import { Share2, Plus, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useURLSync } from "@/hooks/useURLSync";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

// Mock agents for admin to search on behalf of
const mockAgents = [
  { id: "1", name: "Elite Travel Agency" },
  { id: "2", name: "Luxury Voyages Inc" },
  { id: "3", name: "Global Destinations" },
  { id: "4", name: "Premium Holidays" },
];

export default function AdminSearchPage() {
  const { searchResults, searchParams } = useBookingStore();
  const { getShareableURL } = useURLSync();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<string>("all");

  const hasSearched =
    searchResults.length > 0 || (searchParams && Object.keys(searchParams).length > 0);

  const handleShare = async () => {
    const url = getShareableURL();
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Search link has been copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy this link",
        description: url,
      });
    }
  };

  const handleNewSearch = () => {
    useBookingStore.getState().setSearchResults([]);
    useBookingStore.getState().setSearchParams(null);
    navigate("/admin/search", { replace: true });
    setSearchParams({});
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            {!hasSearched ? (
              <SearchHero />
            ) : (
              <>
                <header className="sticky top-0 z-10 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <h1 className="text-lg font-semibold">Hotel Search</h1>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={selectedAgent}
                          onValueChange={setSelectedAgent}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select agent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Agents</SelectItem>
                            {mockAgents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                      <Button size="sm" onClick={handleNewSearch}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Search
                      </Button>
                    </div>
                  </div>
                </header>

                <div className="border-b bg-muted/30 px-6 py-4">
                  <SearchBar />
                </div>

                <main className="flex-1">
                  <SearchResultsSection />
                </main>
              </>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
