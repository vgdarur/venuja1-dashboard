import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  applied: {
    label: "Applied",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  skipped: {
    label: "Skipped",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  },
  interview: {
    label: "Interview",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  offer: {
    label: "Offer",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/15 text-red-400 border-red-500/20",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] font-medium", config.className)}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
