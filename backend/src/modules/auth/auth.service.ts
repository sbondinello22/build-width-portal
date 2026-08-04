import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { comparePassword, hashPassword } from "../../lib/password";
import {
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";
import { LoginInput, RegisterInput } from "./auth.schema";

async function issueTokenPair(userId: string, role: import("@prisma/client").Role) {
  const accessToken = signAccessToken(userId, role);
  const { token: refreshToken, jti } = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId,
      tokenHash: jti,
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: "EMPLOYEE" },
  });

  const tokens = await issueTokenPair(user.id, user.role);
  return { user, ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.active) {
    throw new ApiError(401, "Invalid email or password");
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const tokens = await issueTokenPair(user.id, user.role);
  return { user, ...tokens };
}

export async function refresh(refreshCookie: string | undefined) {
  if (!refreshCookie) {
    throw new ApiError(401, "Not authenticated");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshCookie);
  } catch {
    throw new ApiError(401, "Invalid or expired session");
  }

  const record = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!record || record.revokedAt || record.userId !== payload.sub || record.expiresAt < new Date()) {
    throw new ApiError(401, "Invalid or expired session");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) {
    throw new ApiError(401, "Invalid or expired session");
  }

  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

  const tokens = await issueTokenPair(user.id, user.role);
  return { user, ...tokens };
}

export async function logout(refreshCookie: string | undefined) {
  if (!refreshCookie) return;
  try {
    const payload = verifyRefreshToken(refreshCookie);
    await prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // ignore invalid tokens on logout
  }
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}
