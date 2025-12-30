import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { cn } from "@/lib/utils";

interface ClientsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

const tabs = [
  { label: "All Clients", path: "/clients" },
  { label: "Groups", path: "/clients/groups" },
  { label: "Contacts", path: "/clients/contacts" },
  { label: "Billing & Invoices", path: "/clients/billing" },
  { label: "Activity", path: "/clients/activity" },
];

export function ClientsLayout({ children, title, description, actions }: ClientsLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger className="-ml-2" />
              <div className="flex-1">
                <h1 className="text-2xl font-heading font-semibold text-foreground">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            
            {/* Tab Navigation */}
            <nav className="flex items-center gap-1 px-6 -mb-px">
              {tabs.map((tab) => {
                const isActive = currentPath === tab.path;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={cn(
                      "px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          {/* Content */}
          <main className="p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
