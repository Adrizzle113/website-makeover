import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MailIcon, UserIcon, BriefcaseIcon, Loader2 } from "lucide-react";
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
      <div 
        className="hidden md:block w-[60%] bg-cover bg-center bg-primary"
        style={{ backgroundImage: "url('/images/Header.png')" }}
      />

      <div className="w-full md:w-[40%] bg-secondary p-8 flex items-center justify-center">
        <Card className="w-full max-w-md rounded-[30px] shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl text-primary mb-2">
                Create Account
              </h1>
              <p className="text-muted-foreground text-sm">
                Join us to find your perfect travel solutions
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        type="text"
                        placeholder="First Name"
                        className="pl-12 pr-4 py-3 rounded-[15px] bg-muted border-none"
                        required
                      />
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                    </div>
                    <div className="relative">
                      <Input
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        type="text"
                        placeholder="Last Name"
                        className="pl-12 pr-4 py-3 rounded-[15px] bg-muted border-none"
                        required
                      />
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="Email"
                      className="pl-12 pr-4 py-3 rounded-[15px] bg-muted border-none"
                      required
                    />
                    <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                  </div>

                  <div className="flex items-center">
                    <select
                      name="countryCode"
                      onChange={handleChange}
                      required
                      className="border border-border bg-muted rounded-l-[15px] p-3 text-sm text-foreground"
                    >
                      <option value="+1">US (+1)</option>
                      <option value="+44">UK (+44)</option>
                      <option value="+49">DE (+49)</option>
                    </select>
                    <input
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      type="tel"
                      placeholder="Phone Number"
                      required
                      className="border border-border bg-muted rounded-r-[15px] p-3 text-sm text-foreground flex-grow"
                    />
                  </div>

                  <div className="relative">
                    <Input
                      name="agency_name"
                      value={formData.agency_name}
                      onChange={handleChange}
                      type="text"
                      required
                      placeholder="Business Name"
                      className="pl-12 pr-4 py-3 rounded-[15px] bg-muted border-none"
                    />
                    <BriefcaseIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3 rounded-[15px]"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <Input
                    name="legal_name"
                    value={formData.legal_name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Legal entity name"
                    className="pr-4 py-3 rounded-[15px] bg-muted border-none"
                    required
                  />

                  <Input
                    name="itn"
                    value={formData.itn}
                    onChange={handleChange}
                    type="number"
                    placeholder="ITN (Individual Taxpayer Number)"
                    className="pr-4 py-3 rounded-[15px] bg-muted border-none"
                    required
                  />

                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    type="text"
                    placeholder="Legal entity city"
                    className="pr-4 py-3 rounded-[15px] bg-muted border-none"
                    required
                  />

                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    type="text"
                    placeholder="Legal address"
                    className="pr-4 py-3 rounded-[15px] bg-muted border-none w-full"
                    required
                  />

                  <div className="flex items-center space-x-2">
                    <input
                      name="actual_address_matches"
                      type="checkbox"
                      checked={formData.actual_address_matches}
                      onChange={handleChange}
                      required
                      className="h-4 w-4 cursor-pointer border-border rounded"
                    />
                    <label className="text-sm text-muted-foreground">
                      I am part of Host/Agency chain/Franchise
                    </label>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    By clicking "Complete Registration", you accept the offer.
                  </p>

                  <div className="flex justify-between gap-4">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1 py-3 rounded-[15px]"
                    >
                      Back
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 rounded-[15px]"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Registering...</span>
                        </div>
                      ) : (
                        "Complete Register"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?
                <Link to="/auth/login" className="ml-2 text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
