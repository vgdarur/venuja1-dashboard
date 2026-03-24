import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
  Bot,
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

const agentOptions = [
  { value: "all", label: "All Agents" },
  { value: "venuja1", label: "VenuJA1" },
  { value: "krishnaja1", label: "KrishnaJA1" },
  { value: "udayja1", label: "UdayJA1" },
  { value: "shasheeja1", label: "ShasheeJA1" },
  { value: "rajja1", label: "RajJA1" },
];

const agentColors: Record<string, string> = {
  venuja1: "hsl(174 72% 46%)",
  krishnaja1: "hsl(262 72% 56%)",
  udayja1: "hsl(38 92% 50%)",
  shasheeja1: "hsl(340 75% 55%)",
  rajja1: "hsl(200 80% 50%)",
};

const agentLabels: Record<string, string> = {
  venuja1: "VenuJA1",
  krishnaja1: "KrishnaJA1",
  udayja1: "UdayJA1",
  shasheeja1: "ShasheeJA1",
  rajja1: "RajJA1",
};

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const agentParam = agentFilter === "all" ? "" : `?agent=${agentFilter}`;

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs" + agentParam],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/jobs" + agentParam);
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
      >
        {label}
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold">Jobs</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {jobs.length} jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <Bot className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agentOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
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
                    <TableHead className="w-[60px]">Agent</TableHead>
                    <TableHead className="w-[260px]">
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
                    >
                      <TableCell>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            background: `${agentColors[job.agent] || "#71717a"}20`,
                            color: agentColors[job.agent] || "#71717a",
                          }}
                        >
                          {agentLabels[job.agent] || job.agent || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[260px] truncate">
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
                        colSpan={9}
                        className="text-center text-sm text-muted-foreground py-12"
                      >
                        No jobs found matching the current filters.
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
