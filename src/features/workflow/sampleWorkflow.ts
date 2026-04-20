import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export type WorkflowTemplate = {
  id: string;
  label: string;
  description: string;
  build: () => { workflowName: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] };
};

export function sampleOnboardingWorkflow(): { workflowName: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const nodes: WorkflowNode[] = [
    {
      id: "start_1", type: "start", position: { x: 40, y: 200 },
      data: { kind: "start", title: "New hire created", metadata: [{ key: "trigger", value: "HRIS event" }] } as any,
    },
    {
      id: "task_1", type: "task", position: { x: 320, y: 80 },
      data: { kind: "task", title: "Collect ID documents", description: "Passport, address proof, tax info", assignee: "Riya (HR)", dueDate: "", metadata: [] } as any,
    },
    {
      id: "automated_1", type: "automated", position: { x: 320, y: 320 },
      data: { kind: "automated", title: "Send welcome email", actionId: "send_email", params: { to: "{{employee.email}}", subject: "Welcome aboard!", body: "We're excited to have you." } } as any,
    },
    {
      id: "approval_1", type: "approval", position: { x: 640, y: 200 },
      data: { kind: "approval", title: "Manager approval", approverRole: "Manager", threshold: 80 } as any,
    },
    {
      id: "automated_2", type: "automated", position: { x: 940, y: 200 },
      data: { kind: "automated", title: "Provision accounts", actionId: "create_ticket", params: { title: "Provision new hire accounts", priority: "high" } } as any,
    },
    {
      id: "end_1", type: "end", position: { x: 1240, y: 200 },
      data: { kind: "end", title: "Onboarding complete", message: "Employee onboarded successfully", includeSummary: true } as any,
    },
  ];

  const edges: WorkflowEdge[] = [
    { id: "e1", source: "start_1", target: "task_1", animated: true, type: "smoothstep" },
    { id: "e2", source: "start_1", target: "automated_1", animated: true, type: "smoothstep" },
    { id: "e3", source: "task_1", target: "approval_1", animated: true, type: "smoothstep" },
    { id: "e4", source: "automated_1", target: "approval_1", animated: true, type: "smoothstep" },
    { id: "e5", source: "approval_1", sourceHandle: "approved", target: "automated_2", animated: true, type: "smoothstep", label: "Approved", data: { branch: "approved" } },
    { id: "e6", source: "approval_1", sourceHandle: "rejected", target: "end_1", animated: true, type: "smoothstep", label: "Rejected", data: { branch: "rejected" } },
    { id: "e7", source: "automated_2", target: "end_1", animated: true, type: "smoothstep" },
  ];

  return { workflowName: "Employee Onboarding", nodes, edges };
}

export function leaveApprovalWorkflow(): { workflowName: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const nodes: WorkflowNode[] = [
    { id: "start_1", type: "start", position: { x: 40, y: 200 }, data: { kind: "start", title: "Leave request submitted", metadata: [{ key: "trigger", value: "Employee form" }] } as any },
    { id: "task_1", type: "task", position: { x: 340, y: 200 }, data: { kind: "task", title: "Review leave balance", description: "Check accrued PTO and policy", assignee: "HR Ops", dueDate: "", metadata: [] } as any },
    { id: "approval_1", type: "approval", position: { x: 660, y: 200 }, data: { kind: "approval", title: "Manager approval", approverRole: "Manager", threshold: 70 } as any },
    { id: "automated_1", type: "automated", position: { x: 980, y: 100 }, data: { kind: "automated", title: "Notify employee — approved", actionId: "send_email", params: { to: "{{employee.email}}", subject: "Leave approved", body: "Your leave has been approved." } } as any },
    { id: "automated_2", type: "automated", position: { x: 980, y: 320 }, data: { kind: "automated", title: "Notify employee — rejected", actionId: "send_email", params: { to: "{{employee.email}}", subject: "Leave declined", body: "Please contact your manager." } } as any },
    { id: "end_1", type: "end", position: { x: 1300, y: 200 }, data: { kind: "end", title: "Request closed", message: "Leave request processed", includeSummary: true } as any },
  ];
  const edges: WorkflowEdge[] = [
    { id: "e1", source: "start_1", target: "task_1", animated: true, type: "smoothstep" },
    { id: "e2", source: "task_1", target: "approval_1", animated: true, type: "smoothstep" },
    { id: "e3", source: "approval_1", sourceHandle: "approved", target: "automated_1", animated: true, type: "smoothstep", label: "Approved", data: { branch: "approved" } },
    { id: "e4", source: "approval_1", sourceHandle: "rejected", target: "automated_2", animated: true, type: "smoothstep", label: "Rejected", data: { branch: "rejected" } },
    { id: "e5", source: "automated_1", target: "end_1", animated: true, type: "smoothstep" },
    { id: "e6", source: "automated_2", target: "end_1", animated: true, type: "smoothstep" },
  ];
  return { workflowName: "Leave Approval", nodes, edges };
}

