-- Full-text search index for Bulgarian product search (AR-38)
-- CONCURRENTLY: does not lock the table during index creation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search
ON products USING GIN(to_tsvector('bulgarian', title || ' ' || coalesce(description, '')));
