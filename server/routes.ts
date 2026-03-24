import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, AGENTS } from "@shared/schema";
import { requireAuth } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Protect all job routes
  app.use("/api/jobs", requireAuth);
  app.use("/api/stats", requireAuth);
  app.use("/api/agents", requireAuth);

  // GET /api/agents — list all agents with their stats
  app.get("/api/agents", async (_req, res) => {
    try {
      const agentStats = await Promise.all(
        AGENTS.map(async (agent) => {
          const stats = await storage.getStats(agent);
          return { agent, ...stats };
        })
      );
      const allStats = await storage.getStats("all");
      res.json({ agents: agentStats, all: allStats });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  // GET /api/jobs — list jobs, filter by status and/or agent
  app.get("/api/jobs", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const agent = req.query.agent as string | undefined;
      const jobs = await storage.getJobs(status, agent);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // GET /api/stats — aggregated stats, optionally filter by agent
  app.get("/api/stats", async (req, res) => {
    try {
      const agent = req.query.agent as string | undefined;
      const stats = await storage.getStats(agent);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // GET /api/jobs/:id — get single job
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // POST /api/jobs — create a job
  app.post("/api/jobs", async (req, res) => {
    try {
      const parsed = insertJobSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid job data", errors: parsed.error.errors });
      }
      const job = await storage.createJob(parsed.data);
      res.status(201).json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // PATCH /api/jobs/:id — update job (status, notes, etc.)
  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      const job = await storage.updateJob(id, req.body);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // DELETE /api/jobs/:id — delete a job
  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      const deleted = await storage.deleteJob(id);
      if (!deleted) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  return httpServer;
}
