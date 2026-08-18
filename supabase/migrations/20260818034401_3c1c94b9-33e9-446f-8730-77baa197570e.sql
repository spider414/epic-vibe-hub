DELETE FROM public.tickets WHERE order_id IN (SELECT id FROM public.ticket_orders WHERE email = 'test@example.com');
DELETE FROM public.ticket_orders WHERE email = 'test@example.com';