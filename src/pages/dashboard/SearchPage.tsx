import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResultsSection } from "@/components/search/SearchResultsSection";

const DashboardSearchPage = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border flex items-center px-6 bg-card">
            <SidebarTrigger className="mr-4" />
            <div>
              <h1 className="font-heading text-xl text-foreground">Search Hotels</h1>
              <p className="text-sm text-muted-foreground">Find the perfect accommodation for your clients</p>
            </div>
          </header>

          {/* Search Content */}
          <div className="flex-1 p-6 space-y-6">
            {/* Search Bar */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
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
