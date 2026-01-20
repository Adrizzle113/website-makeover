import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { MailIcon, UserIcon, Loader2, BuildingIcon, MapPinIcon, FileTextIcon, AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";
import { z } from "zod";
import { useLanguage } from "@/hooks/useLanguage";

// Phone validation functions for Brazil and US
const validateBrazilPhone = (phone: string): boolean => {
  // Brazil: 10-11 digits (with area code). Mobile: 11 digits, Landline: 10 digits
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 10 && digitsOnly.length <= 11;
};

const validateUSPhone = (phone: string): boolean => {
  // US: exactly 10 digits
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length === 10;
};

const validatePhoneByCountry = (phone: string, countryCode: string): boolean => {
  if (countryCode === "+55") {
    return validateBrazilPhone(phone);
  } else if (countryCode === "+1") {
    return validateUSPhone(phone);
  }
  // For other countries, just check minimum length
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

// CPF/CNPJ validation and formatting functions
const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatCPFOrCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return formatCPF(value);
  }
  return formatCNPJ(value);
};

const validateCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
};

const validateCNPJ = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Validate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const firstCheck = remainder < 2 ? 0 : 11 - remainder;
  if (firstCheck !== parseInt(digits[12])) return false;
  
  // Validate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const secondCheck = remainder < 2 ? 0 : 11 - remainder;
  if (secondCheck !== parseInt(digits[13])) return false;
  
  return true;
};

const validateCPFOrCNPJ = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return validateCPF(value);
  if (digits.length === 14) return validateCNPJ(value);
  return false;
};

const createStep1Schema = (countryCode: string) => z.object({
  first_name: z.string().trim().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  last_name: z.string().trim().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  phone_number: z.string().trim().refine(
    (val) => validatePhoneByCountry(val, countryCode),
    {
      message: countryCode === "+55" 
        ? "Brazilian phone must have 10-11 digits (e.g., 11987654321)"
        : countryCode === "+1"
        ? "US phone must have 10 digits (e.g., 5551234567)"
        : "Please enter a valid phone number"
    }
  ),
});

const createStep2Schema = (countryCode: string) => z.object({
  legal_name: z
    .string()
    .trim()
    .min(1, "Legal entity name is required")
    .max(100, "Legal name must be less than 100 characters"),
  itn: countryCode === "+55" 
    ? z.string().trim().refine(validateCPFOrCNPJ, { message: "Please enter a valid CPF or CNPJ" })
    : z.string().trim().min(1, "Tax ID is required").max(20, "Tax ID must be less than 20 characters"),
  city: z.string().trim().min(1, "City is required").max(100, "City must be less than 100 characters"),
  address: z.string().trim().min(1, "Address is required").max(200, "Address must be less than 200 characters"),
  actual_address_matches: z.literal(true, { errorMap: () => ({ message: "You must accept this agreement" }) }),
});

type FieldErrors = Record<string, string>;

