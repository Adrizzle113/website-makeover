import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  EyeIcon, 
  EyeOffIcon, 
  MailIcon, 
  LockIcon, 
  CheckCircleIcon, 
  AlertCircleIcon, 
  Loader2
} from "lucide-react";
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, password })
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
      <main className="flex min-h-screen items-center justify-center bg-secondary p-8">
        <Card className="w-full max-w-md rounded-[30px] shadow-lg">
          <CardContent className="p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="font-heading text-2xl text-primary mb-2">
              RateHawk Authentication Successful!
            </h1>
            <p className="text-muted-foreground text-sm mb-4">
              Successfully logged into RateHawk platform.
            </p>
            <div className="text-xs text-green-600 mb-4">
              User ID: {generateUserIdFromEmail(email)}
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
              <p className="text-muted-foreground text-xs">Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

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
              <h1 className="font-heading text-3xl text-primary mb-2">
                RateHawk Authentication
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in with your RateHawk credentials
              </p>
            </div>

            {typeof success === 'string' && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="RateHawk Email Address"
                    className="pl-12 pr-4 py-3 rounded-[15px] bg-muted border-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                  <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="RateHawk Password"
                    className="pl-12 pr-12 py-3 rounded-[15px] bg-muted border-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary disabled:opacity-50"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                className="w-full py-3 rounded-[15px]"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <span>Sign In to RateHawk</span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?
                <Link to="/auth/register" className="ml-2 text-primary hover:underline font-medium">
                  Sign Up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
