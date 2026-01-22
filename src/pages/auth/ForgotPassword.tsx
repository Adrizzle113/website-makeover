import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { MailIcon, ArrowLeftIcon, CheckCircleIcon, AlertCircleIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

export const ForgotPassword = (): JSX.Element => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t("forgotPassword.error.email"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || t("forgotPassword.error.failed"));
    } finally {
      setLoading(false);
    }
  };

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
              {t("forgotPassword.success.title")}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {t("forgotPassword.success.message")}
            </p>
            <Link to="/auth/login">
              <Button variant="outline" className="w-full h-12 rounded-xl">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                {t("forgotPassword.backToLogin")}
              </Button>
            </Link>
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
            {t("forgotPassword.heroTitle1")}<br />{t("forgotPassword.heroTitle2")}
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            {t("forgotPassword.heroDescription")}
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link
            to="/auth/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            {t("forgotPassword.backToLogin")}
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <MailIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-2">
              {t("forgotPassword.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("forgotPassword.subtitle")}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("forgotPassword.email")}
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder={t("forgotPassword.emailPlaceholder")}
                  className="pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
                <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
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
                  <span>{t("forgotPassword.sending")}</span>
                </div>
              ) : (
                <span>{t("forgotPassword.sendLink")}</span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t("forgotPassword.rememberPassword")}{" "}
              <Link
                to="/auth/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t("forgotPassword.signIn")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
