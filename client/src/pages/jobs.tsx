import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { JobDetailSheet } from "@/components/job-detail-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import type { Job } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type SortKey = "match_score" | "created_at" | "company" | "title";
type SortDir = "asc" | "desc";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "applied", label: "Applied" },
  { value: "skipped", label: "Skipped" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/jobs");
      return res.json();
    },
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = jobs
    .filter((j) => statusFilter === "all" || j.status === statusFilter)
    .sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "match_score":
          return (a.match_score - b.match_score) * mult;
        case "created_at":
          return (
            (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) *
            mult
          );
        case "company":
          return a.company.localeCompare(b.company) * mult;
        case "title":
          return a.title.localeCompare(b.title) * mult;
        default:
          return 0;
      }
    });

  function SortButton({ column, label }: { column: SortKey; label: string }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium text-xs hover:bg-transparent"
        onClick={() => toggleSort(column)}
        data-testid={`sort-${column}`}
      >
        {label}
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Jobs</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {jobs.length} jobs
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger
            className="w-[160px] h-8 text-xs"
            data-testid="select-status-filter"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">
                      <SortButton column="title" label="Title" />
                    </TableHead>
                    <TableHead>
                      <SortButton column="company" label="Company" />
                    </TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead className="text-center">
                      <SortButton column="match_score" label="Match" />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      <SortButton column="created_at" label="Found" />
                    </TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((job) => (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedJobId(job.id)}
                      data-testid={`row-job-${job.id}`}
                    >
                      <TableCell className="font-medium text-sm max-w-[280px] truncate">
                        {job.title}
                      </TableCell>
                      <TableCell className="text-sm">{job.company}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {job.location}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {job.salary_range || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            job.match_score >= 90
                              ? "text-emerald-400"
                              : job.match_score >= 80
                                ? "text-blue-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {job.match_score}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                        {new Date(job.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {job.job_url && (
                          <a
                            href={job.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`link-job-url-${job.id}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground py-12"
                      >
                        No jobs found matching the current filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <JobDetailSheet
        jobId={selectedJobId}
        open={selectedJobId !== null}
        onClose={() => setSelectedJobId(null)}
      />
    </div>
  );
}
