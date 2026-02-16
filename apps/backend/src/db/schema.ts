import {
	bigint,
	boolean,
	decimal,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"

// ─── Users ──────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	tid: bigint({ mode: "number" }).unique(),
	first_name: varchar().notNull(),
	last_name: varchar().default(""),
	photo_url: varchar().default(""),
	username: varchar(),
	created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// ─── Telegram Sessions ─────────────────────────────────────────

export const tgSessionType = pgEnum("tg_session_type", ["stats_agent"])
export const tgSessionStatus = pgEnum("tg_session_status", ["active", "disabled"])

export const tgLoginMode = pgEnum("tg_login_mode", ["phone", "qr"])
export const tgLoginStatus = pgEnum("tg_login_status", [
	"waiting_code",
	"waiting_password",
	"done",
	"expired",
	"canceled",
])

export const tgLoginFlows = pgTable("tg_login_flows", {
	id: uuid("id").primaryKey().defaultRandom(),
	mode: tgLoginMode("mode").notNull(),
	status: tgLoginStatus("status").notNull(),
	storageKey: text("storage_key").notNull().unique(),
	phone: text("phone"),
	phoneCodeHash: text("phone_code_hash"),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const tgSessions = pgTable("tg_sessions", {
	id: uuid("id").primaryKey().defaultRandom(),
	type: tgSessionType("type").notNull(),
	status: tgSessionStatus("status").notNull().default("active"),
	label: text("label"),
	storageKey: text("storage_key").notNull().unique(),
	tgUserId: text("tg_user_id").notNull(),
	tgUsername: text("tg_username"),
	tgFirstName: text("tg_first_name").notNull(),
	tgLastName: text("tg_last_name"),
	isPremium: boolean("is_premium").notNull().default(false),
	lastFloodUntil: timestamp("last_flood_until", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type AccountType = typeof tgSessions.$inferSelect

// ─── Channels ───────────────────────────────────────────────────

export const channelsTable = pgTable("channels", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	tgId: bigint("tg_id", { mode: "bigint" }).notNull().unique(),
	accessHash: text("access_hash").notNull(),
	title: text("title"),
	ownerId: bigint("owner_id", { mode: "number" }),
	tgLink: text("tg_link").notNull(),
	subCount: integer("sub_count").default(0),
	avgPostReach: integer("avg_post_reach").default(0),
	languages: text("languages"),
	listingInfo: text("listingInfo"),
	walletAddress: text(),
	isPublic: boolean("is_public").default(false),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// ─── Channel Admins ─────────────────────────────────────────────

export const adminRoleEnum = pgEnum("admin_role", ["owner", "admin"])
export const adminSourceEnum = pgEnum("admin_source", ["telegram", "invite"])

export const channelAdminsTable = pgTable("channel_admins", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	channelId: integer("channel_id")
		.notNull()
		.references(() => channelsTable.id, { onDelete: "cascade" }),
	tgUserId: bigint("tg_user_id", { mode: "number" }).notNull(),
	role: adminRoleEnum("role").notNull().default("owner"),
	addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
	source: adminSourceEnum("source").notNull().default("telegram"),
})

// ─── Ad Requests & Applications ─────────────────────────────────

export const adFormatEnum = pgEnum("ad_format", ["post", "story", "forward"])
export const adRequestStatusEnum = pgEnum("ad_request_status", [
	"open",
	"in_progress",
	"completed",
	"cancelled",
])
export const adApplicationStatusEnum = pgEnum("ad_application_status", [
	"pending",
	"accepted",
	"rejected",
])

export const adRequestsTable = pgTable("ad_requests", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: text("title").notNull(),
	description: text("description"),
	budget: decimal("budget", { mode: "number" }).notNull().default(0),
	minSubscribers: integer("min_subscribers").default(0),
	language: text("language"),
	deadline: timestamp("deadline", { withTimezone: true }).notNull(),
	adFormat: adFormatEnum("ad_format").notNull().default("post"),
	contentGuidelines: text("content_guidelines"),
	advertiserId: bigint("advertiser_id", { mode: "number" }).notNull(),
	status: adRequestStatusEnum("status").notNull().default("open"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const adApplicationsTable = pgTable("ad_applications", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	adRequestId: integer("ad_request_id")
		.notNull()
		.references(() => adRequestsTable.id, { onDelete: "cascade" }),
	channelId: integer("channel_id")
		.notNull()
		.references(() => channelsTable.id, { onDelete: "cascade" }),
	status: adApplicationStatusEnum("status").notNull().default("pending"),
	appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
})

// ─── Deals ──────────────────────────────────────────────────────

export const dealStatusEnum = pgEnum("deal_status", [
	"awaiting_creative",
	"creative_submitted",
	"awaiting_payment",
	"scheduled",
	"posted",
	"completed",
	"cancelled",
])

export const dealsTable = pgTable("deals", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	applicationId: integer("application_id")
		.notNull()
		.references(() => adApplicationsTable.id),
	channelId: integer("channel_id")
		.notNull()
		.references(() => channelsTable.id),
	advertiserId: bigint("advertiser_id", { mode: "number" }).notNull(),
	adFormat: adFormatEnum("ad_format").notNull(),
	agreedPrice: decimal("agreed_price", { mode: "number" }).notNull(),
	status: dealStatusEnum("status").notNull().default("awaiting_creative"),
	scheduledPostAt: timestamp("scheduled_post_at", {
		withTimezone: true,
	}).notNull(),
	minPostDurationHours: integer("min_post_duration_hours").default(24),
	completedAt: timestamp("completed_at", { withTimezone: true }),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
	tgPostId: bigint("tg_post_id", { mode: "number" }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// ─── Deal Creatives (drafts + approval) ─────────────────────────

export const creativeStatusEnum = pgEnum("creative_status", [
	"draft",
	"submitted",
	"approved",
	"revision_requested",
])

export const dealCreativesTable = pgTable("deal_creatives", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	dealId: integer("deal_id")
		.notNull()
		.references(() => dealsTable.id, { onDelete: "cascade" }),
	version: integer("version").notNull().default(1),
	content: text("content").notNull(),
	mediaUrls: jsonb("media_urls").$type<string[]>().default([]),
	status: creativeStatusEnum("status").notNull().default("draft"),
	submittedAt: timestamp("submitted_at", { withTimezone: true }),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// ─── Posting & Verification ────────────────────────────────────

export const postingStatusEnum = pgEnum("posting_status", [
	"scheduled",
	"posted",
	"verified",
	"deleted_early",
	"edited",
	"failed",
])

export const dealPostingsTable = pgTable("deal_postings", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	dealId: integer("deal_id")
		.notNull()
		.references(() => dealsTable.id, { onDelete: "cascade" }),
	creativeId: integer("creative_id")
		.notNull()
		.references(() => dealCreativesTable.id),
	tgMessageId: integer("tg_message_id"),
	status: postingStatusEnum("status").notNull().default("scheduled"),
	postedAt: timestamp("posted_at", { withTimezone: true }),
	mustStayUntil: timestamp("must_stay_until", { withTimezone: true }),
	lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
	verifiedAt: timestamp("verified_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// ─── Payments ──────────────────────────────────────────────────

export const paymentTypeEnum = pgEnum("payment_type", ["escrow_hold", "release_to_owner", "refund"])

export const paymentStatusEnum = pgEnum("payment_status", [
	"pending",
	"confirming",
	"confirmed",
	"failed",
])

export const paymentsTable = pgTable("payments", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	dealId: integer("deal_id")
		.notNull()
		.unique()
		.references(() => dealsTable.id),
	escrowWallet: integer("escrow_wallet")
		.notNull()
		.references(() => escrowWalletsTable.id),
	type: paymentTypeEnum("type").notNull(),
	status: paymentStatusEnum("status").notNull().default("pending"),
	amountInTon: decimal("amount_in_ton", { mode: "number" }).notNull(),
	fromAddress: text("from_address"),
	toAddress: text("to_address"),
	txHash: text("tx_hash"),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export const escrowWalletsTable = pgTable("escrow_wallets", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	address: text().notNull(),
	publicKey: text().notNull(),
	privateKey: text().notNull(),
})
