import { type Job, type InsertJob, jobs } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

export interface IStorage {
  getJobs(status?: string): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, updates: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  getStats(): Promise<{
    total: number;
    applied: number;
    interviews: number;
    offers: number;
    skipRate: number;
    pending: number;
    rejected: number;
  }>;
}

// Persistent PostgreSQL storage using Drizzle ORM + Neon
export class PgStorage implements IStorage {
  private db;

  constructor(databaseUrl: string) {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
    this.db = drizzle(pool);
  }

  async getJobs(status?: string): Promise<Job[]> {
    if (status) {
      return this.db
        .select()
        .from(jobs)
        .where(eq(jobs.status, status))
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

  async getStats() {
    const allJobs = await this.db.select().from(jobs);
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
// DATABASE_URL must be set as an environment variable (e.g. in Cloud Run)
// Never hardcode database credentials in source code.
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Set it in Cloud Run or your .env file."
  );
}

export const storage: IStorage = new PgStorage(DATABASE_URL);

console.log("✅ Using persistent PostgreSQL storage (Neon)");
