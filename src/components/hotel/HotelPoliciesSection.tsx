import { Clock, Info, Wallet, PawPrint, BedDouble, MessageCircle } from "lucide-react";
import type { HotelDetails } from "@/types/booking";
import { sanitizeDescription } from "@/lib/utils";
import { getLanguage } from "@/hooks/useLanguage";

const translations: Record<string, Record<string, string>> = {
  en: {
    checkInOutTimes: "Check-in/out Times",
    checkIn: "Check-in",
    checkOut: "Check-out",
    deposit: "Deposit",
    additionalBed: "Additional bed",
    pets: "Pets",
    hotelPolicies: "Hotel Policies",
    additionalInfo: "Additional Information",
    noInfo: "No information available",
  },
  pt: {
    checkInOutTimes: "Horários de Check-in/out",
    checkIn: "Check-in",
    checkOut: "Check-out",
    deposit: "Depósito",
    additionalBed: "Cama adicional",
    pets: "Animais de estimação",
    hotelPolicies: "Políticas do Hotel",
    additionalInfo: "Informações Adicionais",
    noInfo: "Informação não disponível",
  },
  es: {
    checkInOutTimes: "Horarios de Check-in/out",
    checkIn: "Check-in",
    checkOut: "Check-out",
    deposit: "Depósito",
    additionalBed: "Cama adicional",
    pets: "Mascotas",
    hotelPolicies: "Políticas del Hotel",
    additionalInfo: "Información Adicional",
    noInfo: "Información no disponible",
  },
};

interface DepositPolicy {
  type: string;
  price: string;
}

interface AdditionalBedPolicy {
  maxNumber?: string;
  price: string;
  note?: string;
}

interface PetPolicy {
  availability: string;
  price: string;
}

interface HotelPoliciesSectionProps {
  hotel: HotelDetails;
  deposit?: DepositPolicy;
  additionalBed?: AdditionalBedPolicy;
  pets?: PetPolicy;
}

const defaultDeposit: DepositPolicy = {
  type: "Price",
  price: "200 USD per room for the whole period of stay",
};

const defaultAdditionalBed: AdditionalBedPolicy = {
  maxNumber: "Needs to be clarified on the spot",
  price: "25 USD per guest per night",
};

const defaultPets: PetPolicy = {
  availability: "Any pets are allowed",
  price: "25 USD per each pet for the whole period of stay",
};

