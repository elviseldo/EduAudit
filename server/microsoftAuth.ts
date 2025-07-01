import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Microsoft Auth Configuration
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || "",
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || "common"}`,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};

let cca: ConfidentialClientApplication;

export function setupMicrosoftAuth(app: Express) {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    console.log("Microsoft Auth not configured - skipping Microsoft login routes");
    return;
  }

  cca = new ConfidentialClientApplication(msalConfig);

  // Microsoft login route
  app.get("/api/login/microsoft", async (req, res) => {
    const authCodeUrlParameters = {
      scopes: ["user.read", "profile", "email"],
      redirectUri: `${req.protocol}://${req.hostname}/api/callback/microsoft`,
    };

    try {
      const response = await cca.getAuthCodeUrl(authCodeUrlParameters);
      res.redirect(response);
    } catch (error) {
      console.error("Error getting auth code URL:", error);
      res.status(500).send("Authentication error");
    }
  });

  // Microsoft callback route
  app.get("/api/callback/microsoft", async (req, res) => {
    const tokenRequest = {
      code: req.query.code as string,
      scopes: ["user.read", "profile", "email"],
      redirectUri: `${req.protocol}://${req.hostname}/api/callback/microsoft`,
    };

    try {
      const response = await cca.acquireTokenByCode(tokenRequest);
      
      if (response?.account) {
        // Create or update user in database
        const userInfo = {
          id: response.account.localAccountId,
          email: response.account.username,
          firstName: response.account.name?.split(' ')[0] || '',
          lastName: response.account.name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: null, // Microsoft Graph can provide this if needed
        };

        await storage.upsertUser(userInfo);

        // Store user session
        (req.session as any).user = {
          claims: {
            sub: response.account.localAccountId,
            email: response.account.username,
            first_name: userInfo.firstName,
            last_name: userInfo.lastName,
          },
          access_token: response.accessToken,
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        };

        res.redirect("/");
      } else {
        res.redirect("/api/login");
      }
    } catch (error) {
      console.error("Error acquiring token:", error);
      res.redirect("/api/login");
    }
  });
}

export const isMicrosoftAuthenticated: RequestHandler = async (req, res, next) => {
  const user = (req.session as any)?.user;

  if (!user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    req.user = user; // Set user for route handlers
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
};