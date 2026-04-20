import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Plus, RotateCcw, Trash2, Loader2, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useWorkflowStore } from "@/store/workflowStore";
import { listCheckpoints, createCheckpoint, deleteCheckpoint } from "@/api/checkpointsApi";
import { toast } from "sonner";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function CheckpointsPanel() {
  const qc = useQueryClient();
  const { loadedWorkflowId, nodes, edges, loadWorkflow, workflowName } = useWorkflowStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const { data: checkpoints = [], isLoading } = useQuery({
    queryKey: ["checkpoints", loadedWorkflowId],
    queryFn: () => loadedWorkflowId ? listCheckpoints(loadedWorkflowId) : Promise.resolve([]),
    enabled: !!loadedWorkflowId,
  });

  const createMut = useMutation({
    mutationFn: async (n: string) => {
      if (!loadedWorkflowId) throw new Error("No workflow loaded");
      return createCheckpoint(loadedWorkflowId, n, { nodes, edges });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkpoints", loadedWorkflowId] });
      setOpen(false);
      setName("");
      toast.success("Checkpoint saved");
    },
    onError: (e: Error) => toast.error("Failed to save checkpoint", { description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCheckpoint,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkpoints", loadedWorkflowId] });
      toast.success("Checkpoint deleted");
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  if (!loadedWorkflowId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <Cloud className="h-8 w-8 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Cloud-only feature</h3>
        <p className="max-w-xs text-xs text-muted-foreground">
          Save your workflow to the cloud first to create version checkpoints. Use <span className="font-medium">Cloud → Save to cloud</span> in the topbar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold">{checkpoints.length} checkpoint{checkpoints.length === 1 ? "" : "s"}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7"
          onClick={() => { setName(`${workflowName} — ${new Date().toLocaleString()}`); setOpen(true); }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Save checkpoint
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && checkpoints.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No checkpoints yet. Save one to capture the current state.
          </div>
        )}

        <div className="space-y-1 p-2">
          {checkpoints.map((c) => (
            <div
              key={c.id}
              className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-smooth hover:border-primary/40"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{c.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {relativeTime(c.created_at)} · {c.data.nodes.length} nodes · {c.data.edges.length} edges
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                title="Restore this checkpoint"
                onClick={() => {
                  loadWorkflow({
                    nodes: c.data.nodes,
                    edges: c.data.edges,
                    workflowName,
                    loadedWorkflowId,
                  });
                  toast.success(`Restored "${c.name}"`);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                title="Delete checkpoint"
                onClick={() => deleteMut.mutate(c.id)}
                disabled={deleteMut.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save checkpoint</DialogTitle>
            <DialogDescription>
              Capture the current canvas state. You can restore it any time. Up to 50 checkpoints are kept per workflow.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Checkpoint name"
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) createMut.mutate(name.trim()); }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate(name.trim())}
              disabled={!name.trim() || createMut.isPending}
            >
              {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
