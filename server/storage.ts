import {
  users,
  audits,
  assetCatalog,
  buildings,
  maintenanceLogs,
  energyPolls,
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
  type EnergyPoll,
  type InsertEnergyPoll,
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
  
  // Energy poll operations
  createEnergyPoll(poll: InsertEnergyPoll): Promise<EnergyPoll>;
  getEnergyPollsByUser(userId: string): Promise<EnergyPoll[]>;
  getEnergyPollsByClass(className: string): Promise<EnergyPoll[]>;
  getAllEnergyPolls(): Promise<EnergyPoll[]>;
  getTodaysEnergyPoll(userId: string): Promise<EnergyPoll | undefined>;
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

  async getAuditsByUser(userId: string, school?: string): Promise<Audit[]> {
    const conditions = [eq(audits.userId, userId)];
    if (school) {
      conditions.push(eq(audits.school, school));
    }
    return await db.select()
      .from(audits)
      .where(and(...conditions))
      .orderBy(desc(audits.createdAt));
  }

  async getAllAudits(filters?: AuditFilters & { school?: string }): Promise<Audit[]> {
    const conditions = [];
    
    if (filters?.school) {
      conditions.push(eq(audits.school, filters.school));
    }
    
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
      return await db.select()
        .from(audits)
        .where(and(...conditions))
        .orderBy(desc(audits.createdAt));
    }
    
    return await db.select()
      .from(audits)
      .orderBy(desc(audits.createdAt));
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

  async getAuditStats(school?: string): Promise<AuditStats> {
    const query = school 
      ? await db.select().from(audits).where(eq(audits.school, school))
      : await db.select().from(audits);
    
    const allAudits = query;
    
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

  // Energy poll operations
  async createEnergyPoll(pollData: InsertEnergyPoll): Promise<EnergyPoll> {
    const [poll] = await db
      .insert(energyPolls)
      .values(pollData)
      .returning();
    return poll;
  }

  async getEnergyPollsByUser(userId: string): Promise<EnergyPoll[]> {
    return await db.select()
      .from(energyPolls)
      .where(eq(energyPolls.userId, userId))
      .orderBy(desc(energyPolls.createdAt));
  }

  async getEnergyPollsByClass(className: string): Promise<EnergyPoll[]> {
    return await db.select()
      .from(energyPolls)
      .where(eq(energyPolls.className, className))
      .orderBy(desc(energyPolls.createdAt));
  }

  async getAllEnergyPolls(): Promise<EnergyPoll[]> {
    return await db.select()
      .from(energyPolls)
      .orderBy(desc(energyPolls.createdAt));
  }

  async getTodaysEnergyPoll(userId: string): Promise<EnergyPoll | undefined> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format

    const polls = await db.select()
      .from(energyPolls)
      .where(eq(energyPolls.userId, userId))
      .orderBy(desc(energyPolls.createdAt));
    
    // Filter for today's polls in JavaScript since date comparison in SQL can be tricky
    const todaysPoll = polls.find(poll => {
      if (!poll.createdAt) return false;
      const pollDate = new Date(poll.createdAt).toISOString().split('T')[0];
      return pollDate === todayStr;
    });
    
    return todaysPoll;
  }
}

