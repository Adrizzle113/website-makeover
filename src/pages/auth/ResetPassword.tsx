import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { LockIcon, EyeIcon, EyeOffIcon, CheckCircleIcon, AlertCircleIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

export const ResetPassword = (): JSX.Element => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Handle the auth callback from the email link
    const handleAuthCallback = async () => {
      try {
        // Check for hash parameters (Supabase sends tokens in URL hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken && type === "recovery") {
          // Set the session from the recovery tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (sessionError) {
            console.error("Session error:", sessionError);
            setError(t("resetPassword.error.invalidLink"));
            setInitializing(false);
            return;
          }

          // Clear the hash from URL for cleaner appearance
          window.history.replaceState(null, "", window.location.pathname);
          setInitializing(false);
          return;
        }

        // Check if user has an existing valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // No valid session, redirect to forgot password
          navigate("/auth/forgot-password");
          return;
        }

        setInitializing(false);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(t("resetPassword.error.invalidLink"));
        setInitializing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError(t("resetPassword.error.password"));
      return;
    }
    
    if (password.length < 6) {
      setError(t("resetPassword.error.passwordLength"));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t("resetPassword.error.passwordMismatch"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // Sign out after password reset and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth/login", { 
          state: { message: t("resetPassword.success.loginMessage") } 
        });
      }, 2000);
    } catch (err: any) {
      console.error("Password update error:", err);
      setError(err.message || t("resetPassword.error.failed"));
    } finally {
      setLoading(false);
    }
  };

  // Show loading while initializing
  if (initializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-8">
        <div className="absolute top-4 right-4 z-50">
          <LanguageToggle />
        </div>
        <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-10 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t("resetPassword.verifying")}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-8">
        <div className="absolute top-4 right-4 z-50">
          <LanguageToggle />
        </div>
        <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-heading text-2xl text-foreground mb-3">
              {t("resetPassword.success.title")}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {t("resetPassword.success.message")}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-muted-foreground text-xs">{t("resetPassword.success.wait")}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground">
          <h2 className="font-heading text-5xl mb-6 leading-tight">
            {t("resetPassword.heroTitle1")}<br />{t("resetPassword.heroTitle2")}
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            {t("resetPassword.heroDescription")}
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <LockIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-2">
              {t("resetPassword.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("resetPassword.subtitle")}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("resetPassword.newPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("resetPassword.newPasswordPlaceholder")}
                    className="pl-12 pr-12 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                  <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t("resetPassword.passwordHint")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("resetPassword.confirmPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                    className="pl-12 pr-12 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                  <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("resetPassword.updating")}</span>
                </div>
              ) : (
                <span>{t("resetPassword.updatePassword")}</span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};
