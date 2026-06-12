CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supabase_auth_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_supabase_auth_id_unique" UNIQUE("supabase_auth_id")
);
--> statement-breakpoint
CREATE TABLE "marketing_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"consented_at" timestamp with time zone NOT NULL,
	"source" varchar(50),
	"unsubscribed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"order_id" uuid,
	"rating" smallint NOT NULL,
	"text" text,
	"image_url" text,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" >= 1 AND "reviews"."rating" <= 5)
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
-- ============================================================
-- RLS: Row Level Security (Story 1.5)
-- NOTE: Not tracked by drizzle-kit snapshots.
-- Future generate runs will not affect these statements.
-- ============================================================

-- Enable RLS on business-sensitive tables
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stripe_webhook_events" ENABLE ROW LEVEL SECURITY;

-- products: anon може да чете неархивирани продукти (storefront Supabase anon queries)
CREATE POLICY "anon_read_products" ON "products"
  AS PERMISSIVE FOR SELECT TO anon
  USING (is_archived = false);

-- reviews: anon вижда само одобрени reviews
CREATE POLICY "anon_read_approved_reviews" ON "reviews"
  AS PERMISSIVE FOR SELECT TO anon
  USING (is_approved = true);

-- orders, order_items, users, marketing_consents, cart_reservations,
-- stripe_webhook_events: НУЛА anon policies = всички anon операции блокирани.
-- service_role заобикаля RLS автоматично (Supabase default).

-- NOTE: collections, product_images, product_collections ще получат
-- anon SELECT policies в Story 2.1 когато storefront започне да ги чете.