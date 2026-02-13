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
