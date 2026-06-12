DELETE FROM cart_reservations WHERE created_at < NOW() - INTERVAL '30 days' AND order_id IS NULL;
