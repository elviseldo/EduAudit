import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupMicrosoftAuth, isMicrosoftAuthenticated } from "./microsoftAuth";
import { insertAuditSchema, insertEnergyPollSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  setupMicrosoftAuth(app);

  // Test authentication middleware - automatically logs in as admin
  const authenticateUser: RequestHandler = async (req, res, next) => {
    // Create test admin user for development
    const testUserId = "test-admin-456";
    
    try {
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
    } catch (error) {
      console.error("Database connection error during authentication:", error);
      // Continue with mock user data even if database fails
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
      // Return mock user data if database is not accessible
      res.json({
        id: "test-admin-456",
        email: "admin@test.edu",
        firstName: "Test",
        lastName: "Admin",
        profileImageUrl: null,
        role: "admin",
        studentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
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
      let user;
      
      try {
        user = await storage.getUser(userId);
      } catch (dbError) {
        console.error("Database error fetching user:", dbError);
        // Return empty audits array if database is not accessible
        return res.json([]);
      }
      
      if (!user) {
        // Mock admin user for testing
        user = { role: 'admin' };
      }

      let audits;
      try {
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
      } catch (dbError) {
        console.error("Database error fetching audits:", dbError);
        // Return empty audits array if database is not accessible
        return res.json([]);
      }
      
      res.json(audits);
    } catch (error) {
      console.error("Error fetching audits:", error);
      res.json([]); // Return empty array instead of error
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
      let user;
      
      try {
        user = await storage.getUser(userId);
      } catch (dbError) {
        console.error("Database error fetching user for stats:", dbError);
        // Return empty stats if database is not accessible
        return res.json({
          totalAudits: 0,
          pendingAudits: 0,
          reviewedAudits: 0,
          inProgressAudits: 0,
          resolvedAudits: 0,
          highPriorityAudits: 0,
          urgentAudits: 0
        });
      }
      
      if (!user) {
        // Mock admin user for testing
        user = { role: 'admin' };
      }

      let stats;
      try {
        if (user.role === 'admin') {
          stats = await storage.getAuditStats();
        } else {
          stats = await storage.getUserAuditStats(userId);
        }
      } catch (dbError) {
        console.error("Database error fetching stats:", dbError);
        // Return empty stats if database is not accessible
        return res.json({
          totalAudits: 0,
          pendingAudits: 0,
          reviewedAudits: 0,
          inProgressAudits: 0,
          resolvedAudits: 0,
          ...(user.role === 'admin' ? { highPriorityAudits: 0, urgentAudits: 0 } : {})
        });
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Return empty stats instead of error
      res.json({
        totalAudits: 0,
        pendingAudits: 0,
        reviewedAudits: 0,
        inProgressAudits: 0,
        resolvedAudits: 0
      });
    }
  });

  // User profile route for setting role during onboarding
  app.patch('/api/user/profile', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role, studentId, className } = req.body;
      
      if (!role || !['student', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      if (role === 'student' && (!studentId || !className)) {
        return res.status(400).json({ message: "Student ID and class name are required for student role" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...user,
        role,
        studentId: role === 'student' ? studentId : undefined,
        className: role === 'student' ? className : undefined,
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

  // Energy poll routes
  app.post('/api/energy-polls', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'student') {
        return res.status(403).json({ message: "Student access required" });
      }

      // Allow multiple reports per day - remove the daily limit check

      const pollData = {
        ...req.body,
        userId,
        className: req.body.className || user.className || 'Unknown',
      };
      
      const validatedData = insertEnergyPollSchema.parse(pollData);
      const poll = await storage.createEnergyPoll(validatedData);
      
      res.status(201).json(poll);
    } catch (error) {
      console.error("Error creating energy poll:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid poll data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create energy poll" });
      }
    }
  });

  app.get('/api/energy-polls', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let polls;
      if (user.role === 'admin') {
        // Admin can see all polls
        polls = await storage.getAllEnergyPolls();
      } else {
        // Students can only see their own polls
        polls = await storage.getEnergyPollsByUser(userId);
      }
      
      res.json(polls);
    } catch (error) {
      console.error("Error fetching energy polls:", error);
      res.status(500).json({ message: "Failed to fetch energy polls" });
    }
  });

  app.get('/api/energy-polls/today', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const poll = await storage.getTodaysEnergyPoll(userId);
      res.json(poll || null);
    } catch (error) {
      console.error("Error fetching today's energy poll:", error);
      res.status(500).json({ message: "Failed to fetch today's energy poll" });
    }
  });

  app.get('/api/energy-polls/class/:className', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const className = req.params.className;
      const polls = await storage.getEnergyPollsByClass(className);
      res.json(polls);
    } catch (error) {
      console.error("Error fetching energy polls by class:", error);
      res.status(500).json({ message: "Failed to fetch energy polls by class" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/overview', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const [audits, energyPolls] = await Promise.all([
        storage.getAllAudits(),
        storage.getAllEnergyPolls()
      ]);

      // Audit trends over time (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const auditTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayAudits = audits.filter(audit => 
          audit.createdAt && new Date(audit.createdAt).toISOString().split('T')[0] === dateStr
        );
        
        return {
          date: dateStr,
          count: dayAudits.length,
          pending: dayAudits.filter(a => a.status === 'pending').length,
          resolved: dayAudits.filter(a => a.status === 'resolved').length
        };
      });

      // Asset type distribution
      const assetTypeStats = audits.reduce((acc: any, audit) => {
        acc[audit.assetType] = (acc[audit.assetType] || 0) + 1;
        return acc;
      }, {});

      // Condition distribution
      const conditionStats = audits.reduce((acc: any, audit) => {
        acc[audit.condition] = (acc[audit.condition] || 0) + 1;
        return acc;
      }, {});

      // Priority distribution
      const priorityStats = audits.reduce((acc: any, audit) => {
        acc[audit.priority] = (acc[audit.priority] || 0) + 1;
        return acc;
      }, {});

      // Building usage
      const buildingStats = audits.reduce((acc: any, audit) => {
        acc[audit.building] = (acc[audit.building] || 0) + 1;
        return acc;
      }, {});

      // Energy poll trends
      const energyTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayPolls = energyPolls.filter(poll => 
          poll.createdAt && new Date(poll.createdAt).toISOString().split('T')[0] === dateStr
        );
        
        const avgEnergyLevel = dayPolls.length > 0 
          ? dayPolls.reduce((sum, poll) => sum + poll.energyLevel, 0) / dayPolls.length 
          : 0;

        return {
          date: dateStr,
          count: dayPolls.length,
          averageEnergyLevel: Math.round(avgEnergyLevel * 10) / 10
        };
      });

      // Response time analytics (time from creation to resolution)
      const resolvedAudits = audits.filter(a => a.status === 'resolved' && a.reviewedAt);
      const avgResponseTime = resolvedAudits.length > 0 
        ? resolvedAudits.reduce((sum, audit) => {
            const created = new Date(audit.createdAt!).getTime();
            const resolved = new Date(audit.reviewedAt!).getTime();
            return sum + (resolved - created);
          }, 0) / resolvedAudits.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      res.json({
        auditTrends,
        assetTypeStats,
        conditionStats,
        priorityStats,
        buildingStats,
        energyTrends,
        summary: {
          totalAudits: audits.length,
          totalEnergyPolls: energyPolls.length,
          averageResponseTime: Math.round(avgResponseTime * 10) / 10,
          safetyIssues: audits.filter(a => a.safetyConcern).length,
          urgentItems: audits.filter(a => a.priority === 'urgent').length
        }
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  app.get('/api/analytics/energy', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const energyPolls = await storage.getAllEnergyPolls();

      // Class performance analytics
      const classStats = energyPolls.reduce((acc: any, poll) => {
        if (!acc[poll.className]) {
          acc[poll.className] = {
            totalPolls: 0,
            totalEnergyLevel: 0,
            averageEnergyLevel: 0
          };
        }
        acc[poll.className].totalPolls++;
        acc[poll.className].totalEnergyLevel += poll.energyLevel;
        acc[poll.className].averageEnergyLevel = acc[poll.className].totalEnergyLevel / acc[poll.className].totalPolls;
        return acc;
      }, {});

      // Energy level distribution
      const energyDistribution = energyPolls.reduce((acc: any, poll) => {
        const level = poll.energyLevel;
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});

      // Physical activity correlation
      const activityStats = energyPolls.reduce((acc: any, poll) => {
        const activity = poll.physicalActivity || 'none';
        if (!acc[activity]) {
          acc[activity] = {
            count: 0,
            totalEnergyLevel: 0,
            averageEnergyLevel: 0
          };
        }
        acc[activity].count++;
        acc[activity].totalEnergyLevel += poll.energyLevel;
        acc[activity].averageEnergyLevel = acc[activity].totalEnergyLevel / acc[activity].count;
        return acc;
      }, {});

      res.json({
        classStats,
        energyDistribution,
        activityStats,
        summary: {
          totalResponses: energyPolls.length,
          averageEnergyLevel: energyPolls.length > 0 
            ? energyPolls.reduce((sum, poll) => sum + poll.energyLevel, 0) / energyPolls.length 
            : 0,
          uniqueClasses: Object.keys(classStats).length
        }
      });
    } catch (error) {
      console.error("Error fetching energy analytics:", error);
      res.status(500).json({ message: "Failed to fetch energy analytics data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
