import { api } from "./client";

export type Role = "ADMIN" | "EMPLOYEE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function registerRequest(input: { name: string; email: string; password: string }) {
  const { data } = await api.post<{ user: User }>("/auth/register", input);
  return data.user;
}

export async function loginRequest(input: { email: string; password: string }) {
  const { data } = await api.post<{ user: User }>("/auth/login", input);
  return data.user;
}

export async function logoutRequest() {
  await api.post("/auth/logout");
}

export async function meRequest() {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data.user;
}
