/**
 * Payment provider abstraction.
 *
 * IMPORTANT: an order is never marked "paid" by the browser. It stays `pending`
 * until either
 *   a) an admin confirms the bank transfer in the dashboard, or
 *   b) a payment provider webhook (/api/public/payments/webhook) confirms it
 *      server-side after verifying the signature.
 *
 * To add Stripe/Paystack/Flutterwave later, implement `startCheckout` for that
 * provider (server function that creates a session and returns a redirect URL)
 * and handle its webhook event in the webhook route. Nothing else changes.
 */
export type PaymentProvider = "bank_transfer" | "stripe" | "paystack" | "flutterwave";

export const ACTIVE_PROVIDER: PaymentProvider = "bank_transfer";

export type CheckoutInstruction =
  | { kind: "bank_transfer"; reference: string; amount: number }
  | { kind: "redirect"; url: string };

export const PROVIDER_LABEL: Record<PaymentProvider, string> = {
  bank_transfer: "Bank transfer",
  stripe: "Card (Stripe)",
  paystack: "Card (Paystack)",
  flutterwave: "Card (Flutterwave)",
};

export function ticketUrl(token: string) {
  return `/tickets/${token}`;
}
