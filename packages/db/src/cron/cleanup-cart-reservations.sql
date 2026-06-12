DELETE FROM cart_reservations WHERE expires_at < NOW();
