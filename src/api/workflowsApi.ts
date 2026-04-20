import { supabase } from "@/integrations/supabase/client";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export type StoredWorkflow = {
  id: string;
  name: string;
  data: { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
  created_at: string;
  updated_at: string;
};

type WorkflowData = { nodes: WorkflowNode[]; edges: WorkflowEdge[] };

export async function listMyWorkflows(): Promise<StoredWorkflow[]> {
  const { data, error } = await supabase
    .from("workflows")
    .select("id, name, data, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StoredWorkflow[];
}

export async function createWorkflow(name: string, data: WorkflowData): Promise<StoredWorkflow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: row, error } = await supabase
    .from("workflows")
    .insert({ name, data: data as any, user_id: user.id })
    .select("id, name, data, created_at, updated_at")
    .single();
  if (error) throw error;
  return row as unknown as StoredWorkflow;
}

export async function updateWorkflow(id: string, name: string, data: WorkflowData): Promise<StoredWorkflow> {
  const { data: row, error } = await supabase
    .from("workflows")
    .update({ name, data: data as any })
    .eq("id", id)
    .select("id, name, data, created_at, updated_at")
    .single();
  if (error) throw error;
  return row as unknown as StoredWorkflow;
}

export async function deleteWorkflow(id: string): Promise<void> {
  const { error } = await supabase.from("workflows").delete().eq("id", id);
  if (error) throw error;
}

export async function getWorkflow(id: string): Promise<StoredWorkflow> {
  const { data, error } = await supabase
    .from("workflows")
    .select("id, name, data, created_at, updated_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as StoredWorkflow;
}
