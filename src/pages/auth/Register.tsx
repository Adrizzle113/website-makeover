import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, AlertCircleIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

export const Register = (): JSX.Element => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t("register.error.email"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        navigate("/dashboard");
      } else {
        toast.success(t("register.success"));
        navigate("/auth/login", { state: { verifiedEmail: email } });
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || t("register.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground">
          <h2 className="font-heading text-5xl mb-6 leading-tight">
            {t("register.heroTitle1")}
            <br />
            {t("register.heroTitle2")}
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            {t("register.heroDescription")}
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <span className="font-heading text-2xl text-primary">T</span>
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-2">
              {t("register.createAccount")}
            </h1>
            <p className="text-muted-foreground">{t("register.subtitle")}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("register.email")}
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder={t("register.placeholder.email")}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("register.password")}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("register.placeholder.password")}
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
                <p className="text-xs text-muted-foreground mt-1">{t("register.passwordHint")}</p>
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
                  <span>{t("register.registering")}</span>
                </div>
              ) : (
                <span>{t("register.complete")}</span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t("register.alreadyHaveAccount")}{" "}
              <Link
                to="/auth/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t("register.signIn")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
