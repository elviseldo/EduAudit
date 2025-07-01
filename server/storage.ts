import {
  users,
  audits,
  type User,
  type UpsertUser,
  type Audit,
  type InsertAudit,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Audit operations
  createAudit(audit: InsertAudit): Promise<Audit>;
  getAuditById(id: number): Promise<Audit | undefined>;
  getAuditsByUser(userId: string): Promise<Audit[]>;
  getAllAudits(filters?: AuditFilters): Promise<Audit[]>;
  updateAuditStatus(id: number, status: string, reviewNotes?: string, reviewedBy?: string): Promise<Audit>;
  getAuditStats(): Promise<AuditStats>;
  getUserAuditStats(userId: string): Promise<UserAuditStats>;
}

export interface AuditFilters {
  status?: string;
  priority?: string;
  condition?: string;
  assetType?: string;
  building?: string;
  search?: string;
}

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

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Audit operations
  async createAudit(auditData: InsertAudit): Promise<Audit> {
    const [audit] = await db
      .insert(audits)
      .values(auditData)
      .returning();
    return audit;
  }

  async getAuditById(id: number): Promise<Audit | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    return audit;
  }

  async getAuditsByUser(userId: string): Promise<Audit[]> {
    return await db.select()
      .from(audits)
      .where(eq(audits.userId, userId))
      .orderBy(desc(audits.createdAt));
  }

  async getAllAudits(filters?: AuditFilters): Promise<Audit[]> {
    let query = db.select().from(audits);
    
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(audits.status, filters.status));
    }
    
    if (filters?.priority) {
      conditions.push(eq(audits.priority, filters.priority));
    }
    
    if (filters?.condition) {
      conditions.push(eq(audits.condition, filters.condition));
    }
    
    if (filters?.assetType) {
      conditions.push(eq(audits.assetType, filters.assetType));
    }
    
    if (filters?.building) {
      conditions.push(eq(audits.building, filters.building));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(audits.itemName, `%${filters.search}%`),
          ilike(audits.description, `%${filters.search}%`),
          ilike(audits.room, `%${filters.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(audits.createdAt));
  }

  async updateAuditStatus(id: number, status: string, reviewNotes?: string, reviewedBy?: string): Promise<Audit> {
    const [audit] = await db
      .update(audits)
      .set({
        status,
        reviewNotes,
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(audits.id, id))
      .returning();
    return audit;
  }

  async getAuditStats(): Promise<AuditStats> {
    const allAudits = await db.select().from(audits);
    
    return {
      totalAudits: allAudits.length,
      pendingAudits: allAudits.filter(a => a.status === 'pending').length,
      reviewedAudits: allAudits.filter(a => a.status === 'reviewed').length,
      inProgressAudits: allAudits.filter(a => a.status === 'in_progress').length,
      resolvedAudits: allAudits.filter(a => a.status === 'resolved').length,
      highPriorityAudits: allAudits.filter(a => a.priority === 'high').length,
      urgentAudits: allAudits.filter(a => a.priority === 'urgent').length,
    };
  }

  async getUserAuditStats(userId: string): Promise<UserAuditStats> {
    const userAudits = await this.getAuditsByUser(userId);
    
    return {
      totalAudits: userAudits.length,
      pendingAudits: userAudits.filter(a => a.status === 'pending').length,
      reviewedAudits: userAudits.filter(a => a.status === 'reviewed').length,
      inProgressAudits: userAudits.filter(a => a.status === 'in_progress').length,
      resolvedAudits: userAudits.filter(a => a.status === 'resolved').length,
    };
  }
}

export const storage = new DatabaseStorage();
