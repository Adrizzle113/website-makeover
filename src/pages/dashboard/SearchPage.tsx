import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResultsSection } from "@/components/search/SearchResultsSection";

const DashboardSearchPage = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 md:h-16 border-b border-border flex items-center px-3 md:px-6 bg-card sticky top-0 z-10">
            <SidebarTrigger className="mr-2 md:mr-4" />
            <div className="min-w-0">
              <h1 className="font-heading text-lg md:text-xl text-foreground truncate">Search Hotels</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Find the perfect accommodation for your clients</p>
            </div>
          </header>

          {/* Search Content */}
          <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden">
            {/* Search Bar */}
            <div className="bg-card rounded-xl p-3 md:p-6 border border-border shadow-sm">
              <SearchBar />
            </div>

            {/* Results */}
            <SearchResultsSection />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardSearchPage;
