import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/config/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HealthStatus = "healthy" | "warming" | "error" | "checking";

interface HealthData {
  status: HealthStatus;
  responseTime?: number;
  message?: string;
  lastChecked?: Date;
}

interface ApiHealthIndicatorProps {
  refreshInterval?: number; // in milliseconds, default 60000 (1 min)
  showLabel?: boolean;
}

export function ApiHealthIndicator({
  refreshInterval = 60000,
  showLabel = false,
}: ApiHealthIndicatorProps) {
  const [health, setHealth] = useState<HealthData>({ status: "checking" });

  const checkHealth = useCallback(async () => {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${API_BASE_URL}/api/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        // If response took > 5s, it's likely a cold start (warming up)
        const status: HealthStatus = responseTime > 5000 ? "warming" : "healthy";
        setHealth({
          status,
          responseTime,
          message: status === "warming" ? "API is warming up" : "API is healthy",
          lastChecked: new Date(),
        });
      } else {
        setHealth({
          status: "error",
          responseTime,
          message: `API returned ${response.status}`,
          lastChecked: new Date(),
        });
      }
    } catch (err) {
      const responseTime = Date.now() - startTime;

      // If it times out or fails after a while, could be cold start
      if (responseTime > 3000) {
        setHealth({
          status: "warming",
          responseTime,
          message: "API is warming up (cold start)",
          lastChecked: new Date(),
        });
      } else {
        setHealth({
          status: "error",
          message: err instanceof Error ? err.message : "Connection failed",
          lastChecked: new Date(),
        });
      }
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [checkHealth, refreshInterval]);

  const statusColors: Record<HealthStatus, string> = {
    healthy: "bg-green-500",
    warming: "bg-yellow-500 animate-pulse",
    error: "bg-destructive",
    checking: "bg-muted-foreground animate-pulse",
  };

  const statusLabels: Record<HealthStatus, string> = {
    healthy: "Online",
    warming: "Warming up",
    error: "Offline",
    checking: "Checking...",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={checkHealth}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors"
            aria-label={`API Status: ${statusLabels[health.status]}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${statusColors[health.status]}`}
            />
            {showLabel && (
              <span className="text-xs text-muted-foreground">
                {statusLabels[health.status]}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <p className="font-medium">{health.message || statusLabels[health.status]}</p>
            {health.responseTime && (
              <p className="text-muted-foreground">
                Response: {health.responseTime}ms
              </p>
            )}
            {health.lastChecked && (
              <p className="text-muted-foreground">
                Checked: {health.lastChecked.toLocaleTimeString()}
              </p>
            )}
            <p className="text-muted-foreground italic">Click to refresh</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
