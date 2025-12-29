import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  AlertCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from "lucide-react";

interface PipelineStage {
  id: string;
  name: string;
  count: number;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const pipelineStages: PipelineStage[] = [
  {
    id: "pending",
    name: "Pending",
    count: 12,
    value: 28500,
    icon: ClockIcon,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "confirmed",
    name: "Confirmed",
    count: 45,
    value: 89200,
    icon: CheckCircleIcon,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "in_progress",
    name: "In Progress",
    count: 8,
    value: 15800,
    icon: ArrowRightIcon,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "completed",
    name: "Completed",
    count: 156,
    value: 312000,
    icon: CheckCircleIcon,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const recentActivity = [
  { id: "1", action: "New booking", hotel: "The Ritz Paris", time: "2 min ago", type: "new" },
  { id: "2", action: "Confirmed", hotel: "Marina Bay Sands", time: "15 min ago", type: "confirmed" },
  { id: "3", action: "Payment received", hotel: "Four Seasons NYC", time: "1 hour ago", type: "payment" },
  { id: "4", action: "Cancellation", hotel: "Grand Hyatt Tokyo", time: "2 hours ago", type: "cancelled" },
];

const activityStyles = {
  new: "bg-blue-500",
  confirmed: "bg-emerald-500",
  payment: "bg-primary",
  cancelled: "bg-red-500",
};

export function BookingsPipeline() {
  const totalBookings = pipelineStages.reduce((sum, stage) => sum + stage.count, 0);
  const totalValue = pipelineStages.reduce((sum, stage) => sum + stage.value, 0);

  return (
    <Card className="border-none shadow-[var(--shadow-card)]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-lg text-foreground">
            Bookings Pipeline
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {totalBookings} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pipeline Stages */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            const percentage = (stage.count / totalBookings) * 100;

            return (
              <div
                key={stage.id}
                className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${stage.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stage.color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{stage.name}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-heading text-foreground">{stage.count}</span>
                    <span className="text-xs text-muted-foreground">
                      ${(stage.value / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h4>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 text-sm"
              >
                <div className={`w-2 h-2 rounded-full ${activityStyles[activity.type as keyof typeof activityStyles]}`} />
                <span className="text-foreground font-medium">{activity.action}</span>
                <span className="text-muted-foreground truncate flex-1">{activity.hotel}</span>
                <span className="text-xs text-muted-foreground/70 shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Pipeline Value */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Pipeline Value</span>
            <span className="text-xl font-heading text-foreground">
              ${totalValue.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
