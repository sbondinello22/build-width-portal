import { prisma } from "../../config/prisma";

interface RequestingUser {
  id: string;
  role: "ADMIN" | "EMPLOYEE";
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function sumBillableHours(requester: RequestingUser, since: Date): Promise<number> {
  const entries = await prisma.timeEntry.findMany({
    where: {
      startedAt: { gte: since },
      billable: true,
      ...(requester.role === "EMPLOYEE" ? { userId: requester.id } : {}),
    },
    select: { durationMinutes: true },
  });
  return Math.round((entries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0) / 60) * 100) / 100;
}

export async function getSummary(requester: RequestingUser) {
  const outstandingInvoices = await prisma.invoice.findMany({
    where: { status: { in: ["SENT", "OVERDUE"] } },
    select: { total: true, amountPaid: true, status: true },
  });
  const outstandingBalance = outstandingInvoices.reduce(
    (sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)),
    0
  );
  const overdueInvoices = outstandingInvoices.filter((inv) => inv.status === "OVERDUE");
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)), 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [billableHoursThisMonth, billableHoursThisWeek] = await Promise.all([
    sumBillableHours(requester, startOfMonth),
    sumBillableHours(requester, startOfWeek(new Date())),
  ]);

  return {
    outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    overdueCount: overdueInvoices.length,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    billableHoursThisMonth,
    billableHoursThisWeek,
  };
}

export async function getActivity(page: number, pageSize = 20) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}
