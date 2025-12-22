import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("student"), // student or admin
  studentId: varchar("student_id"),
  className: varchar("class_name"), // e.g., "Grade 7C"
  school: varchar("school").notNull().default("millennium"), // millennium or experimental
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audits table
export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  school: varchar("school").notNull().default("millennium"), // school identifier
  assetType: varchar("asset_type").notNull(), // furniture, electronics, storage, infrastructure
  itemName: varchar("item_name").notNull(),
  assetId: varchar("asset_id"),
  brandModel: varchar("brand_model"),
  building: varchar("building").notNull(),
  floor: varchar("floor").notNull(),
  grade: varchar("grade").notNull(),
  locationNotes: text("location_notes"),
  condition: varchar("condition").notNull(), // excellent, good, fair, poor
  description: text("description").notNull(),
  priority: varchar("priority").notNull(), // low, medium, high, urgent
  safetyConcern: boolean("safety_concern").default(false),
  status: varchar("status").notNull().default("pending"), // pending, reviewed, in_progress, resolved
  reviewNotes: text("review_notes"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  photos: jsonb("photos").default([]), // Array of photo URLs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  audits: many(audits),
}));

export const auditsRelations = relations(audits, ({ one }) => ({
  user: one(users, {
    fields: [audits.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [audits.reviewedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAuditSchema = createInsertSchema(audits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof audits.$inferSelect;

// Stats interfaces
export interface AuditStats {
  totalAudits: number;
  pendingAudits: number;
  reviewedAudits: number;
  inProgressAudits: number;
  resolvedAudits: number;
  highPriorityAudits: number;
  urgentAudits: number;
}

export interface UserAuditStats {
  totalAudits: number;
  pendingAudits: number;
  reviewedAudits: number;
  inProgressAudits: number;
  resolvedAudits: number;
}

// Asset catalog table for standardized assets
export const assetCatalog = pgTable("asset_catalog", {
  id: serial("id").primaryKey(),
  assetType: varchar("asset_type").notNull(),
  itemName: varchar("item_name").notNull(),
  brandModel: varchar("brand_model"),
  description: text("description"),
  expectedLifespan: integer("expected_lifespan"), // in years
  maintenanceSchedule: varchar("maintenance_schedule"), // weekly, monthly, yearly
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Buildings table for better organization
export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  address: text("address"),
  floors: integer("floors").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Maintenance logs table
export const maintenanceLogs = pgTable("maintenance_logs", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull(),
  performedBy: varchar("performed_by").notNull(),
  workType: varchar("work_type").notNull(), // repair, replacement, preventive, emergency
  description: text("description").notNull(),
  cost: varchar("cost"), // Store as string to handle currency formatting
  completedAt: timestamp("completed_at").defaultNow(),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Energy polls table
export const energyPolls = pgTable("energy_polls", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  school: varchar("school").notNull().default("millennium"), // school identifier
  className: varchar("class_name").notNull(),
  energyLevel: integer("energy_level").notNull(), // 1-10 scale
  mood: varchar("mood").notNull(), // happy, tired, focused, stressed, etc.
  sleepHours: integer("sleep_hours"), // hours of sleep last night
  breakfastEaten: boolean("breakfast_eaten").default(false),
  physicalActivity: varchar("physical_activity"), // none, light, moderate, intense
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced relations
export const assetCatalogRelations = relations(assetCatalog, ({ many }) => ({
  audits: many(audits),
}));

export const buildingsRelations = relations(buildings, ({ many }) => ({
  audits: many(audits),
}));

export const maintenanceLogsRelations = relations(maintenanceLogs, ({ one }) => ({
  audit: one(audits, {
    fields: [maintenanceLogs.auditId],
    references: [audits.id],
  }),
  performer: one(users, {
    fields: [maintenanceLogs.performedBy],
    references: [users.id],
  }),
}));

export const energyPollsRelations = relations(energyPolls, ({ one }) => ({
  user: one(users, {
    fields: [energyPolls.userId],
    references: [users.id],
  }),
}));

// Update users relations to include energy polls
export const usersEnhancedRelations = relations(users, ({ many }) => ({
  audits: many(audits),
  energyPolls: many(energyPolls),
}));

// Update audits relations to include maintenance logs
export const auditsEnhancedRelations = relations(audits, ({ one, many }) => ({
  user: one(users, {
    fields: [audits.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [audits.reviewedBy],
    references: [users.id],
  }),
  maintenanceLogs: many(maintenanceLogs),
}));

// Chat system tables for AI conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertAssetCatalogSchema = createInsertSchema(assetCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBuildingSchema = createInsertSchema(buildings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceLogSchema = createInsertSchema(maintenanceLogs).omit({
  id: true,
  createdAt: true,
});

export const insertEnergyPollSchema = createInsertSchema(energyPolls).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type AssetCatalog = typeof assetCatalog.$inferSelect;
export type InsertAssetCatalog = z.infer<typeof insertAssetCatalogSchema>;
export type Building = typeof buildings.$inferSelect;
export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type InsertMaintenanceLog = z.infer<typeof insertMaintenanceLogSchema>;
export type EnergyPoll = typeof energyPolls.$inferSelect;
export type InsertEnergyPoll = z.infer<typeof insertEnergyPollSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
