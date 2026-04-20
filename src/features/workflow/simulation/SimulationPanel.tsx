import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2, PlayCircle, Activity, ListOrdered, History, PanelBottomClose } from "lucide-react";
import { useWorkflowStore } from "@/store/workflowStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { simulateWorkflow } from "@/api/mockApi";
import { validateWorkflow } from "@/store/workflowStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SimulationLog } from "@/types/workflow";
import { CheckpointsPanel } from "../sidebar/CheckpointsPanel";

const iconFor = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  info: <Info className="h-4 w-4 text-primary" />,
};

const dotColorFor = {
  success: "bg-success border-success/30",
  warning: "bg-warning border-warning/30",
  error: "bg-destructive border-destructive/30",
  info: "bg-primary border-primary/30",
};

export function SimulationPanel({ onCollapse }: { onCollapse?: () => void }) {
  const { nodes, edges, logs, isSimulating, setLogs, setSimulating, setErrors } = useWorkflowStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"timeline" | "logs" | "checkpoints">("timeline");

  useEffect(() => {
    if (tab === "logs" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, tab]);

  const run = async () => {
    const errs = validateWorkflow(nodes, edges);
    setErrors(errs);
    const blockers = errs.filter((e) => e.severity === "error");
    if (blockers.length) {
      toast.error("Cannot run workflow", { description: blockers[0].message });
      return;
    }
    setSimulating(true);
    setLogs([]);
    try {
      const result = await simulateWorkflow({ nodes, edges });
      for (let i = 0; i < result.length; i++) {
        await new Promise((r) => setTimeout(r, 160));
        setLogs(result.slice(0, i + 1));
      }
      toast.success("Workflow simulation complete");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="flex h-72 shrink-0 flex-col border-t border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sandbox</div>
            <h3 className="text-sm font-semibold">Execution preview</h3>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="h-8">
              <TabsTrigger value="timeline" className="h-6 gap-1.5 text-xs">
                <Activity className="h-3.5 w-3.5" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="logs" className="h-6 gap-1.5 text-xs">
                <ListOrdered className="h-3.5 w-3.5" /> Logs
              </TabsTrigger>
              <TabsTrigger value="checkpoints" className="h-6 gap-1.5 text-xs">
                <History className="h-3.5 w-3.5" /> Checkpoints
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button
          onClick={run}
          disabled={isSimulating}
          size="sm"
          className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
        >
          {isSimulating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-1.5 h-4 w-4" />}
          {isSimulating ? "Running..." : "Run workflow"}
        </Button>
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onCollapse}
            title="Collapse panel"
          >
            <PanelBottomClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {tab === "timeline" && <TimelineView logs={logs} />}
      {tab === "logs" && (
        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="space-y-1.5 p-4 font-mono text-[12px]">
            {logs.length === 0 && <EmptyHint />}
            {logs.map((l) => (
              <div
                key={l.id}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 animate-fade-in",
                  l.status === "error" && "bg-destructive/5",
                  l.status === "warning" && "bg-warning/5",
                )}
              >
                <span className="mt-0.5 shrink-0">{iconFor[l.status]}</span>
                <span className="text-muted-foreground">{new Date(l.timestamp).toLocaleTimeString()}</span>
                <span className="text-foreground">{l.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      {tab === "checkpoints" && <CheckpointsPanel />}
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="flex h-full items-center justify-center py-8 text-center text-xs text-muted-foreground">
      Click <span className="mx-1 font-semibold text-foreground">Run workflow</span> to simulate execution.
    </div>
  );
}

function TimelineView({ logs }: { logs: SimulationLog[] }) {
  // Show step-level entries (with nodeId) on the timeline; fall back to all logs if none.
  const steps = logs.filter((l) => l.nodeId);
  const display = steps.length > 0 ? steps : logs;
  const startTime = display[0]?.timestamp ?? Date.now();

  return (
    <ScrollArea className="flex-1">
      <div className="min-w-max p-5">
        {display.length === 0 ? (
          <EmptyHint />
        ) : (
          <div className="flex items-stretch gap-3">
            {display.map((l, i) => {
              const elapsed = l.timestamp - startTime;
              return (
                <div key={l.id} className="flex items-stretch gap-3 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <div
                    className={cn(
                      "flex w-[180px] flex-col rounded-xl border bg-card p-3 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-elegant",
                      l.status === "error" && "border-destructive/40",
                      l.status === "warning" && "border-warning/40",
                      l.status === "success" && "border-success/30",
                      l.status === "info" && "border-primary/30",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", dotColorFor[l.status])}>
                        <span className="text-card">{iconFor[l.status]}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">+{elapsed}ms</span>
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs font-medium text-foreground">{l.message}</div>
                    {l.nodeType && (
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {l.nodeType}
                      </div>
                    )}
                  </div>
                  {i < display.length - 1 && (
                    <div className="flex items-center">
                      <div className="h-px w-6 bg-gradient-to-r from-border to-primary/40" />
                      <div className="h-2 w-2 rotate-45 border-r border-t border-primary/60" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
