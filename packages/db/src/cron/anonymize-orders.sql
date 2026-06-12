UPDATE orders SET guest_email = NULL, shipping_address = '{}' WHERE created_at < NOW() - INTERVAL '3 years' AND user_id IS NOT NULL;
