CREATE TYPE "public"."ad_application_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."ad_format" AS ENUM('post', 'story', 'forward');--> statement-breakpoint
CREATE TYPE "public"."ad_request_status" AS ENUM('open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('owner', 'admin');--> statement-breakpoint
CREATE TYPE "public"."admin_source" AS ENUM('telegram', 'invite');--> statement-breakpoint
CREATE TYPE "public"."tg_login_mode" AS ENUM('phone', 'qr');--> statement-breakpoint
CREATE TYPE "public"."tg_login_status" AS ENUM('waiting_code', 'waiting_password', 'done', 'expired', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."tg_session_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."tg_session_type" AS ENUM('stats_agent');--> statement-breakpoint
CREATE TABLE "ad_applications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ad_applications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ad_request_id" integer NOT NULL,
	"channel_id" integer NOT NULL,
	"status" "ad_application_status" DEFAULT 'pending' NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ad_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text,
	"budget" integer DEFAULT 0 NOT NULL,
	"min_subscribers" integer DEFAULT 0,
	"language" text,
	"deadline" timestamp with time zone,
	"ad_format" "ad_format" DEFAULT 'post' NOT NULL,
	"content_guidelines" text,
	"advertiser_id" bigint NOT NULL,
	"status" "ad_request_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_admins" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "channel_admins_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"channel_id" integer NOT NULL,
	"tg_user_id" bigint NOT NULL,
	"role" "admin_role" DEFAULT 'owner' NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" "admin_source" DEFAULT 'telegram' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "channels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tg_id" bigint NOT NULL,
	"access_hash" text NOT NULL,
	"title" text,
	"owner_id" bigint,
	"tg_link" text NOT NULL,
	"sub_count" integer DEFAULT 0,
	"avg_post_reach" integer DEFAULT 0,
	"languages" text,
	"listingInfo" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "channels_tg_id_unique" UNIQUE("tg_id")
);
--> statement-breakpoint
CREATE TABLE "tg_login_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode" "tg_login_mode" NOT NULL,
	"status" "tg_login_status" NOT NULL,
	"storage_key" text NOT NULL,
	"phone" text,
	"phone_code_hash" text,
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
	"tg_user_id" text NOT NULL,
	"tg_username" text,
	"tg_first_name" text NOT NULL,
	"tg_last_name" text,
	"is_premium" boolean DEFAULT false NOT NULL,
	"last_flood_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tg_sessions_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tid" bigint,
	"first_name" varchar NOT NULL,
	"last_name" varchar DEFAULT '',
	"photo_url" varchar DEFAULT '',
	"username" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_tid_unique" UNIQUE("tid")
);
--> statement-breakpoint
ALTER TABLE "ad_applications" ADD CONSTRAINT "ad_applications_ad_request_id_ad_requests_id_fk" FOREIGN KEY ("ad_request_id") REFERENCES "public"."ad_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_applications" ADD CONSTRAINT "ad_applications_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_admins" ADD CONSTRAINT "channel_admins_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;