import { memo, type ReactNode } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflowStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  id: string;
  selected: boolean;
  icon: ReactNode;
  label: string;
  title: string;
  accent: "start" | "task" | "approval" | "automated" | "end";
  hasTarget?: boolean;
  hasSource?: boolean;
  subtitle?: string;
  badge?: string;
  invalid?: boolean;
  branching?: boolean;
};

const accentMap = {
  start: "bg-node-start",
  task: "bg-node-task",
  approval: "bg-node-approval",
  automated: "bg-node-automated",
  end: "bg-node-end",
};

function BaseNodeInner({
  id, selected, icon, label, title, accent,
  hasTarget = true, hasSource = true, subtitle, badge, invalid, branching,
}: Props) {
  const errors = useWorkflowStore((s) => s.errors);
  const nodeErrors = errors.filter((e) => e.nodeId === id);
  const hasBlocker = nodeErrors.some((e) => e.severity === "error") || invalid;
  const hasWarning = nodeErrors.length > 0 || invalid;

  return (
    <div
      className={cn(
        "group relative min-w-[220px] max-w-[260px] rounded-2xl border bg-card transition-smooth",
        "shadow-node hover:-translate-y-0.5 hover:shadow-elegant",
        selected && "shadow-node-selected border-primary",
        !selected && hasBlocker && "ring-2 ring-destructive/60 border-destructive/40",
        !selected && !hasBlocker && hasWarning && "ring-2 ring-warning/50",
        !selected && !hasWarning && "border-border",
      )}
    >
      {hasTarget && <Handle type="target" position={Position.Left} />}

      {hasWarning && (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "absolute -right-2 -top-2 z-10 flex h-6 w-6 cursor-help items-center justify-center rounded-full text-white shadow-elegant ring-2 ring-card",
                  hasBlocker ? "bg-destructive" : "bg-warning"
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px]">
              <ul className="space-y-1 text-xs">
                {nodeErrors.map((e, i) => (
                  <li key={i}>• {e.message}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <div className="flex items-start gap-3 p-3.5">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", accentMap[accent])}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            {badge && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium text-accent-foreground">{badge}</span>
            )}
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold text-foreground">{title || "Untitled"}</div>
          {subtitle && <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        <span className={cn(
          "mt-1 h-2 w-2 rounded-full",
          hasBlocker ? "bg-destructive animate-pulse-soft" : hasWarning ? "bg-warning animate-pulse-soft" : "bg-success/70"
        )} />
      </div>

      {/* Branching: dual handles for Approval (Approved top-right, Rejected bottom-right) */}
      {hasSource && branching && (
        <>
          <Handle
            id="approved"
            type="source"
            position={Position.Right}
            style={{ top: "32%", background: "hsl(var(--success))" }}
          />
          <Handle
            id="rejected"
            type="source"
            position={Position.Right}
            style={{ top: "72%", background: "hsl(var(--destructive))" }}
          />
          <span className="pointer-events-none absolute -right-16 top-[22%] text-[10px] font-medium text-success">
            Approved
          </span>
          <span className="pointer-events-none absolute -right-14 top-[64%] text-[10px] font-medium text-destructive">
            Rejected
          </span>
        </>
      )}
      {hasSource && !branching && <Handle type="source" position={Position.Right} />}
    </div>
  );
}

export const BaseNode = memo(BaseNodeInner);

export function makeNode(
  accent: Props["accent"],
  label: string,
  icon: ReactNode,
  opts: {
    hasTarget?: boolean;
    hasSource?: boolean;
    branching?: boolean;
    subtitle?: (d: any) => string | undefined;
    badge?: (d: any) => string | undefined;
  } = {}
) {
  const Comp = (props: NodeProps) => (
    <BaseNode
      id={props.id}
      selected={props.selected}
      icon={icon}
      label={label}
      accent={accent}
      title={(props.data as any)?.title}
      subtitle={opts.subtitle?.(props.data)}
      badge={opts.badge?.(props.data)}
      hasTarget={opts.hasTarget}
      hasSource={opts.hasSource}
      branching={opts.branching}
    />
  );
  Comp.displayName = `Node(${label})`;
  return memo(Comp);
}
