// Card validation utilities with Luhn algorithm and card type detection

export type CardType = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export interface CardTypeInfo {
  type: CardType;
  name: string;
  lengths: number[];
  cvvLength: number;
  pattern: RegExp;
}

const CARD_TYPES: CardTypeInfo[] = [
  {
    type: "visa",
    name: "Visa",
    lengths: [13, 16, 19],
    cvvLength: 3,
    pattern: /^4/,
  },
  {
    type: "mastercard",
    name: "Mastercard",
    lengths: [16],
    cvvLength: 3,
    pattern: /^(5[1-5]|2[2-7])/,
  },
  {
    type: "amex",
    name: "American Express",
    lengths: [15],
    cvvLength: 4,
    pattern: /^3[47]/,
  },
  {
    type: "discover",
    name: "Discover",
    lengths: [16, 19],
    cvvLength: 3,
    pattern: /^(6011|65|64[4-9])/,
  },
];

/**
 * Detect card type based on card number
 */
export function detectCardType(cardNumber: string): CardTypeInfo {
  const digits = cardNumber.replace(/\D/g, "");
  
  for (const cardType of CARD_TYPES) {
    if (cardType.pattern.test(digits)) {
      return cardType;
    }
  }
  
  return {
    type: "unknown",
    name: "Unknown",
    lengths: [16],
    cvvLength: 3,
    pattern: /./,
  };
}

/**
 * Luhn algorithm for card number validation
 */
export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate card number including Luhn check and length
 */
export function validateCardNumber(cardNumber: string): { valid: boolean; error?: string } {
  const digits = cardNumber.replace(/\D/g, "");
  
  if (digits.length === 0) {
    return { valid: false, error: "Card number is required" };
  }
  
  const cardType = detectCardType(digits);
  
  if (!cardType.lengths.includes(digits.length)) {
    const expectedLength = cardType.lengths.join(" or ");
    return { 
      valid: false, 
      error: `${cardType.name} cards should have ${expectedLength} digits` 
    };
  }
  
  if (!validateLuhn(digits)) {
    return { valid: false, error: "Invalid card number" };
  }
  
  return { valid: true };
}

/**
 * Validate expiry date (MM/YY format)
 */
export function validateExpiryDate(expiry: string): { valid: boolean; error?: string } {
  const cleanExpiry = expiry.replace(/\D/g, "");
  
  if (cleanExpiry.length !== 4) {
    return { valid: false, error: "Enter expiry as MM/YY" };
  }
  
  const month = parseInt(cleanExpiry.substring(0, 2), 10);
  const year = parseInt(cleanExpiry.substring(2, 4), 10);
  
  if (month < 1 || month > 12) {
    return { valid: false, error: "Invalid month (01-12)" };
  }
  
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  
  // Card is expired if year is past, or same year but month is past
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, error: "Card has expired" };
  }
  
  // Check if expiry is too far in the future (more than 20 years)
  if (year > currentYear + 20) {
    return { valid: false, error: "Invalid expiry year" };
  }
  
  return { valid: true };
}

/**
 * Validate CVV based on card type
 */
export function validateCVV(cvv: string, cardType: CardType): { valid: boolean; error?: string } {
  const digits = cvv.replace(/\D/g, "");
  const expectedLength = cardType === "amex" ? 4 : 3;
  
  if (digits.length === 0) {
    return { valid: false, error: "CVV is required" };
  }
  
  if (digits.length !== expectedLength) {
    return { 
      valid: false, 
      error: `CVV should be ${expectedLength} digits` 
    };
  }
  
  return { valid: true };
}

/**
 * Format card number with spaces
 */
export function formatCardNumber(value: string, cardType?: CardType): string {
  const digits = value.replace(/\D/g, "");
  
  // Amex uses 4-6-5 format
  if (cardType === "amex") {
    const parts = [];
    if (digits.length > 0) parts.push(digits.substring(0, 4));
    if (digits.length > 4) parts.push(digits.substring(4, 10));
    if (digits.length > 10) parts.push(digits.substring(10, 15));
    return parts.join(" ");
  }
  
  // Standard 4-4-4-4 format for other cards
  const parts = [];
  for (let i = 0; i < digits.length && i < 16; i += 4) {
    parts.push(digits.substring(i, i + 4));
  }
  return parts.join(" ");
}

/**
 * Format expiry date as MM/YY
 */
export function formatExpiryDate(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 2) {
    return digits.substring(0, 2) + "/" + digits.substring(2, 4);
  }
  return digits;
}

/**
 * Get card brand icon name for display
 */
export function getCardBrandIcon(cardType: CardType): string {
  switch (cardType) {
    case "visa":
      return "💳 Visa";
    case "mastercard":
      return "💳 Mastercard";
    case "amex":
      return "💳 Amex";
    case "discover":
      return "💳 Discover";
    default:
      return "💳";
  }
}
