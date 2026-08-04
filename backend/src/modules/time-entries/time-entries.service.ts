import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { CreateTimeEntryInput, UpdateTimeEntryInput } from "./time-entries.schema";

function durationMinutes(startedAt: Date, endedAt: Date | null): number | null {
  if (!endedAt) return null;
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
}

interface RequestingUser {
  id: string;
  role: "ADMIN" | "EMPLOYEE";
}

export async function listTimeEntriesForProject(projectId: string, requester: RequestingUser) {
  return prisma.timeEntry.findMany({
    where: { projectId, ...(requester.role === "EMPLOYEE" ? { userId: requester.id } : {}) },
    orderBy: { startedAt: "desc" },
  });
}

export async function createTimeEntryForProject(
  projectId: string,
  input: CreateTimeEntryInput,
  requester: RequestingUser
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, "Project not found");

  const startedAt = input.startedAt ?? new Date();
  const endedAt = input.endedAt ?? null;
  if (endedAt && endedAt < startedAt) {
    throw new ApiError(400, "endedAt must be after startedAt");
  }

  return prisma.timeEntry.create({
    data: {
      projectId,
      userId: requester.id,
      description: input.description,
      startedAt,
      endedAt,
      durationMinutes: durationMinutes(startedAt, endedAt),
      billable: input.billable ?? true,
    },
  });
}

async function getOwnedEntry(id: string, requester: RequestingUser) {
  const entry = await prisma.timeEntry.findUnique({ where: { id } });
  if (!entry) throw new ApiError(404, "Time entry not found");
  if (requester.role !== "ADMIN" && entry.userId !== requester.id) {
    throw new ApiError(403, "Forbidden");
  }
  return entry;
}

export async function updateTimeEntry(id: string, input: UpdateTimeEntryInput, requester: RequestingUser) {
  const entry = await getOwnedEntry(id, requester);
  if (entry.billed) {
    throw new ApiError(409, "Cannot edit a time entry that has already been billed");
  }

  const startedAt = input.startedAt ?? entry.startedAt;
  const endedAt = input.endedAt === undefined ? entry.endedAt : input.endedAt;
  if (endedAt && endedAt < startedAt) {
    throw new ApiError(400, "endedAt must be after startedAt");
  }

  return prisma.timeEntry.update({
    where: { id },
    data: {
      description: input.description ?? entry.description,
      startedAt,
      endedAt,
      durationMinutes: durationMinutes(startedAt, endedAt),
      billable: input.billable ?? entry.billable,
    },
  });
}

export async function stopTimeEntry(id: string, requester: RequestingUser) {
  const entry = await getOwnedEntry(id, requester);
  if (entry.endedAt) {
    throw new ApiError(409, "Time entry is already stopped");
  }
  const endedAt = new Date();
  return prisma.timeEntry.update({
    where: { id },
    data: { endedAt, durationMinutes: durationMinutes(entry.startedAt, endedAt) },
  });
}

export async function deleteTimeEntry(id: string, requester: RequestingUser) {
  const entry = await getOwnedEntry(id, requester);
  if (entry.billed) {
    throw new ApiError(409, "Cannot delete a time entry that has already been billed");
  }
  await prisma.timeEntry.delete({ where: { id } });
}
