import { api } from "./client";

export interface AppSettings {
  id: string;
  defaultPaymentTermsDays: number;
  defaultTaxRate: string;
  invoiceNumberPrefix: string;
  overdueReminderIntervalDays: number;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  defaultPaymentTermsDays?: number;
  defaultTaxRate?: number;
  invoiceNumberPrefix?: string;
  overdueReminderIntervalDays?: number;
}

export async function getSettings() {
  const { data } = await api.get<{ settings: AppSettings }>("/settings");
  return data.settings;
}

export async function updateSettings(input: UpdateSettingsInput) {
  const { data } = await api.patch<{ settings: AppSettings }>("/settings", input);
  return data.settings;
}

export interface PaymentsStatus {
  stripeConfigured: boolean;
  stripeMode: "live" | "test" | null;
  paypalConfigured: boolean;
}

export async function getPaymentsStatus() {
  const { data } = await api.get<PaymentsStatus>("/settings/payments-status");
  return data;
}
