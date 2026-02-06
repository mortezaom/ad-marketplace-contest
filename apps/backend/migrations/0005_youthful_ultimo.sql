CREATE TYPE "public"."tg_login_mode" AS ENUM('phone', 'qr');--> statement-breakpoint
CREATE TYPE "public"."tg_login_status" AS ENUM('waiting_code', 'waiting_password', 'done', 'expired', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."tg_session_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."tg_session_type" AS ENUM('stats_agent');--> statement-breakpoint
CREATE TABLE "tg_login_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode" "tg_login_mode" NOT NULL,
	"status" "tg_login_status" NOT NULL,
	"storage_key" text NOT NULL,
	"phone" text,
	"phone_code_hash" text,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tg_login_flows_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "tg_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "tg_session_type" NOT NULL,
	"status" "tg_session_status" DEFAULT 'active' NOT NULL,
	"label" text,
	"storage_key" text NOT NULL,
	"tg_user_id" integer NOT NULL,
	"tg_username" text,
	"tg_first_name" text NOT NULL,
	"tg_last_name" text,
	"assigned_channels_count" integer DEFAULT 0 NOT NULL,
	"last_flood_until" timestamp with time zone,
	"is_premium" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tg_sessions_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tid_unique" UNIQUE("tid");