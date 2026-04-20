import { Play, ListChecks, ShieldCheck, Zap, Flag } from "lucide-react";
import { makeNode } from "./BaseNode";
import { GroupNode } from "./GroupNode";

export const StartNode = makeNode("start", "Start", <Play className="h-4 w-4" />, { hasTarget: false });
export const TaskNode = makeNode("task", "Task", <ListChecks className="h-4 w-4" />, {
  subtitle: (d) => d?.assignee ? `Assignee: ${d.assignee}` : undefined,
  badge: (d) => d?.dueDate ? `Due ${d.dueDate}` : undefined,
});
export const ApprovalNode = makeNode("approval", "Approval", <ShieldCheck className="h-4 w-4" />, {
  branching: true,
  subtitle: (d) => d?.approverRole ? `By ${d.approverRole}` : undefined,
  badge: (d) => typeof d?.threshold === "number" ? `${d.threshold}%` : undefined,
});
export const AutomatedNode = makeNode("automated", "Automated", <Zap className="h-4 w-4" />, {
  subtitle: (d) => d?.actionId ? `Action: ${d.actionId}` : undefined,
});
export const EndNode = makeNode("end", "End", <Flag className="h-4 w-4" />, { hasSource: false });

export const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  automated: AutomatedNode,
  end: EndNode,
  group: GroupNode,
};
