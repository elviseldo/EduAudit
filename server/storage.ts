import {
  users,
  audits,
  assetCatalog,
  buildings,
  maintenanceLogs,
  type User,
  type UpsertUser,
  type Audit,
  type InsertAudit,
  type AssetCatalog,
  type InsertAssetCatalog,
  type Building,
  type InsertBuilding,
  type MaintenanceLog,
  type InsertMaintenanceLog,
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
  
  // Asset catalog operations
  createAssetCatalogItem(item: InsertAssetCatalog): Promise<AssetCatalog>;
  getAssetCatalogItems(): Promise<AssetCatalog[]>;
  updateAssetCatalogItem(id: number, item: Partial<InsertAssetCatalog>): Promise<AssetCatalog>;
  deleteAssetCatalogItem(id: number): Promise<void>;
  
  // Building operations
  createBuilding(building: InsertBuilding): Promise<Building>;
  getBuildings(): Promise<Building[]>;
  updateBuilding(id: number, building: Partial<InsertBuilding>): Promise<Building>;
  deleteBuilding(id: number): Promise<void>;
  
  // Maintenance log operations
  createMaintenanceLog(log: InsertMaintenanceLog): Promise<MaintenanceLog>;
  getMaintenanceLogsByAudit(auditId: number): Promise<MaintenanceLog[]>;
  getAllMaintenanceLogs(): Promise<MaintenanceLog[]>;
  updateMaintenanceLog(id: number, log: Partial<InsertMaintenanceLog>): Promise<MaintenanceLog>;
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
    
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(audits.status, filters.status));
    }
    
    if (filters?.priority && filters.priority !== "all") {
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
          ilike(audits.grade, `%${filters.search}%`)
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

  // Asset catalog operations
  async createAssetCatalogItem(itemData: InsertAssetCatalog): Promise<AssetCatalog> {
    const [item] = await db
      .insert(assetCatalog)
      .values(itemData)
      .returning();
    return item;
  }

  async getAssetCatalogItems(): Promise<AssetCatalog[]> {
    return await db
      .select()
      .from(assetCatalog)
      .where(eq(assetCatalog.isActive, true))
      .orderBy(assetCatalog.assetType, assetCatalog.itemName);
  }

  async updateAssetCatalogItem(id: number, itemData: Partial<InsertAssetCatalog>): Promise<AssetCatalog> {
    const [item] = await db
      .update(assetCatalog)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(assetCatalog.id, id))
      .returning();
    return item;
  }

  async deleteAssetCatalogItem(id: number): Promise<void> {
    await db
      .update(assetCatalog)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(assetCatalog.id, id));
  }

  // Building operations
  async createBuilding(buildingData: InsertBuilding): Promise<Building> {
    const [building] = await db
      .insert(buildings)
      .values(buildingData)
      .returning();
    return building;
  }

  async getBuildings(): Promise<Building[]> {
    return await db
      .select()
      .from(buildings)
      .where(eq(buildings.isActive, true))
      .orderBy(buildings.name);
  }

  async updateBuilding(id: number, buildingData: Partial<InsertBuilding>): Promise<Building> {
    const [building] = await db
      .update(buildings)
      .set({ ...buildingData, updatedAt: new Date() })
      .where(eq(buildings.id, id))
      .returning();
    return building;
  }

  async deleteBuilding(id: number): Promise<void> {
    await db
      .update(buildings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(buildings.id, id));
  }

  // Maintenance log operations
  async createMaintenanceLog(logData: InsertMaintenanceLog): Promise<MaintenanceLog> {
    const [log] = await db
      .insert(maintenanceLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getMaintenanceLogsByAudit(auditId: number): Promise<MaintenanceLog[]> {
    return await db
      .select()
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.auditId, auditId))
      .orderBy(desc(maintenanceLogs.completedAt));
  }

  async getAllMaintenanceLogs(): Promise<MaintenanceLog[]> {
    return await db
      .select()
      .from(maintenanceLogs)
      .orderBy(desc(maintenanceLogs.completedAt));
  }

  async updateMaintenanceLog(id: number, logData: Partial<InsertMaintenanceLog>): Promise<MaintenanceLog> {
    const [log] = await db
      .update(maintenanceLogs)
      .set(logData)
      .where(eq(maintenanceLogs.id, id))
      .returning();
    return log;
  }
}

export const storage = new DatabaseStorage();
