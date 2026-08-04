import { api } from "./client";

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  hourlyRate: string;
  notes: string | null;
  createdAt: string;
}

export interface ClientInput {
  name: string;
  email: string;
  company?: string;
  hourlyRate: number;
  notes?: string;
}

export async function listClients() {
  const { data } = await api.get<{ clients: Client[] }>("/clients");
  return data.clients;
}

export async function getClient(id: string) {
  const { data } = await api.get<{ client: Client }>(`/clients/${id}`);
  return data.client;
}

export async function createClient(input: ClientInput) {
  const { data } = await api.post<{ client: Client }>("/clients", input);
  return data.client;
}

export async function updateClient(id: string, input: Partial<ClientInput>) {
  const { data } = await api.patch<{ client: Client }>(`/clients/${id}`, input);
  return data.client;
}

export async function deleteClient(id: string) {
  await api.delete(`/clients/${id}`);
}
