import type { Node, Edge } from "reactflow";

export type NodeType = "start" | "task" | "approval" | "automated" | "end" | "group";

export type GroupData = {
  kind: "group";
  label: string;
  collapsed: boolean;
  width: number;
  height: number;
  childCount: number;
};

export type KV = { key: string; value: string };

export type StartData = { title: string; metadata: KV[] };
export type TaskData = {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  metadata: KV[];
};
export type ApprovalData = {
  title: string;
  approverRole: "Manager" | "HR" | "Director" | "CEO" | "";
  threshold: number;
};
export type AutomatedData = {
  title: string;
  actionId: string;
  params: Record<string, string>;
};
export type EndData = { title: string; message: string; includeSummary: boolean };

export type WorkflowNodeData =
  | ({ kind: "start" } & StartData)
  | ({ kind: "task" } & TaskData)
  | ({ kind: "approval" } & ApprovalData)
  | ({ kind: "automated" } & AutomatedData)
  | ({ kind: "end" } & EndData)
  | GroupData;

export type WorkflowNode = Node<WorkflowNodeData, NodeType>;
export type WorkflowEdge = Edge;

export type SimulationLog = {
  id: string;
  nodeId?: string;
  nodeType?: NodeType;
  message: string;
  status: "info" | "success" | "warning" | "error";
  timestamp: number;
};

export type ValidationError = {
  nodeId?: string;
  message: string;
  severity: "error" | "warning";
};

export type Automation = {
  id: string;
  label: string;
  description: string;
  params: { name: string; type: "text" | "textarea" | "number" | "email"; label: string; required?: boolean }[];
};
