import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MailIcon, UserIcon, BriefcaseIcon, Loader2, BuildingIcon, MapPinIcon, FileTextIcon } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";

export const Register = (): JSX.Element => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    agency_name: "",
    legal_name: "",
    city: "",
    address: "",
    actual_address_matches: false,
    itn: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();

      if (res.ok) {
        toast.success(data.success || "Registration successful! Please check your email for verification code.");
        localStorage.setItem('pendingVerificationEmail', formData.email);
        navigate('/auth/email-verification', { state: { email: formData.email } });
      } else {
        toast.error(data.message || "Registration failed!");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Registration failed!");
    } finally {
      setLoading(false);
    }
  };

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
            Start Your<br />Journey Today
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            Join thousands of travel professionals accessing exclusive hotel deals and seamless booking management.
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-background via-background to-accent/5 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <span className="font-heading text-2xl text-primary">T</span>
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              Join us to find your perfect travel solutions
            </p>
            
            {/* Step indicator */}
            <div className="flex justify-center items-center gap-3 mt-6">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                1
              </div>
              <div className={`w-12 h-0.5 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {step === 1 ? 'Personal Information' : 'Business Details'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <Input
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        type="text"
                        placeholder="John"
                        className="pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                        required
                      />
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <Input
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        type="text"
                        placeholder="Doe"
                        className="pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                        required
                      />
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="john@example.com"
                      className="pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                      required
                    />
                    <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number
                  </label>
                  <div className="flex">
                    <select
                      name="countryCode"
                      onChange={handleChange}
                      required
                      className="h-12 px-3 bg-muted/50 border border-border/50 border-r-0 rounded-l-xl text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+49">+49</option>
                    </select>
                    <Input
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      type="tel"
                      placeholder="(555) 000-0000"
                      required
                      className="h-12 rounded-l-none rounded-r-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business Name
                  </label>
                  <div className="relative">
                    <Input
                      name="agency_name"
                      value={formData.agency_name}
                      onChange={handleChange}
                      type="text"
                      required
                      placeholder="Your Travel Agency"
                      className="pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                    />
                    <BriefcaseIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Legal Entity Name
                  </label>
                  <div className="relative">
                    <Input
                      name="legal_name"
                      value={formData.legal_name}
                      onChange={handleChange}
                      type="text"
                      placeholder="Legal Company Name LLC"
                      className="pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                      required
                    />
                    <BuildingIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tax ID Number
                  </label>
                  <div className="relative">
                    <Input
                      name="itn"
                      value={formData.itn}
                      onChange={handleChange}
                      type="number"
                      placeholder="123456789"
                      className="pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                      required
                    />
                    <FileTextIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    City
                  </label>
                  <div className="relative">
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      type="text"
                      placeholder="New York"
                      className="pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                      required
                    />
                    <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Legal Address
                  </label>
                  <div className="relative">
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      type="text"
                      placeholder="123 Business Street, Suite 100"
                      className="pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:bg-background transition-colors"
                      required
                    />
                    <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                  <input
                    name="actual_address_matches"
                    type="checkbox"
                    checked={formData.actual_address_matches}
                    onChange={handleChange}
                    required
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
                  />
                  <label className="text-sm text-muted-foreground leading-relaxed">
                    I am part of Host/Agency chain/Franchise
                  </label>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  By clicking "Complete Registration", you accept our terms and conditions.
                </p>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl text-base font-medium border-border/50 hover:bg-muted/50 transition-all"
                  >
                    Back
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Registering...</span>
                      </div>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                to="/auth/login" 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
