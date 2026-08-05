import { api } from "./client";

export type GroupBy = "day" | "week" | "month";

export interface HoursSeriesPoint {
  periodStart: string;
  hours: number;
  billableHours: number;
  nonBillableHours: number;
}

export interface ProjectAnalytics {
  id: string;
  name: string;
  status: string;
  clientId: string;
  clientName: string;
  rate: number;
  budgetHours: number | null;
  hoursLogged: number;
  hoursRemaining: number | null;
  percentUsed: number | null;
  billableHours: number;
  billableAmount: number;
  nonBillableHours: number;
  nonBillableAmount: number;
}

export async function getHoursTimeSeries(params: { groupBy: GroupBy; projectId?: string }) {
  const { data } = await api.get<{ series: HoursSeriesPoint[] }>("/analytics/time-series", { params });
  return data.series;
}

export async function getProjectAnalytics() {
  const { data } = await api.get<{ projects: ProjectAnalytics[] }>("/analytics/projects");
  return data.projects;
}
