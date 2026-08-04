import { api } from "./client";

export async function createCheckoutSession(invoiceId: string) {
  const { data } = await api.post<{ url: string }>(`/invoices/${invoiceId}/checkout-session`);
  return data.url;
}