export function HotelPoliciesSection({
  hotel,
  deposit = defaultDeposit,
  additionalBed = defaultAdditionalBed,
  pets = defaultPets,
}: HotelPoliciesSectionProps) {
  const language = getLanguage();
  const t = translations[language] || translations.en;
  const hasCheckTimes = hotel.checkInTime || hotel.checkOutTime;
  
  // Helper to get policy text with HTML stripped
  const getPolicyText = (policy: string | { title?: string; content?: string }): string => {
    const raw = typeof policy === 'string' 
      ? policy 
      : (policy?.content || policy?.title || '');
    return sanitizeDescription(raw);
  };

  // Split text into individual sentences
  const splitIntoSentences = (text: string): string[] => {
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  // Collect all sentences from all policies
  const allPolicies = hotel.policies || [];
  const allSentences: string[] = [];
  allPolicies.forEach(policy => {
    const text = getPolicyText(policy);
    const sentences = splitIntoSentences(text);
    allSentences.push(...sentences);
  });

  // Helper to remove duplicate sentences (case-insensitive)
  const deduplicate = (sentences: string[]): string[] => {
    const seen = new Set<string>();
    return sentences.filter(s => {
      const normalized = s.toLowerCase().trim();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  };

  // Categorize each sentence based on content
  const petSentences = deduplicate(allSentences.filter(s => {
    const lower = s.toLowerCase();
    return lower.includes('pet') || lower.includes('animal');
  }));

  const depositSentences = deduplicate(allSentences.filter(s => {
    const lower = s.toLowerCase();
    const isPet = lower.includes('pet') || lower.includes('animal');
    return !isPet && (
      lower.includes('deposit') || 
      lower.includes('cost:') || 
      (lower.includes('usd') && lower.includes('per room'))
    );
  }));

  const bedSentences = deduplicate(allSentences.filter(s => {
    const lower = s.toLowerCase();
    return lower.includes('extra bed') || 
           lower.includes('additional bed') || 
           lower.includes('crib') || 
           lower.includes('cot') ||
           lower.includes('room category');
  }));

  // Additional info sentences (resort fee, requests, adjoining rooms, payment methods)
  const additionalInfoSentences = deduplicate(allSentences.filter(s => {
    const lower = s.toLowerCase();
    return lower.includes('resort fee') ||
           lower.includes('request') ||
           lower.includes('adjoining') ||
           lower.includes('connecting') ||
           lower.includes('cash') ||
           lower.includes('credit') ||
           lower.includes('payment') ||
           lower.includes('front desk') ||
           lower.includes('accepts') ||
           lower.includes('property') ||
           lower.includes('meal');
  }));

  const generalSentences = deduplicate(allSentences.filter(s => {
    const lower = s.toLowerCase();
    const isPet = lower.includes('pet') || lower.includes('animal');
    const isDeposit = !isPet && (
      lower.includes('deposit') || 
      lower.includes('cost:') || 
      (lower.includes('usd') && lower.includes('per room'))
    );
    const isBed = lower.includes('extra bed') || 
                  lower.includes('additional bed') || 
                  lower.includes('crib') || 
                  lower.includes('cot') ||
                  lower.includes('room category');
    const isAdditionalInfo = lower.includes('resort fee') ||
                             lower.includes('request') ||
                             lower.includes('adjoining') ||
                             lower.includes('connecting') ||
                             lower.includes('cash') ||
                             lower.includes('credit') ||
                             lower.includes('payment') ||
                             lower.includes('front desk') ||
                             lower.includes('accepts') ||
                             lower.includes('property') ||
                             lower.includes('meal');
    return !isPet && !isDeposit && !isBed && !isAdditionalInfo;
  }));

  const hasPolicies = generalSentences.length > 0;

  return (
    <section className="py-8 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Check-in/Check-out */}
          {hasCheckTimes && (
            <div className="bg-muted/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">{t.checkInOutTimes}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {hotel.checkInTime && (
                  <div>
                    <span className="text-muted-foreground block">{t.checkIn}</span>
                    <span className="font-medium text-foreground">{hotel.checkInTime}</span>
                  </div>
                )}
                {hotel.checkOutTime && (
                  <div>
                    <span className="text-muted-foreground block">{t.checkOut}</span>
                    <span className="font-medium text-foreground">{hotel.checkOutTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deposit */}
          <div className="bg-muted/50 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{t.deposit}</h3>
            </div>
            <div className="space-y-2 text-sm">
              {depositSentences.length > 0 ? (
                depositSentences.map((sentence, idx) => (
                  <div key={idx} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {sentence}
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground">{t.noInfo}</span>
              )}
            </div>
          </div>

          {/* Additional Bed */}
          <div className="bg-muted/50 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <BedDouble className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{t.additionalBed}</h3>
            </div>
            <div className="space-y-2 text-sm">
              {bedSentences.length > 0 ? (
                bedSentences.map((sentence, idx) => (
                  <div key={idx} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {sentence}
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground">{t.noInfo}</span>
              )}
            </div>
          </div>

          {/* Pets */}
          <div className="bg-muted/50 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <PawPrint className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{t.pets}</h3>
            </div>
            <div className="space-y-2 text-sm">
              {petSentences.length > 0 ? (
                petSentences.map((sentence, idx) => (
                  <div key={idx} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {sentence}
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground">{t.noInfo}</span>
              )}
            </div>
          </div>

          {/* General Policies */}
          {hasPolicies && (
            <div className="bg-muted/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">{t.hotelPolicies}</h3>
              </div>
              <ul className="space-y-2">
                {generalSentences.map((sentence, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {sentence}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Information */}
          {additionalInfoSentences.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">{t.additionalInfo}</h3>
              </div>
              <ul className="space-y-2">
                {additionalInfoSentences.map((sentence, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {sentence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
