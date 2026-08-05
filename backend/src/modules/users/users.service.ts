import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { hashPassword } from "../../lib/password";
import { CreateUserInput } from "./users.schema";

const userSelect = { id: true, name: true, email: true, role: true, active: true, createdAt: true } as const;

export function listUsers() {
  return prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "asc" } });
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }
  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
    select: userSelect,
  });
}

export async function deactivateUser(id: string, requesterId: string) {
  if (id === requesterId) {
    throw new ApiError(400, "You cannot delete your own account");
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  await prisma.user.update({ where: { id }, data: { active: false } });
}
