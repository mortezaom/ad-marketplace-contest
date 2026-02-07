CREATE TYPE "public"."admin_role" AS ENUM('owner', 'admin');--> statement-breakpoint
CREATE TYPE "public"."admin_source" AS ENUM('telegram', 'invite');--> statement-breakpoint
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
	"sub_count" integer DEFAULT 0,
	"avg_post_reach" integer DEFAULT 0,
	"last_status_update" timestamp with time zone,
	"last_admin_sync" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channel_admins" ADD CONSTRAINT "channel_admins_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;