CREATE TABLE "product_collections" (
	"product_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "product_collections_product_id_collection_id_pk" PRIMARY KEY("product_id","collection_id")
);
--> statement-breakpoint
ALTER TABLE "collections" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "is_last_minute" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "is_archived" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "sort_order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "is_hero" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_is_archived_idx" ON "products" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "product_images_product_id_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_season_start_range" CHECK ("collections"."season_start_month" IS NULL OR ("collections"."season_start_month" >= 1 AND "collections"."season_start_month" <= 12));--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_season_end_range" CHECK ("collections"."season_end_month" IS NULL OR ("collections"."season_end_month" >= 1 AND "collections"."season_end_month" <= 12));--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_season_order" CHECK ("collections"."season_start_month" IS NULL OR "collections"."season_end_month" IS NULL OR "collections"."season_start_month" <= "collections"."season_end_month");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_non_negative" CHECK ("products"."price" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_non_negative" CHECK ("products"."stock" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_production_days_positive" CHECK ("products"."production_days" IS NULL OR "products"."production_days" > 0);--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_url_not_empty" CHECK (char_length("product_images"."url") > 0);--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_sort_order_non_negative" CHECK ("product_images"."sort_order" >= 0);