export const Register = (): JSX.Element => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [countryCode, setCountryCode] = useState("+55");
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    legal_name: "",
    city: "",
    address: "",
    actual_address_matches: false,
    itn: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Apply CPF/CNPJ formatting for Brazilian users
    let processedValue = value;
    if (name === "itn" && countryCode === "+55") {
      processedValue = formatCPFOrCNPJ(value);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : processedValue,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getPhoneErrorMessage = (): string => {
    if (countryCode === "+55") {
      return t("register.error.phoneBrazil");
    } else if (countryCode === "+1") {
      return t("register.error.phoneUS");
    }
    return t("register.error.phone");
  };

  const validateStep1 = (): boolean => {
    const step1Schema = createStep1Schema(countryCode);
    const result = step1Schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        // Use localized error messages
        if (field === "phone_number") {
          fieldErrors[field] = getPhoneErrorMessage();
        } else {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const getTaxIdErrorMessage = (): string => {
    if (countryCode === "+55") {
      return t("register.error.cpfCnpj");
    }
    return t("register.error.taxId");
  };

  const validateStep2 = (): boolean => {
    const step2Schema = createStep2Schema(countryCode);
    const result = step2Schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        // Use localized error messages
        if (field === "itn") {
          fieldErrors[field] = getTaxIdErrorMessage();
        } else {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleContinue = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.success || t("register.success"));
        localStorage.setItem("pendingVerificationEmail", formData.email);
        navigate("/auth/email-verification", { state: { email: formData.email } });
      } else {
        toast.error(data.message || t("register.failed"));
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(t("register.failed"));
    } finally {
      setLoading(false);
    }
  };

  const InputError = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
        <AlertCircleIcon className="w-3.5 h-3.5" />
        <span>{message}</span>
      </div>
    );
  };

  return (
    <main className="flex min-h-screen relative">
      {/* Language Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground">
          <h2 className="font-heading text-5xl mb-6 leading-tight">
            {t("register.heroTitle1")}
            <br />
            {t("register.heroTitle2")}
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">{t("register.heroDescription")}</p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-background via-background to-accent/5 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <span className="font-heading text-2xl text-primary">T</span>
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-2">{t("register.createAccount")}</h1>
            <p className="text-muted-foreground">{t("register.subtitle")}</p>

            {/* Step indicator */}
            <div className="flex justify-center items-center gap-3 mt-6">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                1
              </div>
              <div className={`w-12 h-0.5 transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                2
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {step === 1 ? t("register.step1Label") : t("register.step2Label")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t("register.firstName")}</label>
                    <div className="relative">
                      <Input
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        type="text"
                        placeholder={t("register.placeholder.firstName")}
                        className={`pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border focus:bg-background transition-colors ${errors.first_name ? "border-red-500 focus:border-red-500" : "border-border/50 focus:border-primary"}`}
                      />
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                    <InputError message={errors.first_name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t("register.lastName")}</label>
                    <div className="relative">
                      <Input
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        type="text"
                        placeholder={t("register.placeholder.lastName")}
                        className={`pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border focus:bg-background transition-colors ${errors.last_name ? "border-red-500 focus:border-red-500" : "border-border/50 focus:border-primary"}`}
                      />
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                    <InputError message={errors.last_name} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("register.email")}</label>
                  <div className="relative">
                    <Input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder={t("register.placeholder.email")}
                      className={`pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border focus:bg-background transition-colors ${errors.email ? "border-red-500 focus:border-red-500" : "border-border/50 focus:border-primary"}`}
                    />
                    <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                  <InputError message={errors.email} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("register.phone")}</label>
                  <div className="flex">
                    <select
                      name="countryCode"
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        // Clear phone error when country changes
                        if (errors.phone_number) {
                          setErrors((prev) => ({ ...prev, phone_number: "" }));
                        }
                      }}
                      className="h-12 px-3 bg-muted/50 border border-border/50 border-r-0 rounded-l-xl text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+49">🇩🇪 +49</option>
                    </select>
                    <Input
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      type="tel"
                      placeholder={countryCode === "+55" ? "11987654321" : countryCode === "+1" ? "5551234567" : "(555) 000-0000"}
                      className={`h-12 rounded-l-none rounded-r-xl bg-muted/50 border focus:bg-background transition-colors ${errors.phone_number ? "border-red-500 focus:border-red-500" : "border-border/50 focus:border-primary"}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {countryCode === "+55" ? t("register.phoneHintBrazil") : countryCode === "+1" ? t("register.phoneHintUS") : ""}
                  </p>
                  <InputError message={errors.phone_number} />
                </div>

                <Button
                  type="button"
                  onClick={handleContinue}
                  className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  {t("register.continue")}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("register.legalName")}</label>
                  <div className="relative">
                    <Input
                      name="legal_name"
                      value={formData.legal_name}
                      onChange={handleChange}
                      type="text"
                      placeholder={t("register.placeholder.legalName")}
                      className={`pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border focus:bg-background transition-colors ${errors.legal_name ? "border-red-500 focus:border-red-500" : "border-border/50 focus:border-primary"}`}
                    />
                    <BuildingIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                  <InputError message={errors.legal_name} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {countryCode === "+55" ? t("register.taxIdBrazil") : t("register.taxId")}
                  </label>
                  <div className="relative">
                    <Input
                      name="itn"
                      value={formData.itn}
                      onChange={handleChange}
                      type="text"
                      placeholder={countryCode === "+55" ? "000.000.000-00 ou 00.000.000/0000-00" : "123456789"}
                      maxLength={countryCode === "+55" ? 18 : 20}
                      className={`pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border focus:bg-background transition-colors ${errors.itn ? "border-red-500 focus:border-red-500" : "border-border/50 focus:border-primary"}`}
                    />
                    <FileTextIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                  {countryCode === "+55" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("register.taxIdHintBrazil")}
                    </p>
                  )}
                  <InputError message={errors.itn} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("register.city")}</label>
                  <div className="relative">
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      type="text"
                      placeholder={t("register.placeholder.city")}
                      className={`pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border focus:bg-background transition-colors ${errors.city ? "border-red-500 focus:border-red-500" : "border-border/50 focus:border-primary"}`}
                    />
                    <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                  <InputError message={errors.city} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("register.legalAddress")}</label>
                  <div className="relative">
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      type="text"
                      placeholder={t("register.placeholder.address")}
                      className={`pl-12 pr-4 py-3 h-12 rounded-xl bg-muted/50 border focus:bg-background transition-colors ${errors.address ? "border-red-500 focus:border-red-500" : "border-border/50 focus:border-primary"}`}
                    />
                    <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                  <InputError message={errors.address} />
                </div>

                <div
                  className={`flex items-start gap-3 p-4 rounded-xl border ${errors.actual_address_matches ? "bg-red-50/50 border-red-200" : "bg-muted/30 border-border/30"}`}
                >
                  <input
                    name="actual_address_matches"
                    type="checkbox"
                    checked={formData.actual_address_matches}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <label className="text-sm text-muted-foreground leading-relaxed">{t("register.franchise")}</label>
                    <InputError message={errors.actual_address_matches} />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">{t("register.termsNotice")}</p>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl text-base font-medium border-border/50 hover:bg-muted/50 transition-all"
                  >
                    {t("register.back")}
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t("register.registering")}</span>
                      </div>
                    ) : (
                      t("register.complete")
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("register.alreadyHaveAccount")}{" "}
              <Link to="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                {t("register.signIn")}
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <Link to="/" className="text-primary hover:text-primary/80 font-medium transition-colors">
                ← {t("register.backToHome") || "Back to Home"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
