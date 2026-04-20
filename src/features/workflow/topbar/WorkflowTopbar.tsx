import { useEffect, useRef, useState } from "react";
import {
  Workflow, ShieldCheck, Download, Upload, Sparkles, Trash2, Undo2, Redo2,
  LayoutGrid, Map as MapIcon, Maximize2, Sun, Moon, ChevronDown, Keyboard, Check,
  Layers, LogOut, User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkflowStore, validateWorkflow, onAutosave } from "@/store/workflowStore";
import { toast } from "sonner";
import { workflowTemplates } from "../sampleWorkflow";
import { autoLayout } from "../canvas/autoLayout";
import { canvasFitViewRef } from "../canvas/WorkflowCanvas";
import { CloudMenu } from "./CloudMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);
  return [isDark, setIsDark] as const;
}

export function WorkflowTopbar() {
  const {
    workflowName, setWorkflowName, nodes, edges, errors, clear, loadWorkflow, setErrors,
    undo, redo, past, future, applyLayout, showMinimap, toggleMinimap,
    groupSelected, loadedWorkflowId,
  } = useWorkflowStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isDark, setIsDark] = useDarkMode();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [savedTick, setSavedTick] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const off = onAutosave((at) => setSavedAt(at));
    const t = setInterval(() => setSavedTick((n) => n + 1), 15000);
    return () => { off(); clearInterval(t); };
  }, []);

  const selectedCount = nodes.filter((n) => n.selected && n.type !== "group" && !n.parentNode).length;
  const groupCount = nodes.filter((n) => n.type === "group").length;

  const savedLabel = (() => {
    if (!savedAt) return null;
    void savedTick;
    const diff = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));
    const where = loadedWorkflowId ? "Synced" : "Saved locally";
    if (diff < 5) return `${where} just now`;
    if (diff < 60) return `${where} ${diff}s ago`;
    const m = Math.floor(diff / 60);
    return `${where} ${m}m ago`;
  })();

  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  const validate = () => {
    const errs = validateWorkflow(nodes, edges);
    setErrors(errs);
    if (errs.length === 0) toast.success("Workflow is valid", { description: "All nodes are connected and configured." });
    else {
      const blockers = errs.filter((e) => e.severity === "error").length;
      toast[blockers ? "error" : "warning"](`${errs.length} issue${errs.length > 1 ? "s" : ""} found`, {
        description: errs[0].message,
      });
    }
  };

  const tidyUp = () => {
    if (nodes.length === 0) { toast("Nothing to arrange"); return; }
    const next = autoLayout(nodes, edges, "LR");
    applyLayout(next);
    toast.success("Tidied up", { description: "Nodes auto-arranged left-to-right." });
    setTimeout(() => canvasFitViewRef.current?.({ padding: 0.2, duration: 400 }), 50);
  };

  const fitView = () => {
    if (nodes.length === 0) { toast("Nothing to fit"); return; }
    canvasFitViewRef.current?.({ padding: 0.2, duration: 400 });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ workflowName, nodes, edges }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${workflowName.replace(/\s+/g, "_")}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Workflow exported");
  };

  const importJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error("Invalid format");
      loadWorkflow(data);
      toast.success("Workflow imported");
    } catch {
      toast.error("Invalid workflow file");
    } finally {
      e.target.value = "";
    }
  };

  const handleGroup = () => {
    if (selectedCount < 2) {
      toast("Select 2+ nodes to group", { description: "Shift-click or drag to multi-select." });
      return;
    }
    groupSelected();
    toast.success("Grouped");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <header className="flex shrink-0 flex-col gap-2 border-b border-border bg-card px-5 py-3 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
          <Workflow className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">HR Workflow Designer</div>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="h-7 w-72 border-0 bg-transparent px-0 text-sm font-semibold shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="ml-2 hidden items-center gap-1.5 md:flex">
          <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {nodes.length} {nodes.length === 1 ? "node" : "nodes"}
          </span>
          <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {edges.length} {edges.length === 1 ? "edge" : "edges"}
          </span>
          {groupCount > 0 && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {groupCount} {groupCount === 1 ? "group" : "groups"}
            </span>
          )}
          {errorCount > 0 && (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
              {errorCount} {errorCount === 1 ? "error" : "errors"}
            </span>
          )}
          {warningCount > 0 && (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
              {warningCount} {warningCount === 1 ? "warning" : "warnings"}
            </span>
          )}
          {errorCount === 0 && warningCount === 0 && nodes.length > 0 && (
            <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              healthy
            </span>
          )}
          {savedLabel && (
            <span className="hidden items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground lg:inline-flex">
              <Check className="h-3 w-3 text-success" />
              {savedLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background/60 p-0.5">
          <Button variant="ghost" size="sm" className="h-7 px-2" disabled={past.length === 0} onClick={undo} title="Undo (⌘/Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2" disabled={future.length === 0} onClick={redo} title="Redo (⌘/Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-background/60 p-0.5">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={fitView} title="Fit to view">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={toggleMinimap}
            title={showMinimap ? "Hide minimap" : "Show minimap"}
          >
            <MapIcon className={`h-4 w-4 ${showMinimap ? "text-primary" : ""}`} />
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={tidyUp}>
          <LayoutGrid className="mr-1.5 h-4 w-4" /> Tidy up
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleGroup}
          disabled={selectedCount < 2}
          title="Group selected nodes (⌘/Ctrl+G)"
        >
          <Layers className="mr-1.5 h-4 w-4" /> Group {selectedCount >= 2 && `(${selectedCount})`}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Sparkles className="mr-1.5 h-4 w-4" /> Templates <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Load a template</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workflowTemplates.map((t) => (
              <DropdownMenuItem
                key={t.id}
                className="flex flex-col items-start gap-0.5 py-2"
                onClick={() => {
                  loadWorkflow(t.build());
                  toast.success(`Loaded: ${t.label}`);
                  setTimeout(() => canvasFitViewRef.current?.({ padding: 0.2, duration: 400 }), 80);
                }}
              >
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-[11px] text-muted-foreground">{t.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <CloudMenu />

        <Button variant="ghost" size="sm" onClick={validate}>
          <ShieldCheck className="mr-1.5 h-4 w-4" /> Validate
        </Button>
        <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
          <Upload className="mr-1.5 h-4 w-4" /> Import
        </Button>
        <input ref={fileInput} type="file" accept="application/json" hidden onChange={importJson} />
        <Button variant="ghost" size="sm" onClick={exportJson}>
          <Download className="mr-1.5 h-4 w-4" /> Export
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { clear(); toast("Canvas cleared"); }}>
          <Trash2 className="mr-1.5 h-4 w-4" /> Clear
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => window.dispatchEvent(new Event("hr:open-shortcuts"))}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2" title={user?.email}>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-primary text-[10px] font-semibold text-primary-foreground">
                {user?.email?.[0]?.toUpperCase() ?? "?"}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="truncate text-xs font-normal">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
