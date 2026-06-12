ALTER TABLE "products" ADD COLUMN "slug" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "scent_notes" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_slug_unique" UNIQUE("slug");