import { prisma } from "../../config/prisma";

interface RequestingUser {
  id: string;
  role: "ADMIN" | "EMPLOYEE";
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

  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      startedAt: { gte: startOfMonth },
      ...(requester.role === "EMPLOYEE" ? { userId: requester.id } : {}),
    },
    select: { durationMinutes: true },
  });
  const hoursThisMonth =
    Math.round((timeEntries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0) / 60) * 100) / 100;

  return {
    outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    overdueCount: overdueInvoices.length,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    hoursThisMonth,
  };
}

export async function getActivity(page: number, pageSize = 20) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}