// In-memory storage implementation as fallback for database issues
export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private audits = new Map<number, Audit>();
  private assetCatalogItems = new Map<number, AssetCatalog>();
  private buildingsList = new Map<number, Building>();
  private maintenanceLogsList = new Map<number, MaintenanceLog>();
  private energyPollsList = new Map<number, EnergyPoll>();
  private auditIdCounter = 1;
  private assetCatalogIdCounter = 1;
  private buildingIdCounter = 1;
  private maintenanceLogIdCounter = 1;
  private energyPollIdCounter = 1;

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const now = new Date();
    
    const user: User = {
      ...userData,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || "student",
      studentId: userData.studentId || null,
      className: userData.className || null,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };
    
    this.users.set(userData.id, user);
    return user;
  }

  // Audit operations
  async createAudit(auditData: InsertAudit): Promise<Audit> {
    // Enforcement for 'auditing' school: one entry per class every 10 days
    if (auditData.school === 'auditing') {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const existingAudits = Array.from(this.audits.values()).filter(a => 
        a.school === 'auditing' && 
        a.grade === auditData.grade && 
        a.createdAt && a.createdAt >= tenDaysAgo
      );

      if (existingAudits.length > 0) {
        throw new Error(`This class (${auditData.grade}) has already been audited in the last 10 days.`);
      }
    }

    const now = new Date();
    const audit: Audit = {
      ...auditData,
      id: this.auditIdCounter++,
      assetId: auditData.assetId || null,
      brandModel: auditData.brandModel || null,
      locationNotes: auditData.locationNotes || null,
      quantity: auditData.quantity || 1,
      reviewNotes: auditData.reviewNotes || null,
      reviewedBy: auditData.reviewedBy || null,
      photos: auditData.photos || [],
      createdAt: now,
      updatedAt: now,
      reviewedAt: null,
    };
    
    this.audits.set(audit.id, audit);
    return audit;
  }

  async getAuditById(id: number): Promise<Audit | undefined> {
    return this.audits.get(id);
  }

  async getAuditsByUser(userId: string): Promise<Audit[]> {
    return Array.from(this.audits.values())
      .filter(audit => audit.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAllAudits(filters?: AuditFilters): Promise<Audit[]> {
    let audits = Array.from(this.audits.values());
    
    if (filters?.status && filters.status !== "all") {
      audits = audits.filter(a => a.status === filters.status);
    }
    
    if (filters?.priority && filters.priority !== "all") {
      audits = audits.filter(a => a.priority === filters.priority);
    }
    
    if (filters?.condition) {
      audits = audits.filter(a => a.condition === filters.condition);
    }
    
    if (filters?.assetType) {
      audits = audits.filter(a => a.assetType === filters.assetType);
    }
    
    if (filters?.building) {
      audits = audits.filter(a => a.building === filters.building);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      audits = audits.filter(a => 
        a.itemName.toLowerCase().includes(searchLower) ||
        a.description.toLowerCase().includes(searchLower) ||
        a.grade.toLowerCase().includes(searchLower)
      );
    }
    
    return audits.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async updateAuditStatus(id: number, status: string, reviewNotes?: string, reviewedBy?: string): Promise<Audit> {
    const audit = this.audits.get(id);
    if (!audit) {
      throw new Error(`Audit with id ${id} not found`);
    }
    
    const updatedAudit: Audit = {
      ...audit,
      status,
      reviewNotes: reviewNotes || audit.reviewNotes,
      reviewedBy: reviewedBy || audit.reviewedBy,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.audits.set(id, updatedAudit);
    return updatedAudit;
  }

  async getAuditStats(): Promise<AuditStats> {
    const allAudits = Array.from(this.audits.values());
    
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
    const now = new Date();
    const item: AssetCatalog = {
      ...itemData,
      id: this.assetCatalogIdCounter++,
      brandModel: itemData.brandModel || null,
      description: itemData.description || null,
      expectedLifespan: itemData.expectedLifespan || null,
      maintenanceSchedule: itemData.maintenanceSchedule || null,
      isActive: itemData.isActive !== undefined ? itemData.isActive : true,
      createdAt: now,
      updatedAt: now,
    };
    
    this.assetCatalogItems.set(item.id, item);
    return item;
  }

  async getAssetCatalogItems(): Promise<AssetCatalog[]> {
    return Array.from(this.assetCatalogItems.values())
      .filter(item => item.isActive)
      .sort((a, b) => a.assetType.localeCompare(b.assetType) || a.itemName.localeCompare(b.itemName));
  }

  async updateAssetCatalogItem(id: number, itemData: Partial<InsertAssetCatalog>): Promise<AssetCatalog> {
    const item = this.assetCatalogItems.get(id);
    if (!item) {
      throw new Error(`Asset catalog item with id ${id} not found`);
    }
    
    const updatedItem: AssetCatalog = {
      ...item,
      ...itemData,
      updatedAt: new Date(),
    };
    
    this.assetCatalogItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteAssetCatalogItem(id: number): Promise<void> {
    const item = this.assetCatalogItems.get(id);
    if (item) {
      const updatedItem: AssetCatalog = {
        ...item,
        isActive: false,
        updatedAt: new Date(),
      };
      this.assetCatalogItems.set(id, updatedItem);
    }
  }

  // Building operations
  async createBuilding(buildingData: InsertBuilding): Promise<Building> {
    const now = new Date();
    const building: Building = {
      ...buildingData,
      id: this.buildingIdCounter++,
      address: buildingData.address || null,
      floors: buildingData.floors || 1,
      isActive: buildingData.isActive !== undefined ? buildingData.isActive : true,
      createdAt: now,
      updatedAt: now,
    };
    
    this.buildingsList.set(building.id, building);
    return building;
  }

  async getBuildings(): Promise<Building[]> {
    return Array.from(this.buildingsList.values())
      .filter(building => building.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateBuilding(id: number, buildingData: Partial<InsertBuilding>): Promise<Building> {
    const building = this.buildingsList.get(id);
    if (!building) {
      throw new Error(`Building with id ${id} not found`);
    }
    
    const updatedBuilding: Building = {
      ...building,
      ...buildingData,
      updatedAt: new Date(),
    };
    
    this.buildingsList.set(id, updatedBuilding);
    return updatedBuilding;
  }

  async deleteBuilding(id: number): Promise<void> {
    const building = this.buildingsList.get(id);
    if (building) {
      const updatedBuilding: Building = {
        ...building,
        isActive: false,
        updatedAt: new Date(),
      };
      this.buildingsList.set(id, updatedBuilding);
    }
  }

  // Maintenance log operations
  async createMaintenanceLog(logData: InsertMaintenanceLog): Promise<MaintenanceLog> {
    const now = new Date();
    const log: MaintenanceLog = {
      ...logData,
      id: this.maintenanceLogIdCounter++,
      cost: logData.cost || null,
      nextMaintenanceDate: logData.nextMaintenanceDate || null,
      completedAt: logData.completedAt || now,
      createdAt: now,
    };
    
    this.maintenanceLogsList.set(log.id, log);
    return log;
  }

  async getMaintenanceLogsByAudit(auditId: number): Promise<MaintenanceLog[]> {
    return Array.from(this.maintenanceLogsList.values())
      .filter(log => log.auditId === auditId)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  }

  async getAllMaintenanceLogs(): Promise<MaintenanceLog[]> {
    return Array.from(this.maintenanceLogsList.values())
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  }

  async updateMaintenanceLog(id: number, logData: Partial<InsertMaintenanceLog>): Promise<MaintenanceLog> {
    const log = this.maintenanceLogsList.get(id);
    if (!log) {
      throw new Error(`Maintenance log with id ${id} not found`);
    }
    
    const updatedLog: MaintenanceLog = {
      ...log,
      ...logData,
    };
    
    this.maintenanceLogsList.set(id, updatedLog);
    return updatedLog;
  }

  // Energy poll operations
  async createEnergyPoll(pollData: InsertEnergyPoll): Promise<EnergyPoll> {
    const now = new Date();
    const poll: EnergyPoll = {
      ...pollData,
      id: this.energyPollIdCounter++,
      sleepHours: pollData.sleepHours || null,
      breakfastEaten: pollData.breakfastEaten || null,
      physicalActivity: pollData.physicalActivity || null,
      comments: pollData.comments || null,
      createdAt: now,
    };
    
    this.energyPollsList.set(poll.id, poll);
    return poll;
  }

  async getEnergyPollsByUser(userId: string): Promise<EnergyPoll[]> {
    return Array.from(this.energyPollsList.values())
      .filter(poll => poll.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getEnergyPollsByClass(className: string): Promise<EnergyPoll[]> {
    return Array.from(this.energyPollsList.values())
      .filter(poll => poll.className === className)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAllEnergyPolls(): Promise<EnergyPoll[]> {
    return Array.from(this.energyPollsList.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getTodaysEnergyPoll(userId: string): Promise<EnergyPoll | undefined> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format

    const polls = await this.getEnergyPollsByUser(userId);
    
    // Filter for today's polls
    const todaysPoll = polls.find(poll => {
      if (!poll.createdAt) return false;
      const pollDate = new Date(poll.createdAt).toISOString().split('T')[0];
      return pollDate === todayStr;
    });
    
    return todaysPoll;
  }
}

// Use in-memory storage to avoid database connection issues
export const storage = new MemStorage();
