import { type Job, type InsertJob } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private jobs: Map<number, Job>;
  private nextId: number;

  constructor() {
    this.jobs = new Map();
    this.nextId = 1;
    // No seed data — dashboard starts clean. Real jobs are added via API.
  }

  async getJobs(status?: string): Promise<Job[]> {
    const allJobs = Array.from(this.jobs.values());
    if (status) {
      return allJobs.filter((j) => j.status === status);
    }
    return allJobs.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.nextId++;
    const job: Job = {
      id,
      title: insertJob.title,
      company: insertJob.company,
      location: insertJob.location,
      salary_range: insertJob.salary_range ?? null,
      match_score: insertJob.match_score,
      status: insertJob.status ?? "pending",
      job_url: insertJob.job_url ?? null,
      applied_date: insertJob.applied_date ? new Date(insertJob.applied_date) : null,
      created_at: new Date(),
      notes: insertJob.notes ?? null,
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job | undefined> {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;

    const updated: Job = {
      ...existing,
      ...updates,
      applied_date: updates.applied_date ? new Date(updates.applied_date) : existing.applied_date,
      id: existing.id,
      created_at: existing.created_at,
    };
    this.jobs.set(id, updated);
    return updated;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getStats() {
    const allJobs = Array.from(this.jobs.values());
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

export const storage = new MemStorage();
