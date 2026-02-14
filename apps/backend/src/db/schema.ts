import {
	bigint,
	boolean,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"

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

export const channelsTable = pgTable("channels", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	tgId: bigint("tg_id", {
		mode: "bigint",
	})
		.notNull()
		.unique(),
	accessHash: text("access_hash").notNull(),
	title: text("title"),
	ownerId: bigint("owner_id", {
		mode: "number",
	}),
	tgLink: text("tg_link").notNull(),
	subCount: integer("sub_count").default(0),
	avgPostReach: integer("avg_post_reach").default(0),
	languages: text("languages"),
	listingInfo: text("listingInfo"),
	isPublic: boolean("is_public").default(false),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const adminRoleEnum = pgEnum("admin_role", ["owner", "admin"])
export const adminSourceEnum = pgEnum("admin_source", ["telegram", "invite"])

export const channelAdminsTable = pgTable("channel_admins", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	channelId: integer("channel_id")
		.notNull()
		.references(() => channelsTable.id, { onDelete: "cascade" }),
	tgUserId: bigint("tg_user_id", {
		mode: "number",
	}).notNull(),
	role: adminRoleEnum("role").notNull().default("owner"),
	addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
	source: adminSourceEnum("source").notNull().default("telegram"),
})

// Ad Request enums
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

// Ad Requests table - advertiser creates campaign requests
export const adRequestsTable = pgTable("ad_requests", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: text("title").notNull(),
	description: text("description"),
	budget: integer("budget").notNull().default(0),
	minSubscribers: integer("min_subscribers").default(0),
	language: text("language"),
	deadline: timestamp("deadline", { withTimezone: true }),
	adFormat: adFormatEnum("ad_format").notNull().default("post"),
	contentGuidelines: text("content_guidelines"),
	advertiserId: bigint("advertiser_id", { mode: "number" }).notNull(),
	status: adRequestStatusEnum("status").notNull().default("open"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// Ad Applications table - channel owners apply to ad requests
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