export function documentVerificationWorkflow(): { workflowName: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const nodes: WorkflowNode[] = [
    { id: "start_1", type: "start", position: { x: 40, y: 200 }, data: { kind: "start", title: "Documents uploaded", metadata: [] } as any },
    { id: "automated_1", type: "automated", position: { x: 320, y: 200 }, data: { kind: "automated", title: "Run OCR & extract fields", actionId: "create_ticket", params: { title: "OCR extraction", priority: "medium" } } as any },
    { id: "task_1", type: "task", position: { x: 640, y: 200 }, data: { kind: "task", title: "Compliance review", description: "Verify against KYC checklist", assignee: "Compliance", dueDate: "", metadata: [] } as any },
    { id: "approval_1", type: "approval", position: { x: 960, y: 200 }, data: { kind: "approval", title: "Director sign-off", approverRole: "Director", threshold: 90 } as any },
    { id: "automated_2", type: "automated", position: { x: 1280, y: 100 }, data: { kind: "automated", title: "Issue verified badge", actionId: "create_ticket", params: { title: "Issue badge", priority: "high" } } as any },
    { id: "end_1", type: "end", position: { x: 1280, y: 320 }, data: { kind: "end", title: "Rejected — request resubmission", message: "Documents need resubmission", includeSummary: false } as any },
    { id: "end_2", type: "end", position: { x: 1600, y: 100 }, data: { kind: "end", title: "Verified", message: "Documents verified", includeSummary: true } as any },
  ];
  const edges: WorkflowEdge[] = [
    { id: "e1", source: "start_1", target: "automated_1", animated: true, type: "smoothstep" },
    { id: "e2", source: "automated_1", target: "task_1", animated: true, type: "smoothstep" },
    { id: "e3", source: "task_1", target: "approval_1", animated: true, type: "smoothstep" },
    { id: "e4", source: "approval_1", sourceHandle: "approved", target: "automated_2", animated: true, type: "smoothstep", label: "Approved", data: { branch: "approved" } },
    { id: "e5", source: "approval_1", sourceHandle: "rejected", target: "end_1", animated: true, type: "smoothstep", label: "Rejected", data: { branch: "rejected" } },
    { id: "e6", source: "automated_2", target: "end_2", animated: true, type: "smoothstep" },
  ];
  return { workflowName: "Document Verification", nodes, edges };
}

export const workflowTemplates: WorkflowTemplate[] = [
  { id: "onboarding", label: "Employee Onboarding", description: "New hire intake → approval → provisioning", build: sampleOnboardingWorkflow },
  { id: "leave", label: "Leave Approval", description: "Leave request with branching approval", build: leaveApprovalWorkflow },
  { id: "docs", label: "Document Verification", description: "OCR → compliance → director sign-off", build: documentVerificationWorkflow },
];
