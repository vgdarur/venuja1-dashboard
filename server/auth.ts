import { OAuth2Client } from "google-auth-library";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";

// Allowed emails — team members who can access the dashboard
const ALLOWED_EMAILS = [
  "vgdarur@gmail.com",          // Venu (Boss)
  "udaykcdec@gmail.com",        // Uday
  "ankitkamra1920@gmail.com",   // Ankit
  "pavansurya2701@gmail.com",   // Surya
  "vamshinv9@gmail.com",              // Vamshi
  "shashidevops6@gmail.com",          // Shashi (ShasheeJA1)
  "rajavamshisvln@gmail.com",         // Raja Vamshi (RajJA1)
];

// API key for programmatic access (VenuJA1 cron job)
// Must be set via VENUJA1_API_KEY environment variable
const API_KEY = process.env.VENUJA1_API_KEY;
if (!API_KEY) {
  console.warn("⚠️  VENUJA1_API_KEY not set — programmatic API access will be disabled");
}

// Google OAuth client ID — must be set via environment variable
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID environment variable is required.");
}

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Extend session to include user
declare module "express-session" {
  interface SessionData {
    user?: {
      email: string;
      name: string;
      picture: string;
    };
  }
}

export function setupAuth(app: Express) {
  const MemStore = MemoryStore(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || require("crypto").randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // set true in production behind HTTPS
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      store: new MemStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // POST /api/auth/google — verify Google token and create session
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ message: "Missing credential" });
      }

      // Verify the Google ID token
      const ticket = await oauthClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Check if the email is allowed
      if (!ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(payload.email.toLowerCase())) {
        return res.status(403).json({
          message: "Access denied. Only authorized users can access this dashboard.",
        });
      }

      // Create session
      req.session.user = {
        email: payload.email,
        name: payload.name || "Venu",
        picture: payload.picture || "",
      };

      res.json({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    } catch (error: any) {
      console.error("Google auth error:", error.message);
      res.status(401).json({ message: "Authentication failed" });
    }
  });

  // GET /api/auth/me — check current session
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // POST /api/auth/logout — destroy session
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  // GET /api/auth/client-id — expose Google client ID to frontend
  app.get("/api/auth/client-id", (_req: Request, res: Response) => {
    res.json({ clientId: GOOGLE_CLIENT_ID });
  });
}

// Middleware to protect API routes
// Supports both session-based auth (browser) and API key auth (cron/programmatic)
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check session first (browser users)
  if (req.session.user) {
    return next();
  }

  // Check API key (programmatic access from VenuJA1 cron)
  if (API_KEY) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      if (token === API_KEY) {
        return next();
      }
    }
  }

  res.status(401).json({ message: "Authentication required" });
}
