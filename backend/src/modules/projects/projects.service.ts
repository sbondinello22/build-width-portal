import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { CreateProjectInput, UpdateProjectInput } from "./projects.schema";

export function listProjectsForClient(clientId: string) {
  return prisma.project.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } });
}

export async function getProject(id: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new ApiError(404, "Project not found");
  return project;
}

export async function createProjectForClient(clientId: string, input: CreateProjectInput) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new ApiError(404, "Client not found");
  return prisma.project.create({ data: { ...input, clientId } });
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  await getProject(id);
  return prisma.project.update({ where: { id }, data: input });
}

export async function deleteProject(id: string) {
  await getProject(id);
  await prisma.project.delete({ where: { id } });
}
