import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClockIcon, MailIcon, CheckCircleIcon, XCircleIcon, Loader2 } from "lucide-react";
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

  const getStatusIcon = () => {
    if (!userStatus) return <ClockIcon className="w-16 h-16 text-yellow-600 mx-auto mb-4" />;
    
    switch (userStatus.status) {
      case 'approved':
        return <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />;
      case 'rejected':
        return <XCircleIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />;
      default:
        return <ClockIcon className="w-16 h-16 text-yellow-600 mx-auto mb-4" />;
    }
  };

  const getStatusMessage = () => {
    if (!userStatus) {
      return {
        title: "Checking Account Status...",
        subtitle: "Please wait while we verify your account status.",
        showActions: false
      };
    }

    switch (userStatus.status) {
      case 'approved':
        return {
          title: "Account Approved!",
          subtitle: "Your account has been approved. Redirecting to login...",
          showActions: false
        };
      case 'rejected':
        return {
          title: "Account Not Approved",
          subtitle: "Unfortunately, your account application was not approved. Please contact support for more information.",
          showActions: true
        };
      default:
        return {
          title: "Account Under Review",
          subtitle: `Hi ${userStatus.first_name}! Your account is currently being reviewed by our team.`,
          showActions: true
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <main className="flex min-h-screen">
      <div 
        className="hidden md:block w-[60%] bg-cover bg-center bg-primary"
        style={{ backgroundImage: "url('/images/Header.png')" }}
      />

      <div className="w-full md:w-[40%] bg-secondary p-8 flex items-center justify-center">
        <Card className="w-full max-w-md rounded-[30px] shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              {getStatusIcon()}
              <h1 className="font-heading text-2xl text-primary mb-2">
                {statusMessage.title}
              </h1>
              <p className="text-muted-foreground text-sm">
                {statusMessage.subtitle}
              </p>
            </div>

            {userStatus && (
              <div className="space-y-4 mb-6">
                <div className="bg-muted p-4 rounded-[15px]">
                  <h3 className="font-medium text-primary mb-2">Account Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="text-foreground">{userStatus.first_name} {userStatus.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="text-foreground">{userStatus.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${
                        userStatus.status === 'approved' ? 'text-green-600' :
                        userStatus.status === 'rejected' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {userStatus.status.charAt(0).toUpperCase() + userStatus.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email Verified:</span>
                      <span className={userStatus.email_Verification === 'verified' ? 'text-green-600' : 'text-red-600'}>
                        {userStatus.email_Verification === 'verified' ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {statusMessage.showActions && (
              <div className="space-y-4">
                {userStatus?.status === 'pending' && (
                  <div className="bg-blue-50 p-4 rounded-[15px]">
                    <div className="flex items-start space-x-3">
                      <MailIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">What happens next?</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Our team is reviewing your application</li>
                          <li>• You'll receive an email notification once approved</li>
                          <li>• This page will automatically update</li>
                          <li>• You'll be redirected to login</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1 py-3 rounded-[15px]"
                  >
                    Refresh Status
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    className="flex-1 py-3 rounded-[15px]"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            )}

            {isChecking && (
              <div className="text-center mt-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Checking status...</p>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                This page automatically checks your status every 30 seconds
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
