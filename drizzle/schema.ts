import { sqliteTable, AnySQLiteColumn, foreignKey, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const sessions = sqliteTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	expiresAt: text("expires_at").notNull(),
});

export const userLifeData = sqliteTable("user_life_data", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	cellData: text("cell_data").default("{}"),
	updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
},
(table) => [
	uniqueIndex("user_life_data_user_id_unique").on(table.userId),
]);

export const users = sqliteTable("users", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	username: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	dateOfBirth: text("date_of_birth"),
	expectedLifeYears: integer("expected_life_years").default(80),
	createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
},
(table) => [
	uniqueIndex("users_username_unique").on(table.username),
]);

