import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupMicrosoftAuth, isMicrosoftAuthenticated } from "./microsoftAuth";
import { insertAuditSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  setupMicrosoftAuth(app);

  // Test authentication middleware - automatically logs in as admin
  const authenticateUser: RequestHandler = async (req, res, next) => {
    // Create test admin user for development
    const testUserId = "test-admin-456";
    
    // Ensure test admin user exists in database
    let testUser = await storage.getUser(testUserId);
    if (!testUser) {
      testUser = await storage.upsertUser({
        id: testUserId,
        email: "admin@test.edu",
        firstName: "Test",
        lastName: "Admin",
        profileImageUrl: null,
        role: "admin",
        studentId: null
      });
    }

    // Set test admin user session
    req.user = {
      claims: {
        sub: testUserId,
        email: "admin@test.edu",
        first_name: "Test",
        last_name: "Admin"
      },
      access_token: "test-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    next();
  };

  // Auth routes
  app.get('/api/auth/user', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Audit routes
  app.post('/api/audits', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const auditData = {
        ...req.body,
        userId
      };
      
      const validatedData = insertAuditSchema.parse(auditData);
      const audit = await storage.createAudit(validatedData);
      
      res.status(201).json(audit);
    } catch (error) {
      console.error("Error creating audit:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid audit data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create audit" });
      }
    }
  });

  app.get('/api/audits', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let audits;
      if (user.role === 'admin') {
        // Admin can see all audits with filters
        const filters = {
          status: req.query.status as string,
          priority: req.query.priority as string,
          condition: req.query.condition as string,
          assetType: req.query.assetType as string,
          building: req.query.building as string,
          search: req.query.search as string,
        };
        
        // Remove undefined values
        Object.keys(filters).forEach(key => {
          if (!filters[key as keyof typeof filters]) {
            delete filters[key as keyof typeof filters];
          }
        });
        
        audits = await storage.getAllAudits(filters);
      } else {
        // Students can only see their own audits
        audits = await storage.getAuditsByUser(userId);
      }
      
      res.json(audits);
    } catch (error) {
      console.error("Error fetching audits:", error);
      res.status(500).json({ message: "Failed to fetch audits" });
    }
  });

  app.get('/api/audits/:id', authenticateUser, async (req: any, res) => {
    try {
      const auditId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const audit = await storage.getAuditById(auditId);
      
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }

      // Students can only view their own audits
      if (user.role !== 'admin' && audit.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(audit);
    } catch (error) {
      console.error("Error fetching audit:", error);
      res.status(500).json({ message: "Failed to fetch audit" });
    }
  });

  app.patch('/api/audits/:id/status', authenticateUser, async (req: any, res) => {
    try {
      const auditId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { status, reviewNotes } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const audit = await storage.updateAuditStatus(auditId, status, reviewNotes, userId);
      res.json(audit);
    } catch (error) {
      console.error("Error updating audit status:", error);
      res.status(500).json({ message: "Failed to update audit status" });
    }
  });

  // Stats routes
  app.get('/api/stats', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let stats;
      if (user.role === 'admin') {
        stats = await storage.getAuditStats();
      } else {
        stats = await storage.getUserAuditStats(userId);
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // User profile route for setting role during onboarding
  app.patch('/api/user/profile', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role, studentId } = req.body;
      
      if (!role || !['student', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      if (role === 'student' && !studentId) {
        return res.status(400).json({ message: "Student ID is required for student role" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...user,
        role,
        studentId: role === 'student' ? studentId : undefined,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Asset catalog routes
  app.get("/api/asset-catalog", authenticateUser, async (req: any, res) => {
    try {
      const items = await storage.getAssetCatalogItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching asset catalog:", error);
      res.status(500).json({ message: "Failed to fetch asset catalog" });
    }
  });

  app.post("/api/asset-catalog", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const item = await storage.createAssetCatalogItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating asset catalog item:", error);
      res.status(500).json({ message: "Failed to create asset catalog item" });
    }
  });

  // Buildings routes
  app.get("/api/buildings", authenticateUser, async (req: any, res) => {
    try {
      const buildings = await storage.getBuildings();
      res.json(buildings);
    } catch (error) {
      console.error("Error fetching buildings:", error);
      res.status(500).json({ message: "Failed to fetch buildings" });
    }
  });

  app.post("/api/buildings", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const building = await storage.createBuilding(req.body);
      res.status(201).json(building);
    } catch (error) {
      console.error("Error creating building:", error);
      res.status(500).json({ message: "Failed to create building" });
    }
  });

  // Maintenance logs routes
  app.get("/api/maintenance-logs", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const logs = await storage.getAllMaintenanceLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching maintenance logs:", error);
      res.status(500).json({ message: "Failed to fetch maintenance logs" });
    }
  });

  app.get("/api/audits/:id/maintenance-logs", authenticateUser, async (req: any, res) => {
    try {
      const auditId = parseInt(req.params.id);
      const logs = await storage.getMaintenanceLogsByAudit(auditId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching maintenance logs for audit:", error);
      res.status(500).json({ message: "Failed to fetch maintenance logs" });
    }
  });

  app.post("/api/maintenance-logs", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const log = await storage.createMaintenanceLog({
        ...req.body,
        performedBy: userId
      });
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating maintenance log:", error);
      res.status(500).json({ message: "Failed to create maintenance log" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
