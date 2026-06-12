CREATE TYPE "public"."courier" AS ENUM('econt', 'speedy', 'manual');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('received', 'in_production', 'ready', 'shipped', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'cash_on_delivery');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('spring', 'summer', 'autumn', 'winter', 'all');--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"season_start_month" smallint,
	"season_end_month" smallint,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"season" "season",
	"is_last_minute" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"production_days" smallint,
	"occasion_tags" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_text" varchar(255) NOT NULL,
	"sort_order" smallint DEFAULT 0,
	"is_hero" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;