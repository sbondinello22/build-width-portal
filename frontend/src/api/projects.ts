import { api } from "./client";

export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  rate: string;
  budgetHours: string | null;
  createdAt: string;
}

export interface ProjectInput {
  name: string;
  description?: string;
  rate: number;
  budgetHours?: number;
  status?: ProjectStatus;
}

export async function listProjectsForClient(clientId: string) {
  const { data } = await api.get<{ projects: Project[] }>(`/clients/${clientId}/projects`);
  return data.projects;
}

export async function getProject(id: string) {
  const { data } = await api.get<{ project: Project }>(`/projects/${id}`);
  return data.project;
}

export async function createProjectForClient(clientId: string, input: ProjectInput) {
  const { data } = await api.post<{ project: Project }>(`/clients/${clientId}/projects`, input);
  return data.project;
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
  const { data } = await api.patch<{ project: Project }>(`/projects/${id}`, input);
  return data.project;
}

export async function deleteProject(id: string) {
  await api.delete(`/projects/${id}`);
}
