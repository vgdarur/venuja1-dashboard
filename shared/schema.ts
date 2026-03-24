import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const AGENTS = ["venuja1", "krishnaja1", "udayja1", "shasheeja1", "rajja1", "dunteesja1", "purvaja1", "ramanaja1"] as const;
export type AgentName = (typeof AGENTS)[number];

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  salary_range: text("salary_range"),
  match_score: integer("match_score").notNull(),
  status: text("status").notNull().default("pending"),
  job_url: text("job_url"),
  applied_date: timestamp("applied_date"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
  agent: text("agent").notNull().default("venuja1"),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  created_at: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
