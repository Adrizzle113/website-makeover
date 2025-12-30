import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionTimeoutProps {
  /** Timeout in minutes */
  timeoutMinutes?: number;
  /** Warning threshold in minutes before expiry */
  warningMinutes?: number;
  /** Called when session expires */
  onExpire: () => void;
  /** Called when user requests to restart */
  onRestart: () => void;
}

export function SessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onExpire,
  onRestart,
}: SessionTimeoutProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(timeoutMinutes * 60);
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  const resetTimer = useCallback(() => {
    setRemainingSeconds(timeoutMinutes * 60);
    setShowWarning(false);
    setShowExpired(false);
  }, [timeoutMinutes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowExpired(true);
          onExpire();
          return 0;
        }
        
        // Show warning when approaching timeout
        if (prev === warningMinutes * 60) {
          setShowWarning(true);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire, warningMinutes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isLow = remainingSeconds <= warningMinutes * 60;

  return (
    <>
      {/* Timer Display */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          isLow
            ? "bg-amber-500/20 text-amber-600"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Clock className={`h-4 w-4 ${isLow ? "animate-pulse" : ""}`} />
        <span>{formatTime(remainingSeconds)}</span>
      </div>

      {/* Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Session Expiring Soon
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your booking session will expire in {warningMinutes} minutes. 
              Please complete your booking to avoid losing your room selection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWarning(false)}>
              Continue Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Expired Dialog */}
      <AlertDialog open={showExpired} onOpenChange={setShowExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Session Expired
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your booking session has expired. The room rates and availability 
              may have changed. Would you like to start a new search?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExpired(false)}>
              Close
            </AlertDialogCancel>
            <AlertDialogAction onClick={onRestart} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Start New Search
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
