CREATE TYPE "public"."auth_event" AS ENUM('REGISTER', 'LOGIN', 'LOGIN_FAILED', 'PASSWORD_RESET');--> statement-breakpoint
CREATE TYPE "public"."delivery_method" AS ENUM('COURIER', 'PICKUP');--> statement-breakpoint
CREATE TABLE "auth_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"type" "auth_event" NOT NULL,
	"ip" text,
	"user_agent" text,
	"device" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_method" "delivery_method" DEFAULT 'COURIER' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "contact_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "contact_phone" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "comment" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "pay_url" text;--> statement-breakpoint
ALTER TABLE "auth_events" ADD CONSTRAINT "auth_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_events_user_idx" ON "auth_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_events_created_idx" ON "auth_events" USING btree ("created_at");