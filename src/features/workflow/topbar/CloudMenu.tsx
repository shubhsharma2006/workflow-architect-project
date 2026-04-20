import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cloud, ChevronDown, Save, Plus, FolderOpen, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWorkflowStore } from "@/store/workflowStore";
import {
  listMyWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
  type StoredWorkflow,
} from "@/api/workflowsApi";
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

export function CloudMenu() {
  const qc = useQueryClient();
  const {
    nodes, edges, workflowName, setWorkflowName, loadWorkflow,
    loadedWorkflowId, setLoadedWorkflowId,
  } = useWorkflowStore();

  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<StoredWorkflow | null>(null);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: listMyWorkflows,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (loadedWorkflowId) {
        return updateWorkflow(loadedWorkflowId, workflowName, { nodes, edges });
      }
      throw new Error("No loaded workflow id");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Saved to cloud");
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => createWorkflow(name, { nodes, edges }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      setLoadedWorkflowId(row.id);
      setWorkflowName(row.name);
      setSaveAsOpen(false);
      setSaveAsName("");
      toast.success("Workflow created in cloud");
    },
    onError: (e: Error) => toast.error("Create failed", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteWorkflow(id),
    onSuccess: (_void, id) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["checkpoints", id] });
      if (loadedWorkflowId === id) setLoadedWorkflowId(null);
      setConfirmDelete(null);
      toast.success("Workflow deleted");
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  const handlePrimarySave = () => {
    if (loadedWorkflowId) {
      saveMutation.mutate();
    } else {
      setSaveAsName(workflowName);
      setSaveAsOpen(true);
    }
  };

  const handleLoad = (w: StoredWorkflow) => {
    loadWorkflow({
      nodes: w.data.nodes,
      edges: w.data.edges,
      workflowName: w.name,
      loadedWorkflowId: w.id,
    });
    toast.success(`Loaded "${w.name}"`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Cloud className="mr-1.5 h-4 w-4" />
            Cloud
            {loadedWorkflowId && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-success" />
            )}
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Cloud workflows</span>
            {loadedWorkflowId && <span className="text-[10px] font-normal text-success">● synced</span>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); handlePrimarySave(); }}
            disabled={saveMutation.isPending || nodes.length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            {loadedWorkflowId ? "Save changes" : "Save to cloud…"}
            {saveMutation.isPending && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setSaveAsName(workflowName);
              setSaveAsOpen(true);
            }}
            disabled={nodes.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Save as new…
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            My workflows
          </DropdownMenuLabel>

          {isLoading && (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && workflows.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No saved workflows yet.
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {workflows.map((w) => (
              <div
                key={w.id}
                className={`group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent ${loadedWorkflowId === w.id ? "bg-accent/50" : ""
                  }`}
              >
                <button
                  onClick={() => handleLoad(w)}
                  className="flex min-w-0 flex-1 flex-col items-start text-left"
                >
                  <span className="truncate text-sm font-medium">{w.name}</span>
                  <span className="text-[10px] text-muted-foreground">{relativeTime(w.updated_at)}</span>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleLoad(w)}
                  title="Load"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(w)}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save as dialog */}
      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save workflow to cloud</DialogTitle>
            <DialogDescription>
              Choose a name. You can rename or delete it later from the Cloud menu.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={saveAsName}
            onChange={(e) => setSaveAsName(e.target.value)}
            placeholder="Workflow name"
            onKeyDown={(e) => {
              if (e.key === "Enter" && saveAsName.trim()) createMutation.mutate(saveAsName.trim());
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveAsOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(saveAsName.trim())}
              disabled={!saveAsName.trim() || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{confirmDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the workflow and all its checkpoints. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
