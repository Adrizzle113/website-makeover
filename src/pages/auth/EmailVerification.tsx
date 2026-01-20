import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MailIcon, CheckCircleIcon, XCircleIcon, Loader2, RefreshCwIcon, ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";
import { useLanguage } from "@/hooks/useLanguage";

export const EmailVerification = (): JSX.Element => {
  const { t } = useLanguage();
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
      toast.error(t("verify.error.invalidOtp"));
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
        toast.success(t("verify.toast.success"));
        
        setTimeout(() => {
          navigate('/auth/pending-approval', { 
            state: { 
              message: t("verify.success.message"),
              verifiedEmail: userEmail 
            }
          });
        }, 3000);
      } else {
        setVerificationStatus('failed');
        toast.error(data.message || t("verify.error.failed"));
      }
    } catch (error: any) {
      setVerificationStatus('failed');
      toast.error(error.response?.data?.message || t("verify.error.failed"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    toast.info(t("verify.toast.resent"));
  };

  // Success state
  if (verificationStatus === 'success') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="font-heading text-3xl text-foreground mb-3">
            {t("verify.success.title")}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            {t("verify.success.message")}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <p className="text-sm text-green-700 mb-2">
              {t("verify.success.notification")}
            </p>
            <p className="text-xs text-green-600">
              {t("verify.success.redirect")}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-muted-foreground text-sm">{t("verify.success.wait")}</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen">
      {/* Left side - Decorative */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground">
          <h2 className="font-heading text-5xl mb-6 leading-tight">
            {t("verify.heroTitle1")}<br />{t("verify.heroTitle2")}
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            {t("verify.heroDescription")}
          </p>
        </div>
      </div>

      {/* Right side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link 
            to="/auth/register" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="text-sm">{t("verify.backToRegister")}</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
              <MailIcon className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-2">{t("verify.title")}</h1>
            <p className="text-muted-foreground">
              {t("verify.sentCode")}
            </p>
            <p className="text-foreground font-medium mt-1">{userEmail}</p>
          </div>

          {/* Error state message */}
          {verificationStatus === 'failed' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
              <XCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{t("verify.error.incorrectCode")}</span>
            </div>
          )}

          {/* Verification Form */}
          <form onSubmit={handleVerification} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("verify.codeLabel")}
              </label>
              <div className="relative">
                <Input
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    if (verificationStatus === 'failed') setVerificationStatus('pending');
                  }}
                  type="text"
                  placeholder={t("verify.codePlaceholder")}
                  className="pl-12 pr-4 py-3 h-14 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors text-center text-xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                  disabled={isVerifying}
                />
                <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50"
            >
              {isVerifying ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("verify.verifying")}</span>
                </div>
              ) : (
                t("verify.verifyButton")
              )}
            </Button>
          </form>

          {/* Resend OTP */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {t("verify.didntReceive")}
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isVerifying}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCwIcon className="w-4 h-4" />
              {t("verify.resendCode")}
            </button>
          </div>

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              {t("verify.needHelp")}{' '}
              <Link 
                to="/" 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t("verify.contactSupport")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
