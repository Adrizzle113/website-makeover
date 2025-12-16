import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, CheckCircleIcon, AlertCircleIcon, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
export const Login = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<boolean | string>(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      setTimeout(() => setSuccess(false), 5000);
    }
    if (location.state?.verifiedEmail) {
      setEmail(location.state.verifiedEmail);
    }
    if (location.state?.approvedEmail) {
      setEmail(location.state.approvedEmail);
    }
  }, [location.state]);
  const generateUserIdFromEmail = (email: string): string => {
    return email.replace('@', '_').replace(/\./g, '_');
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const userId = generateUserIdFromEmail(email);
      const response = await fetch(`${API_BASE_URL}/api/ratehawk/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          email,
          password
        })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('ratehawkSessionId', data.sessionId);
        localStorage.setItem('ratehawkLoginUrl', data.loginUrl || '');
        localStorage.setItem('userId', userId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('ratehawkAuthTimestamp', new Date().toISOString());
        setSuccess(true);
        setTimeout(() => navigate("/"), 2000);
      } else {
        setError(data.error || "RateHawk authentication failed. Please verify your credentials.");
      }
    } catch (err: any) {
      setError(`Connection error: ${err.message}. Please ensure the backend server is running.`);
    } finally {
      setLoading(false);
    }
  };
  if (success === true) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-8">
        <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-heading text-2xl text-foreground mb-3">
              Welcome Back!
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Authentication successful. Redirecting you now...
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-muted-foreground text-xs">Please wait...</span>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen">
      {/* Left side - Decorative */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden"
        style={{
          backgroundImage: "url('/images/Header.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground">
          <h2 className="font-heading text-5xl mb-6 leading-tight">
            Discover Your<br />Perfect Stay
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            Access exclusive hotel deals and manage your bookings with ease. Your journey begins here.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <span className="font-heading text-2xl text-primary">T</span>
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to continue to your account
            </p>
          </div>

          {/* Success message */}
          {typeof success === 'string' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                  <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-12 pr-12 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
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
              </div>
            </div>

            {/* Error message */}
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
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link 
                to="/auth/register" 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};