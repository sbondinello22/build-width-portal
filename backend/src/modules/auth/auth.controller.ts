import { Request, Response } from "express";
import * as authService from "./auth.service";
import { setAuthCookies, clearAuthCookies } from "./auth.cookies";

function toPublicUser(user: { id: string; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function registerHandler(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(201).json({ user: toPublicUser(user) });
}

export async function loginHandler(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ user: toPublicUser(user) });
}

export async function refreshHandler(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.refresh(req.cookies?.refreshToken);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ user: toPublicUser(user) });
}

export async function logoutHandler(req: Request, res: Response) {
  await authService.logout(req.cookies?.refreshToken);
  clearAuthCookies(res);
  res.status(204).send();
}

export async function meHandler(req: Request, res: Response) {
  const user = await authService.getUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: toPublicUser(user) });
}
