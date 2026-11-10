ALTER TYPE "public"."auth_event" ADD VALUE 'PASSWORD_CHANGED';--> statement-breakpoint
ALTER TYPE "public"."auth_event" ADD VALUE 'SESSIONS_REVOKED';--> statement-breakpoint
ALTER TYPE "public"."auth_event" ADD VALUE 'EMAIL_VERIFIED';--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verifications_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_verifications_user_idx" ON "email_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_events_email_idx" ON "auth_events" USING btree ("email","created_at");--> statement-breakpoint
-- у тех, кто зарегистрировался до проверки почты, адрес считаем подтверждённым
UPDATE "users" SET "email_verified_at" = "created_at" WHERE "email_verified_at" IS NULL;
