import { bigint, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"

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

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect
