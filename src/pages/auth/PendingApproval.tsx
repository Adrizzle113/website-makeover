import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowLeftIcon, 
  RefreshCwIcon,
  MailIcon,
  Loader2,
  UserIcon,
  BuildingIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import type { Database } from "@/integrations/supabase/types";

type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

interface UserStatus {
  email: string | null;
  status: ApprovalStatus;
  first_name: string | null;
  last_name: string | null;
}

export const PendingApproval = (): JSX.Element => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  const checkUserStatus = async () => {
    setIsChecking(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("email, status, first_name, last_name")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          setIsChecking(false);
          return;
        }

        if (profile) {
          setUserStatus(profile);
          setUserEmail(profile.email || session.user.email || "");

          if (profile.status === "approved") {
            navigate("/auth/login", {
              state: { 
                message: t("approval.approved.message"),
                approvedEmail: profile.email || session.user.email
              }
            });
          }
        }
      } else if (location.state?.email) {
        // User was redirected from login without session
        setUserEmail(location.state.email);
      }
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkUserStatus();

    // Set up realtime subscription
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        channel = supabase
          .channel("profile-status-changes")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${session.user.id}`,
            },
            (payload) => {
              const newProfile = payload.new as UserStatus;
              setUserStatus(newProfile);
              
              if (newProfile.status === "approved") {
                navigate("/auth/login", {
                  state: { 
                    message: t("approval.approved.message"),
                    approvedEmail: newProfile.email
                  }
                });
              }
            }
          )
          .subscribe();
      }
    };

    setupRealtime();

    // Fallback polling every 30 seconds
    const interval = setInterval(checkUserStatus, 30000);

    return () => {
      clearInterval(interval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [navigate, t]);

  const getStatusConfig = () => {
    if (!userStatus) {
      return {
        icon: ClockIcon,
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600",
        title: t("approval.checkingStatus"),
        subtitle: t("approval.checkingSubtitle")
      };
    }

    switch (userStatus.status) {
      case "approved":
        return {
          icon: CheckCircleIcon,
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          title: t("approval.approved.title"),
          subtitle: t("approval.approved.subtitle")
        };
      case "rejected":
        return {
          icon: XCircleIcon,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          title: t("approval.rejected.title"),
          subtitle: t("approval.rejected.subtitle")
        };
      default:
        return {
          icon: ClockIcon,
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          title: t("approval.pending.title"),
          subtitle: t("approval.pending.subtitle").replace("{name}", userStatus.first_name || "")
        };
    }
  };

  const getStatusLabel = (status: ApprovalStatus) => {
    switch (status) {
      case "approved":
        return t("approval.statusApproved");
      case "rejected":
        return t("approval.statusRejected");
      default:
        return t("approval.statusPending");
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <main className="flex min-h-screen relative">
      {/* Language Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground">
          <h2 className="font-heading text-5xl mb-6 leading-tight">
            {t("approval.heroTitle1")}<br />{t("approval.heroTitle2")}
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            {t("approval.heroDescription")}
          </p>
        </div>
      </div>

      {/* Right side - Status */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link 
            to="/auth/login" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="text-sm">{t("approval.backToLogin")}</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${statusConfig.iconBg} mb-6`}>
              <StatusIcon className={`w-10 h-10 ${statusConfig.iconColor}`} />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-2">{statusConfig.title}</h1>
            <p className="text-muted-foreground">{statusConfig.subtitle}</p>
          </div>

          {/* Account Details */}
          {userStatus && (
            <div className="bg-muted/50 rounded-2xl p-6 mb-6 border border-border/50">
              <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                {t("approval.accountDetails")}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("approval.name")}</span>
                  <span className="text-foreground font-medium">
                    {userStatus.first_name} {userStatus.last_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("approval.email")}</span>
                  <span className="text-foreground font-medium truncate ml-4">
                    {userStatus.email || userEmail}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("approval.status")}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    userStatus.status === 'approved' ? 'bg-green-100 text-green-700' :
                    userStatus.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {getStatusLabel(userStatus.status)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* What happens next */}
          {(!userStatus || userStatus.status === 'pending') && (
            <div className="bg-accent/10 rounded-2xl p-6 mb-6 border border-accent/20">
              <div className="flex items-start gap-3">
                <MailIcon className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-2">{t("approval.whatNext")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {t("approval.step1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {t("approval.step2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {t("approval.step3")}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {(!userStatus || userStatus.status === 'pending' || userStatus.status === 'rejected') && (
            <div className="flex gap-3">
              <Button
                onClick={checkUserStatus}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-border/50 hover:bg-muted/50"
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    {t("approval.refreshStatus")}
                  </>
                )}
              </Button>
              <Button
                onClick={() => window.location.href = "mailto:support@bookingja.com"}
                className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
              >
                <BuildingIcon className="w-4 h-4 mr-2" />
                {t("approval.contactSupport")}
              </Button>
            </div>
          )}

          {/* Auto-refresh indicator */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {t("approval.autoRefresh")}
            </div>
          </div>

          {/* Help */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("approval.questions")}{' '}
              <Link 
                to="/" 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t("approval.getInTouch")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
