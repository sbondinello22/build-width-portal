import { api } from "./client";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID";

export interface InvoiceLineItem {
  id: string;
  description: string;
  hours: string;
  rate: string;
  amount: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  tax: string;
  total: string;
  amountPaid: string;
  client: { id: string; name: string; email: string; company: string | null };
  lineItems?: InvoiceLineItem[];
}

export async function listInvoices() {
  const { data } = await api.get<{ invoices: Invoice[] }>("/invoices");
  return data.invoices;
}

export async function getInvoice(id: string) {
  const { data } = await api.get<{ invoice: Invoice }>(`/invoices/${id}`);
  return data.invoice;
}

export async function generateInvoice(input: { clientId: string; timeEntryIds: string[] }) {
  const { data } = await api.post<{ invoice: Invoice }>("/invoices/generate", input);
  return data.invoice;
}

export async function sendInvoice(id: string) {
  const { data } = await api.post<{ invoice: Invoice }>(`/invoices/${id}/send`);
  return data.invoice;
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const { data } = await api.patch<{ invoice: Invoice }>(`/invoices/${id}/status`, { status });
  return data.invoice;
}

export async function duplicateInvoice(id: string) {
  const { data } = await api.post<{ invoice: Invoice }>(`/invoices/${id}/duplicate`);
  return data.invoice;
}

export async function updateInvoice(id: string, input: { dueDate?: string; tax?: number; notes?: string }) {
  const { data } = await api.patch<{ invoice: Invoice }>(`/invoices/${id}`, input);
  return data.invoice;
}

export async function deleteInvoice(id: string) {
  await api.delete(`/invoices/${id}`);
}

export function invoicePdfUrl(id: string) {
  return `${api.defaults.baseURL}/invoices/${id}/pdf`;
}
