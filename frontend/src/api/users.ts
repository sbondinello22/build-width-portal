import { api } from "./client";
import type { Role } from "./auth";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export async function listUsers() {
  const { data } = await api.get<{ users: ManagedUser[] }>("/users");
  return data.users;
}

export async function createUser(input: CreateUserInput) {
  const { data } = await api.post<{ user: ManagedUser }>("/users", input);
  return data.user;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}
