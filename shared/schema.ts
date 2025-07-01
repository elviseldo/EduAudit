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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audits table
export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  assetType: varchar("asset_type").notNull(), // furniture, electronics, storage, infrastructure
  itemName: varchar("item_name").notNull(),
  assetId: varchar("asset_id"),
  brandModel: varchar("brand_model"),
  building: varchar("building").notNull(),
  floor: varchar("floor").notNull(),
  room: varchar("room").notNull(),
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
