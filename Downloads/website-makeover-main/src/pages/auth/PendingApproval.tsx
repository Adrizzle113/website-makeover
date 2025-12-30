import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClockIcon, MailIcon, CheckCircleIcon, XCircleIcon, Loader2, RefreshCwIcon, UserIcon, BuildingIcon, ArrowLeftIcon } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

interface UserStatus {
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  email_Verification: 'verified' | 'unverified';
  first_name: string;
  last_name: string;
}

export const PendingApproval = (): JSX.Element => {
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const pendingEmail = localStorage.getItem('pendingVerificationEmail');
    const storedUserEmail = localStorage.getItem('userEmail');
    const email = pendingEmail || storedUserEmail;
    
    if (!email) {
      navigate('/auth/login');
      return;
    }

    setUserEmail(email);
    checkUserStatus(email);
    
    const interval = setInterval(() => {
      checkUserStatus(email);
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const checkUserStatus = async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/status/${email}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const user = data.data;
        setUserStatus(user);
        
        if (user.status === 'approved') {
          localStorage.removeItem('pendingVerificationEmail');
          navigate('/auth/login', { 
            state: { 
              message: "Your account has been approved! Please login to access your dashboard.",
              approvedEmail: email 
            }
          });
        }
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusConfig = () => {
    if (!userStatus) {
      return {
        icon: ClockIcon,
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600",
        title: "Checking Status...",
        subtitle: "Please wait while we verify your account status."
      };
    }

    switch (userStatus.status) {
      case 'approved':
        return {
          icon: CheckCircleIcon,
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          title: "Account Approved!",
          subtitle: "Your account has been approved. Redirecting to login..."
        };
      case 'rejected':
        return {
          icon: XCircleIcon,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          title: "Application Not Approved",
          subtitle: "Unfortunately, your application was not approved. Please contact support for more information."
        };
      default:
        return {
          icon: ClockIcon,
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          title: "Account Under Review",
          subtitle: `Hi ${userStatus.first_name}! Your account is being reviewed by our team.`
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <main className="flex min-h-screen">
      {/* Left side - Decorative */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground">
          <h2 className="font-heading text-5xl mb-6 leading-tight">
            Your Journey<br />Awaits
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            We're reviewing your application to ensure the best experience for all our travel partners.
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
            <span className="text-sm">Back to login</span>
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
                Account Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-foreground font-medium">{userStatus.first_name} {userStatus.last_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground font-medium truncate ml-4">{userStatus.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    userStatus.status === 'approved' ? 'bg-green-100 text-green-700' :
                    userStatus.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {userStatus.status.charAt(0).toUpperCase() + userStatus.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email Verified</span>
                  <span className={`flex items-center gap-1 ${userStatus.email_Verification === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                    {userStatus.email_Verification === 'verified' ? (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">Not Verified</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* What happens next */}
          {userStatus?.status === 'pending' && (
            <div className="bg-accent/10 rounded-2xl p-6 mb-6 border border-accent/20">
              <div className="flex items-start gap-3">
                <MailIcon className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-2">What happens next?</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      Our team is reviewing your application
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      You'll receive an email once approved
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      This page updates automatically
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {(userStatus?.status === 'pending' || userStatus?.status === 'rejected') && (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setIsChecking(true);
                  checkUserStatus(userEmail);
                }}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-border/50 hover:bg-muted/50"
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    Refresh Status
                  </>
                )}
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
              >
                <BuildingIcon className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          )}

          {/* Auto-refresh indicator */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Auto-refreshing every 30 seconds
            </div>
          </div>

          {/* Help */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Questions?{' '}
              <Link 
                to="/" 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Get in touch
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
