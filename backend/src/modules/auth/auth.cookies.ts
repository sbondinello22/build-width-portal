import { Response } from "express";
import { env } from "../../config/env";

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const base = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax" as const,
  };
  res.cookie("accessToken", accessToken, { ...base, maxAge: ACCESS_MAX_AGE_MS });
  res.cookie("refreshToken", refreshToken, { ...base, maxAge: REFRESH_MAX_AGE_MS, path: "/api/auth" });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/auth" });
}
