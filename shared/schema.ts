import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`'CLM-' || floor(random() * 90000 + 10000)::text`),
  status: text("status").notNull().default("Draft"),
  priority: text("priority").notNull().default("Normal"),
  collectedBy: text("collected_by").notNull().default("AI Claims Specialist"),
  verifiedBy: text("verified_by"),
  date: timestamp("date").notNull().default(sql`CURRENT_TIMESTAMP`),
  policyholderName: text("policyholder_name").notNull(),
  policyId: text("policy_id").notNull(),
  incidentDate: text("incident_date").notNull(),
  claimType: text("claim_type").notNull(),
  description: text("description").notNull(),
  summary: text("summary").array().notNull().default(sql`'{}'::text[]`),
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  date: true,
  status: true,
  collectedBy: true,
  verifiedBy: true,
});

export const updateClaimSchema = createInsertSchema(claims).partial().omit({
  id: true,
  date: true,
  collectedBy: true,
});

export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type UpdateClaim = z.infer<typeof updateClaimSchema>;
export type Claim = typeof claims.$inferSelect;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
