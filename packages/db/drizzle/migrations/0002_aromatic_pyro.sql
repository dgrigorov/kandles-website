CREATE TABLE "cart_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" smallint NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_reservations_quantity_positive" CHECK ("cart_reservations"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"guest_email" varchar(255),
	"status" "order_status" DEFAULT 'received' NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"stripe_payment_intent_id" varchar(64),
	"tracking_number" varchar,
	"courier" "courier",
	"gift_wrap" boolean DEFAULT false NOT NULL,
	"gift_card_text" varchar(150),
	"preview_uploaded_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"correction_count" smallint DEFAULT 0 NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "orders_correction_count_check" CHECK ("orders"."correction_count" >= 0 AND "orders"."correction_count" <= 1),
	CONSTRAINT "orders_identity_check" CHECK ("orders"."user_id" IS NOT NULL OR "orders"."guest_email" IS NOT NULL),
	CONSTRAINT "orders_total_price_non_negative" CHECK ("orders"."total_price" >= 0),
	CONSTRAINT "orders_gift_card_text_check" CHECK ("orders"."gift_card_text" IS NULL OR "orders"."gift_wrap" = true)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" smallint NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"snapshot_title" varchar(255) NOT NULL,
	"snapshot_image_url" text,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_unit_price_non_negative" CHECK ("order_items"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_events" (
	"stripe_event_id" varchar(64) PRIMARY KEY NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_reservations" ADD CONSTRAINT "cart_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_reservations" ADD CONSTRAINT "cart_reservations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;