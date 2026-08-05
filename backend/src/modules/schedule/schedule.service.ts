import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { CreateEventInput, ListEventsQuery, UpdateEventInput } from "./schedule.schema";

const eventInclude = { createdBy: { select: { id: true, name: true } } } as const;

export function listEvents(query: ListEventsQuery) {
  return prisma.scheduleEvent.findMany({
    where: { startAt: { gte: query.from, lte: query.to } },
    include: eventInclude,
    orderBy: { startAt: "asc" },
  });
}

export function createEvent(input: CreateEventInput, createdById: string) {
  return prisma.scheduleEvent.create({
    data: { ...input, createdById },
    include: eventInclude,
  });
}

async function getOwnedEvent(id: string, userId: string) {
  const event = await prisma.scheduleEvent.findUnique({ where: { id } });
  if (!event) throw new ApiError(404, "Event not found");
  if (event.createdById !== userId) throw new ApiError(403, "You can only manage your own schedule events");
  return event;
}

export async function updateEvent(id: string, input: UpdateEventInput, userId: string) {
  await getOwnedEvent(id, userId);
  return prisma.scheduleEvent.update({
    where: { id },
    data: { ...input, reminderSentAt: input.reminderAt !== undefined ? null : undefined },
    include: eventInclude,
  });
}

export async function deleteEvent(id: string, userId: string) {
  await getOwnedEvent(id, userId);
  await prisma.scheduleEvent.delete({ where: { id } });
}
