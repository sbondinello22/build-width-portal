import { api } from "./client";

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  reminderAt: string | null;
  reminderSentAt: string | null;
  createdBy: { id: string; name: string };
}

export interface ScheduleEventInput {
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  reminderAt?: string;
}

export async function listEvents(from: Date, to: Date) {
  const { data } = await api.get<{ events: ScheduleEvent[] }>("/schedule", {
    params: { from: from.toISOString(), to: to.toISOString() },
  });
  return data.events;
}

export async function createEvent(input: ScheduleEventInput) {
  const { data } = await api.post<{ event: ScheduleEvent }>("/schedule", input);
  return data.event;
}

export async function updateEvent(id: string, input: Partial<ScheduleEventInput>) {
  const { data } = await api.patch<{ event: ScheduleEvent }>(`/schedule/${id}`, input);
  return data.event;
}

export async function deleteEvent(id: string) {
  await api.delete(`/schedule/${id}`);
}
