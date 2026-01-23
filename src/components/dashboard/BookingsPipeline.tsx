import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ArrowRightIcon,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const stageConfig = {
  pending: {
    icon: ClockIcon,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  confirmed: {
    icon: CheckCircleIcon,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  in_progress: {
    icon: ArrowRightIcon,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  completed: {
    icon: CheckCircleIcon,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
};

const activityStyles = {
  new: "bg-blue-500",
  confirmed: "bg-emerald-500",
  payment: "bg-primary",
  cancelled: "bg-red-500",
};

export function BookingsPipeline() {
  const { pipelineStages, recentActivity, totalPipelineValue, totalBookingsCount, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <Card className="border-none shadow-[var(--shadow-card)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-[var(--shadow-card)]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-lg text-foreground">
            Bookings Pipeline
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {totalBookingsCount} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pipeline Stages */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineStages.map((stage) => {
            const config = stageConfig[stage.id as keyof typeof stageConfig] || stageConfig.pending;
            const Icon = config.icon;
            const percentage = totalBookingsCount > 0 ? (stage.count / totalBookingsCount) * 100 : 0;

            return (
              <div
                key={stage.id}
                className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
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
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className={`w-2 h-2 rounded-full ${activityStyles[activity.type as keyof typeof activityStyles] || "bg-gray-500"}`} />
                  <span className="text-foreground font-medium">{activity.action}</span>
                  <span className="text-muted-foreground truncate flex-1">{activity.hotel}</span>
                  <span className="text-xs text-muted-foreground/70 shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Pipeline Value */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Pipeline Value</span>
            <span className="text-xl font-heading text-foreground">
              ${totalPipelineValue.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
