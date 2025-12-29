import { AlertTriangle, Info, CreditCard, FileCheck, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Notice {
  type: "warning" | "info";
  title: string;
  message: string;
  icon?: "card" | "id" | "clock" | "default";
}

interface BookingNoticesSectionProps {
  hotelName?: string;
  notices?: Notice[];
  checkInTime?: string;
  depositRequired?: boolean;
  idRequired?: boolean;
  creditCardRequired?: boolean;
}

const defaultNotices: Notice[] = [
  {
    type: "info",
    title: "Check-in Requirements",
    message: "Valid government-issued photo ID required at check-in for all guests.",
    icon: "id",
  },
];

export function BookingNoticesSection({
  hotelName,
  notices = defaultNotices,
  checkInTime,
  depositRequired = false,
  idRequired = true,
  creditCardRequired = true,
}: BookingNoticesSectionProps) {
  // Build notices list based on props
  const allNotices: Notice[] = [...notices];

  if (creditCardRequired) {
    allNotices.push({
      type: "warning",
      title: "Credit Card Required",
      message: "A valid credit card is required at check-in for incidentals and security deposit.",
      icon: "card",
    });
  }

  if (depositRequired) {
    allNotices.push({
      type: "warning",
      title: "Deposit Required",
      message: "A refundable security deposit may be required upon arrival.",
      icon: "default",
    });
  }

  if (allNotices.length === 0) {
    return null;
  }

  const getIcon = (iconType: Notice["icon"], noticeType: Notice["type"]) => {
    const iconClass = noticeType === "warning" ? "text-amber-600" : "text-primary";
    
    switch (iconType) {
      case "card":
        return <CreditCard className={`h-4 w-4 ${iconClass}`} />;
      case "id":
        return <FileCheck className={`h-4 w-4 ${iconClass}`} />;
      case "clock":
        return <Clock className={`h-4 w-4 ${iconClass}`} />;
      default:
        return noticeType === "warning" 
          ? <AlertTriangle className={`h-4 w-4 ${iconClass}`} />
          : <Info className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
        <Info className="h-5 w-5 text-primary" />
        Important Information
      </h3>
      
      {allNotices.map((notice, index) => (
        <Alert
          key={index}
          variant={notice.type === "warning" ? "default" : "default"}
          className={
            notice.type === "warning"
              ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
              : "border-primary/20 bg-primary/5"
          }
        >
          {getIcon(notice.icon, notice.type)}
          <AlertTitle className={notice.type === "warning" ? "text-amber-800 dark:text-amber-200" : "text-foreground"}>
            {notice.title}
          </AlertTitle>
          <AlertDescription className={notice.type === "warning" ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}>
            {notice.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
