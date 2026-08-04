import { api } from "./client";

export interface DashboardSummary {
  outstandingBalance: number;
  overdueCount: number;
  overdueAmount: number;
  hoursThisMonth: number;
}

export interface ActivityEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  message: string;
  createdAt: string;
}

export async function getDashboardSummary() {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary");
  return data;
}

export async function getDashboardActivity() {
  const { data } = await api.get<{ activity: ActivityEntry[] }>("/dashboard/activity");
  return data.activity;
}
