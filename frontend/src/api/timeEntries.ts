import { api } from "./client";

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  description: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  billable: boolean;
  billed: boolean;
}

export interface TimeEntryInput {
  description?: string;
  startedAt?: string;
  endedAt?: string;
  billable?: boolean;
}

export async function listTimeEntriesForProject(projectId: string) {
  const { data } = await api.get<{ timeEntries: TimeEntry[] }>(`/projects/${projectId}/time-entries`);
  return data.timeEntries;
}

export async function createTimeEntryForProject(projectId: string, input: TimeEntryInput) {
  const { data } = await api.post<{ timeEntry: TimeEntry }>(`/projects/${projectId}/time-entries`, input);
  return data.timeEntry;
}

export async function updateTimeEntry(id: string, input: Partial<TimeEntryInput>) {
  const { data } = await api.patch<{ timeEntry: TimeEntry }>(`/time-entries/${id}`, input);
  return data.timeEntry;
}

export async function stopTimeEntry(id: string) {
  const { data } = await api.post<{ timeEntry: TimeEntry }>(`/time-entries/${id}/stop`);
  return data.timeEntry;
}

export async function deleteTimeEntry(id: string) {
  await api.delete(`/time-entries/${id}`);
}
