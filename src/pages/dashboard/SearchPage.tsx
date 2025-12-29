import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResultsSection } from "@/components/search/SearchResultsSection";
import { SearchHero } from "@/components/dashboard/search";
import { useBookingStore } from "@/stores/bookingStore";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const DashboardSearchPage = () => {
  const { searchResults, searchParams, clearSearch } = useBookingStore();
  const hasSearched = searchResults.length > 0 || searchParams !== null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {hasSearched ? (
            <>
              {/* Header with New Search button */}
              <header className="h-14 md:h-16 border-b border-border flex items-center justify-between px-3 md:px-6 bg-card sticky top-0 z-10">
                <div className="flex items-center">
                  <SidebarTrigger className="mr-2 md:mr-4" />
                  <div className="min-w-0">
                    <h1 className="font-heading text-lg md:text-xl text-foreground truncate">Search Hotels</h1>
                    <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Find the perfect accommodation for your clients</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={clearSearch}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">New Search</span>
                </Button>
              </header>

              {/* Search Content */}
              <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden">
                {/* Search Summary */}
                {searchParams && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 md:p-5">
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Destination:</span>
                        <span className="font-semibold text-foreground">{searchParams.destination}</span>
                      </div>
                      <div className="hidden sm:block h-4 w-px bg-border" />
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Dates:</span>
                        <span className="font-semibold text-foreground">
                          {new Date(searchParams.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(searchParams.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="hidden sm:block h-4 w-px bg-border" />
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Guests:</span>
                        <span className="font-semibold text-foreground">
                          {searchParams.rooms} {searchParams.rooms === 1 ? 'Room' : 'Rooms'}, {searchParams.guests} {searchParams.guests === 1 ? 'Guest' : 'Guests'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results */}
                <SearchResultsSection />
              </div>
            </>
          ) : (
            <>
              {/* Minimal header for hero view */}
              <header className="absolute top-0 left-0 right-0 h-14 md:h-16 flex items-center px-3 md:px-6 z-20">
                <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/10" />
              </header>
              
              {/* Hero with Enhanced Search Form */}
              <SearchHero />
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardSearchPage;
