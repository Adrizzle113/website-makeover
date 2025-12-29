import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangleIcon, 
  ClockIcon, 
  CreditCardIcon, 
  CalendarIcon,
  XIcon,
  ChevronRightIcon,
  BellIcon,
} from "lucide-react";
import { useState } from "react";

interface Alert {
  id: string;
  type: "warning" | "urgent" | "info";
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
  timestamp: string;
  icon: React.ElementType;
}

const initialAlerts: Alert[] = [
  {
    id: "1",
    type: "urgent",
    title: "Payment Failed",
    description: "Booking BK-2849 payment was declined. Contact client immediately.",
    action: "View Booking",
    actionUrl: "/orders/BK-2849",
    timestamp: "10 min ago",
    icon: CreditCardIcon,
  },
  {
    id: "2",
    type: "warning",
    title: "Cancellation Deadline",
    description: "3 bookings have free cancellation ending in 24 hours.",
    action: "Review",
    actionUrl: "/reporting/bookings",
    timestamp: "1 hour ago",
    icon: ClockIcon,
  },
  {
    id: "3",
    type: "info",
    title: "Upcoming Check-ins",
    description: "5 guests checking in tomorrow. Confirm all arrangements.",
    action: "View List",
    actionUrl: "/trips",
    timestamp: "2 hours ago",
    icon: CalendarIcon,
  },
  {
    id: "4",
    type: "warning",
    title: "Rate Expiring",
    description: "Held rate for Grand Hyatt Tokyo expires in 2 hours.",
    action: "Complete Booking",
    actionUrl: "/booking",
    timestamp: "2 hours ago",
    icon: AlertTriangleIcon,
  },
];

const typeStyles = {
  urgent: {
    badge: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
  },
  warning: {
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
  },
  info: {
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
};

export function AlertsPanel() {
  const [alerts, setAlerts] = useState(initialAlerts);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const urgentCount = alerts.filter((a) => a.type === "urgent").length;

  return (
    <Card className="border-none shadow-[var(--shadow-card)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-heading text-lg text-foreground">
              Alerts & Notifications
            </CardTitle>
            {urgentCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">
                {urgentCount} urgent
              </Badge>
            )}
          </div>
          {alerts.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setAlerts([])}
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <BellIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground/70">No pending alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const styles = typeStyles[alert.type];
              const Icon = alert.icon;

              return (
                <div
                  key={alert.id}
                  className={`relative p-4 rounded-lg ${styles.bg} border border-border/50 group transition-all hover:shadow-sm`}
                >
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-background/80 transition-opacity"
                  >
                    <XIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  <div className="flex gap-3">
                    <div className={`shrink-0 ${styles.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-foreground">
                          {alert.title}
                        </h4>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${styles.badge}`}>
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground/70">
                          {alert.timestamp}
                        </span>
                        {alert.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-primary hover:text-primary/80"
                          >
                            {alert.action}
                            <ChevronRightIcon className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
