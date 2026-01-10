import { relations } from "drizzle-orm/relations";
import { users, sessions, userLifeData } from "./schema";

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
	userLifeData: many(userLifeData),
}));

export const userLifeDataRelations = relations(userLifeData, ({one}) => ({
	user: one(users, {
		fields: [userLifeData.userId],
		references: [users.id]
	}),
}));