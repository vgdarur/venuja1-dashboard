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
    this.seed();
  }

  private seed() {
    const seedJobs: Omit<InsertJob, "id" | "created_at">[] = [
      {
        title: "Senior Software Engineering Manager",
        company: "Google",
        location: "Remote",
        salary_range: "$280K-$350K",
        match_score: 95,
        status: "interview",
        job_url: "https://linkedin.com/jobs/view/google-senior-sem",
        applied_date: new Date("2026-03-10"),
        notes: "Passed phone screen with hiring manager. Onsite scheduled March 25.",
      },
      {
        title: "Software Development Manager, AWS",
        company: "Amazon",
        location: "Remote",
        salary_range: "$250K-$320K",
        match_score: 91,
        status: "applied",
        job_url: "https://linkedin.com/jobs/view/amazon-sdm-aws",
        applied_date: new Date("2026-03-14"),
        notes: "Applied via referral from Balaji's network.",
      },
      {
        title: "Engineering Manager, Core Infrastructure",
        company: "Stripe",
        location: "Remote (US)",
        salary_range: "$270K-$340K",
        match_score: 93,
        status: "applied",
        job_url: "https://linkedin.com/jobs/view/stripe-em-core",
        applied_date: new Date("2026-03-12"),
        notes: null,
      },
      {
        title: "Sr. Software Engineering Manager",
        company: "Microsoft",
        location: "Remote",
        salary_range: "$240K-$310K",
        match_score: 88,
        status: "offer",
        job_url: "https://linkedin.com/jobs/view/microsoft-ssem",
        applied_date: new Date("2026-02-28"),
        notes: "Offer received: $290K base + equity. Considering.",
      },
      {
        title: "Software Manager, Machine Learning Platform",
        company: "Netflix",
        location: "Remote (US)",
        salary_range: "$300K-$380K",
        match_score: 85,
        status: "pending",
        job_url: "https://linkedin.com/jobs/view/netflix-sm-mlp",
        applied_date: null,
        notes: "Awaiting Venu's approval on Telegram.",
      },
      {
        title: "Engineering Manager, Ads Platform",
        company: "Meta",
        location: "Remote",
        salary_range: "$260K-$340K",
        match_score: 82,
        status: "skipped",
        job_url: "https://linkedin.com/jobs/view/meta-em-ads",
        applied_date: null,
        notes: "Skipped — ads domain not a fit.",
      },
      {
        title: "Director of Software Engineering",
        company: "Salesforce",
        location: "Remote",
        salary_range: "$280K-$360K",
        match_score: 78,
        status: "applied",
        job_url: "https://linkedin.com/jobs/view/salesforce-dse",
        applied_date: new Date("2026-03-15"),
        notes: null,
      },
      {
        title: "Software Engineering Manager, Platform",
        company: "Datadog",
        location: "Remote (US)",
        salary_range: "$230K-$290K",
        match_score: 90,
        status: "interview",
        job_url: "https://linkedin.com/jobs/view/datadog-sem",
        applied_date: new Date("2026-03-08"),
        notes: "Technical interview completed. Awaiting feedback.",
      },
      {
        title: "Senior Manager, Software Development",
        company: "Twilio",
        location: "Remote",
        salary_range: "$220K-$280K",
        match_score: 76,
        status: "rejected",
        job_url: "https://linkedin.com/jobs/view/twilio-smsd",
        applied_date: new Date("2026-03-01"),
        notes: "Rejected after final round. Position filled internally.",
      },
      {
        title: "Engineering Manager, Backend Services",
        company: "Shopify",
        location: "Remote",
        salary_range: "$210K-$270K",
        match_score: 84,
        status: "applied",
        job_url: "https://linkedin.com/jobs/view/shopify-em-backend",
        applied_date: new Date("2026-03-16"),
        notes: null,
      },
      {
        title: "Software Manager, Cloud Platform",
        company: "Snowflake",
        location: "Remote (US)",
        salary_range: "$250K-$320K",
        match_score: 87,
        status: "pending",
        job_url: "https://linkedin.com/jobs/view/snowflake-sm-cloud",
        applied_date: null,
        notes: "Sent to Telegram for review.",
      },
      {
        title: "Sr. Engineering Manager, Payments",
        company: "Square",
        location: "Remote",
        salary_range: "$240K-$300K",
        match_score: 81,
        status: "skipped",
        job_url: "https://linkedin.com/jobs/view/square-sem-pay",
        applied_date: null,
        notes: "Skipped — recent layoffs concern.",
      },
      {
        title: "Engineering Manager, Search",
        company: "Elastic",
        location: "Remote (Worldwide)",
        salary_range: "$200K-$260K",
        match_score: 73,
        status: "applied",
        job_url: "https://linkedin.com/jobs/view/elastic-em-search",
        applied_date: new Date("2026-03-17"),
        notes: null,
      },
      {
        title: "Software Development Manager",
        company: "Atlassian",
        location: "Remote (US)",
        salary_range: "$230K-$290K",
        match_score: 86,
        status: "pending",
        job_url: "https://linkedin.com/jobs/view/atlassian-sdm",
        applied_date: null,
        notes: "New match — high fit score.",
      },
      {
        title: "Senior Manager, Platform Engineering",
        company: "Uber",
        location: "Remote",
        salary_range: "$260K-$330K",
        match_score: 79,
        status: "skipped",
        job_url: "https://linkedin.com/jobs/view/uber-smpe",
        applied_date: null,
        notes: "Skipped — prefers not to work in rideshare domain.",
      },
      {
        title: "Engineering Manager, Developer Tools",
        company: "GitHub",
        location: "Remote",
        salary_range: "$235K-$300K",
        match_score: 92,
        status: "interview",
        job_url: "https://linkedin.com/jobs/view/github-em-devtools",
        applied_date: new Date("2026-03-05"),
        notes: "Panel interview completed. Very positive feedback from team.",
      },
      {
        title: "Software Engineering Manager, Data",
        company: "Databricks",
        location: "Remote (US)",
        salary_range: "$260K-$340K",
        match_score: 89,
        status: "applied",
        job_url: "https://linkedin.com/jobs/view/databricks-sem-data",
        applied_date: new Date("2026-03-18"),
        notes: "Applied today. Strong match for data platform background.",
      },
      {
        title: "Director of Engineering",
        company: "Figma",
        location: "Remote",
        salary_range: "$280K-$350K",
        match_score: 74,
        status: "pending",
        job_url: "https://linkedin.com/jobs/view/figma-doe",
        applied_date: null,
        notes: "Director level — may be a stretch but great company.",
      },
      {
        title: "Senior Software Manager, Infrastructure",
        company: "Cloudflare",
        location: "Remote (US)",
        salary_range: "$220K-$280K",
        match_score: 83,
        status: "rejected",
        job_url: "https://linkedin.com/jobs/view/cloudflare-ssm",
        applied_date: new Date("2026-02-25"),
        notes: "Rejected after hiring manager screen. Looking for more infra-specific experience.",
      },
    ];

    // Spread creation dates over the last 30 days
    const now = new Date();
    seedJobs.forEach((job, index) => {
      const daysAgo = Math.floor((seedJobs.length - index) * (30 / seedJobs.length));
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const id = this.nextId++;
      this.jobs.set(id, {
        id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary_range: job.salary_range ?? null,
        match_score: job.match_score,
        status: job.status,
        job_url: job.job_url ?? null,
        applied_date: job.applied_date ?? null,
        created_at: createdAt,
        notes: job.notes ?? null,
      });
    });
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
