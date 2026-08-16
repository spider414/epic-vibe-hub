import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

/**
 * Payment provider webhook.
 *
 * This is the ONLY place (besides an admin manually confirming a bank transfer)
 * where an order can become `paid`. The browser can never mark a ticket paid.
 *
 * Wiring a provider later (Stripe / Paystack / Flutterwave):
 *  1. Point the provider's webhook at  /api/public/payments/webhook
 *  2. Store its signing secret as PAYMENT_WEBHOOK_SECRET
 *  3. Map the provider's event name to one of the statuses below.
 */
const Payload = z.object({
  event: z.enum(["payment.succeeded", "payment.failed", "payment.refunded"]),
  reference: z.string().min(4).max(64),
  provider: z.string().min(2).max(32).default("stripe"),
  provider_reference: z.string().max(120).optional(),
  amount: z.number().nonnegative().optional(),
});

const STATUS_BY_EVENT = {
  "payment.succeeded": "paid",
  "payment.failed": "cancelled",
  "payment.refunded": "refunded",
} as const;

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PAYMENT_WEBHOOK_SECRET"];
        if (!secret) {
          return new Response("Payment webhook not configured", { status: 503 });
        }

        const body = await request.text();
        const signature = request.headers.get("x-payment-signature") ?? "";
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let parsed: z.infer<typeof Payload>;
        try {
          parsed = Payload.parse(JSON.parse(body));
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: order, error } = await supabaseAdmin
          .from("ticket_orders")
          .select("id,payment_status,amount_total")
          .or(`reference.eq.${parsed.reference},order_number.eq.${parsed.reference}`)
          .maybeSingle();
        if (error) return new Response(error.message, { status: 500 });
        if (!order) return new Response("Order not found", { status: 404 });

        const nextStatus = STATUS_BY_EVENT[parsed.event];

        // Never downgrade a settled order, and never pay a short-paid order.
        if (order.payment_status === nextStatus) return Response.json({ ok: true, idempotent: true });
        if (
          nextStatus === "paid" &&
          parsed.amount !== undefined &&
          parsed.amount < Number(order.amount_total)
        ) {
          return new Response("Amount mismatch", { status: 409 });
        }

        const { error: updateError } = await supabaseAdmin
          .from("ticket_orders")
          .update({
            payment_status: nextStatus,
            payment_provider: parsed.provider,
            provider_reference: parsed.provider_reference ?? null,
          })
          .eq("id", order.id);
        if (updateError) return new Response(updateError.message, { status: 500 });

        return Response.json({ ok: true, status: nextStatus });
      },
    },
  },
});
