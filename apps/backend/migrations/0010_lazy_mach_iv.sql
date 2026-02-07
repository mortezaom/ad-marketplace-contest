ALTER TABLE "channels" ADD COLUMN "languages" text;--> statement-breakpoint
ALTER TABLE "channels" DROP COLUMN "last_status_update";--> statement-breakpoint
ALTER TABLE "channels" DROP COLUMN "last_admin_sync";--> statement-breakpoint
ALTER TABLE "tg_login_flows" DROP COLUMN "state";