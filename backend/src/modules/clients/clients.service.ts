import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { logActivity } from "../../lib/activityLog";
import { CreateClientInput, UpdateClientInput } from "./clients.schema";

export function listClients() {
  return prisma.client.findMany({ orderBy: { name: "asc" } });
}

export async function getClient(id: string) {
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new ApiError(404, "Client not found");
  return client;
}

export async function createClient(input: CreateClientInput, createdById: string) {
  const client = await prisma.client.create({ data: { ...input, createdById } });
  await logActivity({
    userId: createdById,
    entityType: "client",
    entityId: client.id,
    action: "created",
    message: `Client ${client.name} was added`,
  });
  return client;
}

export async function updateClient(id: string, input: UpdateClientInput) {
  await getClient(id);
  return prisma.client.update({ where: { id }, data: input });
}

export async function deleteClient(id: string) {
  await getClient(id);
  await prisma.client.delete({ where: { id } });
}
