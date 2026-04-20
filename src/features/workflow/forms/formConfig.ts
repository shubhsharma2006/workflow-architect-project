import type { NodeType } from "@/types/workflow";

export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "toggle" | "keyValueList" | "dynamicAction";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  helper?: string;
};

export const formConfig: Record<NodeType, FieldConfig[]> = {
  group: [],
  start: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Onboarding kicks off" },
    { name: "metadata", label: "Metadata", type: "keyValueList", helper: "Optional context attached to the workflow run" },
  ],
  task: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Collect ID documents" },
    { name: "description", label: "Description", type: "textarea", placeholder: "What needs to be done?" },
    { name: "assignee", label: "Assignee", type: "text", placeholder: "Name or role" },
    { name: "dueDate", label: "Due date", type: "date" },
    { name: "metadata", label: "Custom fields", type: "keyValueList" },
  ],
  approval: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Manager approval" },
    {
      name: "approverRole", label: "Approver role", type: "select", required: true,
      options: [
        { value: "Manager", label: "Manager" },
        { value: "HR", label: "HR" },
        { value: "Director", label: "Director" },
        { value: "CEO", label: "CEO" },
      ],
    },
    { name: "threshold", label: "Auto-approve threshold (%)", type: "number", helper: "Approvals at or above this score auto-approve" },
  ],
  automated: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Send welcome email" },
    { name: "actionId", label: "Action", type: "dynamicAction", required: true, helper: "Action params load dynamically from the API" },
  ],
  end: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "message", label: "Completion message", type: "textarea", placeholder: "Workflow completed" },
    { name: "includeSummary", label: "Include run summary", type: "toggle" },
  ],
};
