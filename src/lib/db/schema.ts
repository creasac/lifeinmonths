import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  dateOfBirth: text("date_of_birth"), // ISO date string
  messages: text("messages").default("[]"), // JSON array of strings
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: text("expires_at").notNull(),
});

// Store custom cell colors/labels as JSON
export const userLifeData = sqliteTable("user_life_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  // JSON structure: { "week-year": { color: "#hex", label: "name" }, ... }
  cellData: text("cell_data").default("{}"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type UserLifeData = typeof userLifeData.$inferSelect;
