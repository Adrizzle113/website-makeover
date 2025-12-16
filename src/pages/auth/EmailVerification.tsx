import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MailIcon, CheckCircleIcon, XCircleIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";

export const EmailVerification = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem('pendingVerificationEmail');
    const email = emailFromState || emailFromStorage;
    
    if (!email) {
      navigate('/auth/register');
      return;
    }
    
    setUserEmail(email);
    localStorage.setItem('pendingVerificationEmail', email);
  }, [location.state, navigate]);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, otp })
      });

      const data = await response.json();

      if (data.success) {
        setVerificationStatus('success');
        toast.success("Email verified successfully!");
        
        setTimeout(() => {
          navigate('/auth/pending-approval', { 
            state: { 
              message: "Email verified successfully! Your account is now under review.",
              verifiedEmail: userEmail 
            }
          });
        }, 3000);
      } else {
        setVerificationStatus('failed');
        toast.error(data.message || "Verification failed");
      }
    } catch (error: any) {
      setVerificationStatus('failed');
      toast.error(error.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    toast.info("OTP sent to your email");
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />;
      case 'failed':
        return <XCircleIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />;
      default:
        return <MailIcon className="w-16 h-16 text-primary mx-auto mb-4" />;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'success':
        return {
          title: "Email Verified Successfully!",
          subtitle: "Your account is being reviewed. You'll receive an email once approved.",
          showForm: false
        };
      case 'failed':
        return {
          title: "Verification Failed",
          subtitle: "The OTP you entered is incorrect. Please try again.",
          showForm: true
        };
      default:
        return {
          title: "Verify Your Email",
          subtitle: `We've sent a verification code to ${userEmail}`,
          showForm: true
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

            {statusMessage.showForm && (
              <form onSubmit={handleVerification} className="space-y-6">
                <div className="relative">
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="pl-12 pr-4 py-3 rounded-[15px] bg-muted border-none text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                    disabled={isVerifying}
                  />
                  <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                </div>

                <Button
                  type="submit"
                  disabled={isVerifying || otp.length !== 6}
                  className="w-full py-3 rounded-[15px] disabled:opacity-50"
                >
                  {isVerifying ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify Email"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-primary hover:underline font-medium text-sm"
                    disabled={isVerifying}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            {verificationStatus === 'success' && (
              <div className="text-center space-y-4">
                <div className="bg-green-50 p-4 rounded-[15px]">
                  <p className="text-sm text-green-700">
                    🎉 Your email has been verified! Your account is now under review.
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    You'll receive an email notification once your account is approved.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Redirecting to approval status page in a few seconds...
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Need help?
                <button
                  onClick={() => navigate('/')}
                  className="ml-2 text-primary hover:underline font-medium"
                >
                  Contact Support
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
