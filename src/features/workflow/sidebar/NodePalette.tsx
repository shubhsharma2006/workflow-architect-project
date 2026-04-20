import { Play, ListChecks, ShieldCheck, Zap, Flag, GripVertical, PanelLeftClose } from "lucide-react";
import type { NodeType } from "@/types/workflow";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items: { type: NodeType; label: string; description: string; icon: React.ReactNode; accent: string }[] = [
  { type: "start", label: "Start", description: "Workflow entry point", icon: <Play className="h-4 w-4" />, accent: "bg-node-start" },
  { type: "task", label: "Task", description: "Assign work to a person", icon: <ListChecks className="h-4 w-4" />, accent: "bg-node-task" },
  { type: "approval", label: "Approval", description: "Manual or threshold gate", icon: <ShieldCheck className="h-4 w-4" />, accent: "bg-node-approval" },
  { type: "automated", label: "Automated", description: "Run an automation", icon: <Zap className="h-4 w-4" />, accent: "bg-node-automated" },
  { type: "end", label: "End", description: "Finalize the workflow", icon: <Flag className="h-4 w-4" />, accent: "bg-node-end" },
];

export function NodePalette({ onCollapse }: { onCollapse?: () => void }) {
  const onDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-gradient-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Node Palette</div>
          <h2 className="mt-1 text-base font-semibold">Drag to canvas</h2>
        </div>
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onCollapse}
            title="Collapse palette"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="px-5 pt-2 text-xs text-muted-foreground">Build your HR workflow by dragging nodes onto the canvas.</p>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {items.map((it) => (
          <div
            key={it.type}
            draggable
            onDragStart={(e) => onDragStart(e, it.type)}
            className={cn(
              "group flex cursor-grab items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft transition-smooth",
              "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant active:cursor-grabbing"
            )}
          >
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm", it.accent)}>
              {it.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-tight">{it.label}</div>
              <div className="truncate text-xs text-muted-foreground">{it.description}</div>
            </div>
            <GripVertical className="h-4 w-4 text-muted-foreground/50 transition-smooth group-hover:text-primary" />
          </div>
        ))}
      </div>
      <div className="border-t border-border bg-card/50 px-4 py-3 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">Tip:</span> Click a node to edit it in the inspector.
      </div>
    </aside>
  );
}
