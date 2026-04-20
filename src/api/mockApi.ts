import type { Automation, SimulationLog, WorkflowNode, WorkflowEdge } from "@/types/workflow";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const AUTOMATIONS: Automation[] = [
  {
    id: "send_email",
    label: "Send Email",
    description: "Send a templated email to a recipient",
    params: [
      { name: "to", type: "email", label: "Recipient", required: true },
      { name: "subject", type: "text", label: "Subject", required: true },
      { name: "body", type: "textarea", label: "Body" },
    ],
  },
  {
    id: "generate_doc",
    label: "Generate Document",
    description: "Generate a document from a template",
    params: [
      { name: "template", type: "text", label: "Template name", required: true },
      { name: "recipient", type: "text", label: "Recipient name", required: true },
    ],
  },
  {
    id: "slack_notify",
    label: "Slack Notification",
    description: "Post a message to a Slack channel",
    params: [
      { name: "channel", type: "text", label: "Channel", required: true },
      { name: "message", type: "textarea", label: "Message", required: true },
    ],
  },
  {
    id: "create_ticket",
    label: "Create Ticket",
    description: "Create a ticket in the helpdesk",
    params: [
      { name: "title", type: "text", label: "Title", required: true },
      { name: "priority", type: "text", label: "Priority (low/med/high)" },
    ],
  },
  {
    id: "schedule_meeting",
    label: "Schedule Meeting",
    description: "Schedule a calendar meeting",
    params: [
      { name: "attendees", type: "text", label: "Attendees (comma separated)", required: true },
      { name: "duration", type: "number", label: "Duration (min)", required: true },
    ],
  },
];

export async function getAutomations(): Promise<Automation[]> {
  await delay(220);
  return AUTOMATIONS;
}

export async function simulateWorkflow(payload: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}): Promise<SimulationLog[]> {
  await delay(300);
  const { nodes, edges } = payload;
  const start = nodes.find((n) => n.type === "start");
  const logs: SimulationLog[] = [];
  const now = Date.now();
  let i = 0;
  const stamp = () => now + i++ * 120;

  if (!start) {
    logs.push({ id: crypto.randomUUID(), message: "No Start node found — workflow cannot run.", status: "error", timestamp: stamp() });
    return logs;
  }

  logs.push({ id: crypto.randomUUID(), message: "▶ Workflow execution started", status: "info", timestamp: stamp() });

  const adj = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  });

  const visited = new Set<string>();
  const queue: string[] = [start.id];

  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodes.find((n) => n.id === id);
    if (!node) continue;

    const d: any = node.data;
    const title = d?.title || node.type;
    switch (node.type) {
      case "start":
        logs.push({ id: crypto.randomUUID(), nodeId: id, nodeType: "start", message: `✓ Start: "${title}" — workflow initialized`, status: "success", timestamp: stamp() });
        break;
      case "task":
        logs.push({
          id: crypto.randomUUID(), nodeId: id, nodeType: "task",
          message: `📋 Task "${title}" assigned to ${d.assignee || "unassigned"}${d.dueDate ? ` (due ${d.dueDate})` : ""}`,
          status: d.assignee ? "success" : "warning", timestamp: stamp(),
        });
        break;
      case "approval": {
        const auto = (d.threshold ?? 0) >= 80;
        const decision = auto ? "approved" : "rejected";
        logs.push({
          id: crypto.randomUUID(), nodeId: id, nodeType: "approval",
          message: `🛡 Approval "${title}" — ${d.approverRole || "approver"} ${auto ? `auto-approved (threshold ${d.threshold}%) → following Approved branch` : `review required → following Rejected branch`}`,
          status: d.approverRole ? "success" : "warning", timestamp: stamp(),
        });
        const outgoing = edges.filter((e) => e.source === id);
        const matched = outgoing.filter(
          (e) =>
            (e.data as any)?.branch === decision ||
            (typeof e.label === "string" && e.label.toLowerCase() === decision)
        );
        const followed = matched.length > 0 ? matched : outgoing;
        followed.forEach((e) => queue.push(e.target));
        continue;
      }
      case "automated": {
        const action = AUTOMATIONS.find((a) => a.id === d.actionId);
        if (!action) {
          logs.push({ id: crypto.randomUUID(), nodeId: id, nodeType: "automated", message: `⚠ Automated "${title}" has no action selected`, status: "error", timestamp: stamp() });
        } else {
          const summary = action.params.map((p) => `${p.name}=${d.params?.[p.name] ?? "—"}`).join(", ");
          logs.push({ id: crypto.randomUUID(), nodeId: id, nodeType: "automated", message: `⚡ ${action.label} dispatched (${summary})`, status: "success", timestamp: stamp() });
        }
        break;
      }
      case "end":
        logs.push({ id: crypto.randomUUID(), nodeId: id, nodeType: "end", message: `🏁 End: ${d.message || "Workflow completed"}`, status: "success", timestamp: stamp() });
        break;
    }
    (adj.get(id) || []).forEach((next) => queue.push(next));
  }

  const orphans = nodes.filter((n) => !visited.has(n.id) && n.type !== "group");
  if (orphans.length) {
    logs.push({
      id: crypto.randomUUID(),
      message: `⚠ ${orphans.length} unreachable node(s) skipped: ${orphans.map((o) => (o.data as any)?.title || (o.data as any)?.label || o.type).join(", ")}`,
      status: "warning", timestamp: stamp(),
    });
  }
  logs.push({ id: crypto.randomUUID(), message: "■ Workflow simulation complete", status: "info", timestamp: stamp() });
  return logs;
}
