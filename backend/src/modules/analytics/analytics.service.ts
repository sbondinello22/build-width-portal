import { prisma } from "../../config/prisma";

export type GroupBy = "day" | "week" | "month";

interface TimeSeriesParams {
  groupBy: GroupBy;
  projectId?: string;
  clientId?: string;
  from?: Date;
  to?: Date;
}

function truncateToPeriod(date: Date, groupBy: GroupBy): Date {
  const d = new Date(date);
  if (groupBy === "month") {
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  if (groupBy === "week") {
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getHoursTimeSeries(params: TimeSeriesParams) {
  const where: Record<string, unknown> = { durationMinutes: { not: null } };
  if (params.projectId) where.projectId = params.projectId;
  if (params.clientId) where.project = { clientId: params.clientId };
  if (params.from || params.to) {
    where.startedAt = {
      ...(params.from ? { gte: params.from } : {}),
      ...(params.to ? { lte: params.to } : {}),
    };
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    select: { startedAt: true, durationMinutes: true, billable: true },
  });

  const buckets = new Map<string, { hours: number; billableHours: number; nonBillableHours: number }>();
  for (const entry of entries) {
    const periodStart = truncateToPeriod(entry.startedAt, params.groupBy).toISOString();
    const hours = (entry.durationMinutes ?? 0) / 60;
    const bucket = buckets.get(periodStart) ?? { hours: 0, billableHours: 0, nonBillableHours: 0 };
    bucket.hours += hours;
    if (entry.billable) bucket.billableHours += hours;
    else bucket.nonBillableHours += hours;
    buckets.set(periodStart, bucket);
  }

  return Array.from(buckets.entries())
    .map(([periodStart, b]) => ({
      periodStart,
      hours: Math.round(b.hours * 100) / 100,
      billableHours: Math.round(b.billableHours * 100) / 100,
      nonBillableHours: Math.round(b.nonBillableHours * 100) / 100,
    }))
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart));
}

export async function getProjectAnalytics(params: { clientId?: string }) {
  const projects = await prisma.project.findMany({
    where: params.clientId ? { clientId: params.clientId } : undefined,
    include: {
      client: { select: { id: true, name: true } },
      timeEntries: { select: { durationMinutes: true, billable: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return projects.map((project) => {
    let hoursLogged = 0;
    let billableHours = 0;
    let nonBillableHours = 0;
    for (const entry of project.timeEntries) {
      const hours = (entry.durationMinutes ?? 0) / 60;
      hoursLogged += hours;
      if (entry.billable) billableHours += hours;
      else nonBillableHours += hours;
    }

    const rate = Number(project.rate);
    const budgetHours = project.budgetHours !== null ? Number(project.budgetHours) : null;
    const hoursRemaining = budgetHours !== null ? Math.round((budgetHours - hoursLogged) * 100) / 100 : null;
    const percentUsed =
      budgetHours !== null && budgetHours > 0 ? Math.min(100, Math.round((hoursLogged / budgetHours) * 100)) : null;

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      clientId: project.client.id,
      clientName: project.client.name,
      rate,
      budgetHours,
      hoursLogged: Math.round(hoursLogged * 100) / 100,
      hoursRemaining,
      percentUsed,
      billableHours: Math.round(billableHours * 100) / 100,
      billableAmount: Math.round(billableHours * rate * 100) / 100,
      nonBillableHours: Math.round(nonBillableHours * 100) / 100,
      nonBillableAmount: Math.round(nonBillableHours * rate * 100) / 100,
    };
  });
}
