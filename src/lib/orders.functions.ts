import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CreateOrderInput = z.object({
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  customerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(30),
  notes: z.string().trim().max(500).optional(),
});

/**
 * Creates a ticket order. The order is ALWAYS created as `pending`.
 * Payment confirmation happens server-side only — either an admin confirms the
 * bank transfer, or a provider webhook flips it to `paid`. The browser can
 * never mark an order paid.
 */
export const createTicketOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CreateOrderInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id,title,status,starts_at")
      .eq("id", data.eventId)
      .maybeSingle();
    if (eventError) throw new Error(eventError.message);
    if (!event) throw new Error("Event not found");
    if (event.status !== "published") throw new Error("Tickets are not on sale for this event");

    const { data: type, error: typeError } = await supabaseAdmin
      .from("ticket_types")
      .select("id,event_id,name,price,quantity_total,quantity_sold,status,sale_starts_at,sale_ends_at")
      .eq("id", data.ticketTypeId)
      .maybeSingle();
    if (typeError) throw new Error(typeError.message);
    if (!type || type.event_id !== event.id) throw new Error("Ticket type not found");
    if (type.status !== "on_sale") throw new Error("This ticket type is not on sale");

    const now = Date.now();
    if (type.sale_starts_at && new Date(type.sale_starts_at).getTime() > now)
      throw new Error("Sales for this ticket have not opened yet");
    if (type.sale_ends_at && new Date(type.sale_ends_at).getTime() < now)
      throw new Error("Sales for this ticket have closed");

    if (type.quantity_total !== null) {
      const remaining = type.quantity_total - (type.quantity_sold ?? 0);
      if (remaining < data.quantity)
        throw new Error(
          remaining <= 0 ? "This ticket type is sold out" : `Only ${remaining} left`,
        );
    }

    // Price is taken from the database, never from the client.
    const amountTotal = Number(type.price) * data.quantity;

    const { data: order, error } = await supabaseAdmin
      .from("ticket_orders")
      .insert({
        event_id: event.id,
        ticket_type_id: type.id,
        ticket_type: type.name,
        quantity: data.quantity,
        amount_total: amountTotal,
        customer_name: data.customerName,
        email: data.email,
        phone: data.phone,
        notes: data.notes ?? null,
        payment_provider: "bank_transfer",
        payment_status: "pending",
      })
      .select("id,order_number,reference,access_token,amount_total")
      .single();
    if (error) throw new Error(error.message);

    return {
      accessToken: order.access_token,
      orderNumber: order.order_number ?? order.reference,
      amountTotal: Number(order.amount_total),
    };
  });
