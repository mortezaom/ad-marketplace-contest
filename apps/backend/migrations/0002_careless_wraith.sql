ALTER TABLE "users" ALTER COLUMN "tid" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;