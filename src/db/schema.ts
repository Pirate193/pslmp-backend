import { AnyPgColumn, boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

//the user,session,account,verification are copied from the better auth docs see:https://better-auth.com/docs/concepts/database#core-schema 
export const user = pgTable("user", {
	id: t.text("id").primaryKey(),
	name: t.text("name").notNull(),
	email: t.varchar("email", { length: 255 }).notNull().unique(),
	emailVerified: t.boolean("email_verified").notNull(),
	image: t.text("image"),
	createdAt: t.timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
	updatedAt: t.timestamp("updated_at", { precision: 6, withTimezone: true }).notNull(),
});


export const session = pgTable("session", {
	id: t.text("id").primaryKey(),
	userId: t.text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	token: t.varchar("token", { length: 255 }).notNull().unique(),
	expiresAt: t.timestamp("expires_at", { precision: 6, withTimezone: true }).notNull(),
	ipAddress: t.text("ip_address"),
	userAgent: t.text("user_agent"),
	createdAt: t.timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
	updatedAt: t.timestamp("updated_at", { precision: 6, withTimezone: true }).notNull(),
});


export const account = pgTable("account", {
	id: t.text("id").primaryKey(),
	userId: t.text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accountId: t.text("account_id").notNull(),
	providerId: t.text("provider_id").notNull(),
	accessToken: t.text("access_token"),
	refreshToken: t.text("refresh_token"),
	accessTokenExpiresAt: t.timestamp("access_token_expires_at", { precision: 6, withTimezone: true }),
	refreshTokenExpiresAt: t.timestamp("refresh_token_expires_at", { precision: 6, withTimezone: true }),
	scope: t.text("scope"),
	idToken: t.text("id_token"),
	password: t.text("password"),
	createdAt: t.timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
	updatedAt: t.timestamp("updated_at", { precision: 6, withTimezone: true }).notNull(),
});

export const verification = pgTable("verification", {
	id: t.text("id").primaryKey(),
	identifier: t.text("identifier").notNull(),
	value: t.text("value").notNull(),
	expiresAt: t.timestamp("expires_at", { precision: 6, withTimezone: true }).notNull(),
	createdAt: t.timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
	updatedAt: t.timestamp("updated_at", { precision: 6, withTimezone: true }).notNull(),
});
export const folders = pgTable("folders",{
    id:uuid("id").defaultRandom().primaryKey(),
    userId:text("userId").notNull().references(()=>user.id,{onDelete:"cascade"}),
    name:text("name").notNull(),
    parentId: uuid("parentId").references((): AnyPgColumn => folders.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
},(table)=>({
     folderUserIdx: index("folders_user_id_idx").on(table.userId),
}));

export const notes = pgTable("notes",{
    id:uuid("id").defaultRandom().primaryKey(),
    userId:text("userId").notNull().references(()=>user.id,{onDelete:"cascade"}),
    folderId:uuid("folderId").references(()=>folders.id,{onDelete:"cascade"}),
    title:text("title").notNull().default("untitled"),
    content:jsonb("content"),
    updatedAt:timestamp("updatedAt").defaultNow().notNull(),
    createdAt:timestamp("createdAt").defaultNow().notNull()
},(table)=>({
    notesUserIdx: t.index("notes_user_id_idx").on(table.userId),     // prefixed name
    notesFolderIdx: t.index("notes_folder_id_idx").on(table.folderId),
}))

export const templates = pgTable("templates",{
    id:uuid("id").defaultRandom().primaryKey(),
    creatorId:text("creatorId").notNull().references(()=>user.id),
    name:text("name").notNull(),
    description:text("description"),
    schemapayload:jsonb("schemapayload").notNull(),
    ispublic:boolean("isPublic").notNull(),
    createdAt:timestamp("createdAt").defaultNow().notNull(),
    updatedAt:timestamp("updatedAt").defaultNow().notNull(),
},(table)=>({
    templatesCreatorIdx: t.index("templates_creator_id_idx").on(table.creatorId),
}))

export const chats = pgTable("chats",{
    id:uuid("id").defaultRandom().primaryKey(),
    title:text("title").notNull(),
    userId:text("userId").notNull().references(()=>user.id,{onDelete:"cascade"}),
    createdAt:timestamp("createdAt").defaultNow().notNull(),
    updatedAt:timestamp("updatedAt").defaultNow().notNull(),
},(table)=>({
    chatsUserIdx:t.index("chats_user_id_idx").on(table.userId),
    chatsUpdateAtIdx:t.index("chats_updatedAt_id_idx").on(table.updatedAt)
})
)

export const messages = pgTable("messages",{
    id:uuid("id").defaultRandom().primaryKey(),
    chatId:text("chatId").notNull().references(()=>chats.id ,{onDelete:"cascade"}),
    role:text("role").notNull(),
    content:text("content").notNull(),
    parts:jsonb("parts").notNull(),
},(table)=>({
   messageChatsIdx:t.index("message_chats_id_idx").on(table.chatId)
}))

