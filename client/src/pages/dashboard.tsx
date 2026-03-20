import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import {
  Briefcase,
  Send,
  MessageSquare,
  Trophy,
  SkipForward,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Job } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  applied: "#10b981",
  skipped: "#71717a",
  interview: "#3b82f6",
  offer: "#a855f7",
  rejected: "#ef4444",
};

function KpiCard({
  title,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  accent?: string;
}) {
  return (
    <Card className="border-card-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p
                className="text-xl font-bold tabular-nums"
                style={accent ? { color: accent } : undefined}
                data-testid={`kpi-${title.toLowerCase().replace(/\s/g, "-")}`}
              >
                {value}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-muted p-2.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationsChart({ jobs, loading }: { jobs: Job[]; loading: boolean }) {
  // Group by date over last 30 days
  const now = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = jobs.filter((j) => {
      if (!j.applied_date) return false;
      return new Date(j.applied_date).toISOString().slice(0, 10) === key;
    }).length;
    days.push({ date: label, count });
  }

  return (
    <Card className="border-card-border col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Applications Over Time</CardTitle>
        <p className="text-[11px] text-muted-foreground">Last 30 days</p>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174 72% 46%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174 72% 46%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(215 10% 58%)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fill: "hsl(215 10% 58%)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220 14% 12%)",
                  border: "1px solid hsl(215 12% 18%)",
                  borderRadius: "8px",
                  fontSize: 12,
                  color: "hsl(210 20% 95%)",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(174 72% 46%)"
                strokeWidth={2}
                fill="url(#gradientArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDistribution({ jobs, loading }: { jobs: Job[]; loading: boolean }) {
  const statusCounts = Object.entries(
    jobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: STATUS_COLORS[status] || "#71717a",
  }));

  return (
    <Card className="border-card-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Status Distribution</CardTitle>
        <p className="text-[11px] text-muted-foreground">All tracked jobs</p>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {statusCounts.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(220 14% 12%)",
                    border: "1px solid hsl(215 12% 18%)",
                    borderRadius: "8px",
                    fontSize: 12,
                    color: "hsl(210 20% 95%)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 flex-1">
              {statusCounts.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: entry.color }}
                    />
                    <span className="text-muted-foreground">{entry.name}</span>
                  </div>
                  <span className="font-medium tabular-nums">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivity({ jobs, loading }: { jobs: Job[]; loading: boolean }) {
  const recent = [...jobs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <Card className="border-card-border col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        <p className="text-[11px] text-muted-foreground">Last 10 job matches</p>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {recent.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                data-testid={`activity-job-${job.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <p className="text-[11px] text-muted-foreground">{job.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {job.match_score}%
                  </span>
                  <StatusBadge status={job.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    total: number;
    applied: number;
    interviews: number;
    offers: number;
    skipRate: number;
    pending: number;
    rejected: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/jobs");
      return res.json();
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">Dashboard</h2>
        <p className="text-xs text-muted-foreground">
          VenuJA1 agent activity overview — Venu Darur
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Found"
          value={stats?.total ?? 0}
          icon={Briefcase}
          loading={statsLoading}
        />
        <KpiCard
          title="Applied"
          value={stats?.applied ?? 0}
          icon={Send}
          loading={statsLoading}
          accent="#10b981"
        />
        <KpiCard
          title="Interviews"
          value={stats?.interviews ?? 0}
          icon={MessageSquare}
          loading={statsLoading}
          accent="#3b82f6"
        />
        <KpiCard
          title="Offers"
          value={stats?.offers ?? 0}
          icon={Trophy}
          loading={statsLoading}
          accent="#a855f7"
        />
        <KpiCard
          title="Skip Rate"
          value={stats ? `${stats.skipRate}%` : "0%"}
          icon={SkipForward}
          loading={statsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ApplicationsChart jobs={jobs} loading={jobsLoading} />
        <StatusDistribution jobs={jobs} loading={jobsLoading} />
      </div>

      {/* Recent Activity */}
      <RecentActivity jobs={jobs} loading={jobsLoading} />
    </div>
  );
}
