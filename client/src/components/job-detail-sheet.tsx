import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  MapPin,
  DollarSign,
  Gauge,
  Calendar,
  ExternalLink,
  Trash2,
} from "lucide-react";
import type { Job } from "@shared/schema";

const allStatuses = [
  { value: "pending", label: "Pending Approval" },
  { value: "applied", label: "Applied" },
  { value: "skipped", label: "Skipped" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

export function JobDetailSheet({
  jobId,
  open,
  onClose,
}: {
  jobId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/jobs/${jobId}`);
      return res.json();
    },
    enabled: jobId !== null,
  });

  useEffect(() => {
    if (job) {
      setEditNotes(job.notes || "");
      setEditStatus(job.status);
    }
  }, [job]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Job>) => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Job updated", description: "Changes saved." });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not save changes.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Job deleted" });
      onClose();
    },
    onError: () => {
      toast({
        title: "Delete failed",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      status: editStatus,
      notes: editNotes || null,
    } as Partial<Job>);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading || !job ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="text-base font-bold pr-6">
                {job.title}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">{job.company}</p>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3 w-3" /> Location
                  </div>
                  <p className="text-sm">{job.location}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <DollarSign className="h-3 w-3" /> Salary
                  </div>
                  <p className="text-sm tabular-nums">{job.salary_range || "Not listed"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <Gauge className="h-3 w-3" /> Match Score
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    <span
                      className={
                        job.match_score >= 90
                          ? "text-emerald-400"
                          : job.match_score >= 80
                            ? "text-blue-400"
                            : "text-muted-foreground"
                      }
                    >
                      {job.match_score}%
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Found
                  </div>
                  <p className="text-sm tabular-nums">
                    {new Date(job.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Applied Date */}
              {job.applied_date && (
                <div className="text-xs text-muted-foreground">
                  Applied:{" "}
                  <span className="tabular-nums">
                    {new Date(job.applied_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}

              {/* Job URL */}
              {job.job_url && (
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  data-testid="link-job-detail-url"
                >
                  <ExternalLink className="h-3 w-3" /> View Job Posting
                </a>
              )}

              {/* Status Select */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Status
                </label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-job-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allStatuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Notes
                </label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this opportunity..."
                  className="min-h-[100px] text-sm resize-none"
                  data-testid="input-job-notes"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-job"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-job"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
