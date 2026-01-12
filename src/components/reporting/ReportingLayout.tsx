import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  DollarSignIcon,
  FileTextIcon,
  CreditCardIcon,
  ScaleIcon,
  WalletIcon,
  DownloadIcon,
} from "lucide-react";

const reportingTabs = [
  { label: "Bookings", path: "/reporting/bookings", icon: CalendarIcon },
  { label: "Revenue", path: "/reporting/revenue", icon: DollarSignIcon },
  { label: "Invoices", path: "/reporting/invoices", icon: FileTextIcon },
  { label: "Payments", path: "/reporting/payments", icon: CreditCardIcon },
  { label: "Reconciliation", path: "/reporting/reconciliation", icon: ScaleIcon },
  { label: "Payouts", path: "/reporting/payouts", icon: WalletIcon },
  { label: "Exports", path: "/reporting/exports", icon: DownloadIcon },
];

interface ReportingLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function ReportingLayout({ children, title, description }: ReportingLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                <div>
                  <h1 className="text-2xl font-heading font-semibold text-foreground">{title}</h1>
                  {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-border mb-6">
              <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
                {reportingTabs.map((tab) => {
                  const isActive = location.pathname === tab.path;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.path}
                      onClick={() => navigate(tab.path)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
