import { type Job, type InsertJob, jobs } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

export interface IStorage {
  getJobs(status?: string, agent?: string): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, updates: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  getStats(agent?: string): Promise<{
    total: number;
    applied: number;
    interviews: number;
    offers: number;
    skipRate: number;
    pending: number;
    rejected: number;
  }>;
}

export class PgStorage implements IStorage {
  private db;
  private pool: pg.Pool;
  private initialized = false;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
    // Use venuja1 schema so jobs go into venuja1.jobs not public.jobs
    this.pool.on('connect', (client) => {
      client.query('SET search_path TO venuja1,public');
    });
    this.db = drizzle(this.pool);
    // Auto-create schema and table on startup
    this.ensureTable().catch((err) => console.error("Failed to initialize DB:", err.message));
  }

  private async ensureTable() {
    if (this.initialized) return;
    try {
      const client = await this.pool.connect();
      try {
        await client.query('CREATE SCHEMA IF NOT EXISTS venuja1');
        await client.query(`
          CREATE TABLE IF NOT EXISTS venuja1.jobs (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            salary_range TEXT,
            match_score INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            job_url TEXT,
            applied_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            notes TEXT,
            agent TEXT NOT NULL DEFAULT 'venuja1'
          )
        `);
        this.initialized = true;
        console.log('✅ venuja1.jobs table ready');
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('DB init error:', err.message);
    }
  }

  async getJobs(status?: string, agent?: string): Promise<Job[]> {
    const conditions = [];
    if (status) conditions.push(eq(jobs.status, status));
    if (agent && agent !== "all") conditions.push(eq(jobs.agent, agent));

    if (conditions.length > 0) {
      return this.db
        .select()
        .from(jobs)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(jobs.created_at));
    }
    return this.db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.created_at));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const result = await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id));
    return result[0];
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const result = await this.db
      .insert(jobs)
      .values({
        title: insertJob.title,
        company: insertJob.company,
        location: insertJob.location,
        salary_range: insertJob.salary_range ?? null,
        match_score: insertJob.match_score,
        status: insertJob.status ?? "pending",
        job_url: insertJob.job_url ?? null,
        applied_date: insertJob.applied_date
          ? new Date(insertJob.applied_date)
          : null,
        notes: insertJob.notes ?? null,
        agent: insertJob.agent ?? "venuja1",
      })
      .returning();
    return result[0];
  }

  async updateJob(
    id: number,
    updates: Partial<InsertJob>
  ): Promise<Job | undefined> {
    const updateData: Record<string, any> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.company !== undefined) updateData.company = updates.company;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.salary_range !== undefined)
      updateData.salary_range = updates.salary_range;
    if (updates.match_score !== undefined)
      updateData.match_score = updates.match_score;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.job_url !== undefined) updateData.job_url = updates.job_url;
    if (updates.applied_date !== undefined)
      updateData.applied_date = updates.applied_date
        ? new Date(updates.applied_date)
        : null;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.agent !== undefined) updateData.agent = updates.agent;

    if (Object.keys(updateData).length === 0) {
      return this.getJob(id);
    }

    const result = await this.db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, id))
      .returning();
    return result[0];
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await this.db
      .delete(jobs)
      .where(eq(jobs.id, id))
      .returning();
    return result.length > 0;
  }

  async getStats(agent?: string) {
    let allJobs: Job[];
    if (agent && agent !== "all") {
      allJobs = await this.db
        .select()
        .from(jobs)
        .where(eq(jobs.agent, agent));
    } else {
      allJobs = await this.db.select().from(jobs);
    }

    const total = allJobs.length;
    const applied = allJobs.filter((j) => j.status === "applied").length;
    const interviews = allJobs.filter((j) => j.status === "interview").length;
    const offers = allJobs.filter((j) => j.status === "offer").length;
    const pending = allJobs.filter((j) => j.status === "pending").length;
    const skipped = allJobs.filter((j) => j.status === "skipped").length;
    const rejected = allJobs.filter((j) => j.status === "rejected").length;
    const skipRate = total > 0 ? Math.round((skipped / total) * 100) : 0;

    return { total, applied, interviews, offers, skipRate, pending, rejected };
  }
}

// --- Storage initialization ---
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Set it in Cloud Run or your .env file."
  );
}

export const storage: IStorage = new PgStorage(DATABASE_URL);

console.log("✅ Using persistent PostgreSQL storage (Neon)");
