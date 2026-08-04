import { prisma } from "../config/prisma";

export function logActivity(entry: {
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  message: string;
}) {
  return prisma.activityLog.create({ data: entry });
}
