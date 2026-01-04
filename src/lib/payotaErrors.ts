// Payota API error code to user-friendly message mapping

export const PAYOTA_ERROR_MESSAGES: Record<string, string> = {
  body_error: "Invalid request format. Please try again.",
  validation_error: "Please check all card details and try again.",
  invalid_pay_uuid: "Payment session expired. Please refresh and try again.",
  invalid_init_uuid: "Payment session expired. Please refresh and try again.",
  invalid_month: "Invalid expiry month. Please check and try again.",
  invalid_year: "Invalid expiry year. Please check and try again.",
  invalid_cvc: "Invalid security code (CVV). Please check and try again.",
  invalid_card_number: "Invalid card number. Please check and try again.",
  invalid_card_holder: "Invalid cardholder name. Please check and try again.",
  invalid_is_cvc_required: "Payment configuration error. Please try again.",
  luhn_algorithm_error: "Card number failed validation. Please check and try again.",
};

export function getPayotaErrorMessage(errorCode: string): string {
  return PAYOTA_ERROR_MESSAGES[errorCode] || "Payment failed. Please try again.";
}
