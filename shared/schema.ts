import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // 'male', 'female', 'other'
  preferredGender: text("preferred_gender").notNull(), // 'male', 'female', 'both'
  profilePicture: text("profile_picture"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
});

export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // 'text', 'image'
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const randomChats = pgTable("random_chats", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const skippedUsers = pgTable("skipped_users", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skippedUserId: integer("skipped_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  name: true,
  age: true,
  gender: true,
  preferredGender: true,
}).extend({
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Palavra-passe deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  age: z.number().min(18, "Deves ter pelo menos 18 anos").max(99, "Idade deve ser válida"),
  gender: z.string().min(1, "Género é obrigatório"),
  preferredGender: z.string().min(1, "Preferência de género é obrigatória"),
});

export const insertFriendshipSchema = createInsertSchema(friendships).pick({
  userId: true,
  friendId: true,
  status: true,
});

export const insertPrivateMessageSchema = createInsertSchema(privateMessages).pick({
  senderId: true,
  receiverId: true,
  content: true,
  messageType: true,
  imageUrl: true,
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Palavra-passe obrigatória"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect & {
  senderName?: string;
  senderUsername?: string;
  senderAge?: number;
  senderGender?: string;
  senderProfilePicture?: string | null;
};
export type InsertPrivateMessage = z.infer<typeof insertPrivateMessageSchema>;
export type PrivateMessage = typeof privateMessages.$inferSelect;
export type RandomChat = typeof randomChats.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
