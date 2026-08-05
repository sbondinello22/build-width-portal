import type { InvoiceStatus } from "../api/invoices";

export const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: "bg-[var(--surface-2)] text-[var(--text-secondary)]",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  VOID: "bg-[var(--surface-2)] text-[var(--text-muted)]",
};

export const openStatuses: InvoiceStatus[] = ["DRAFT", "SENT", "OVERDUE"];
export const closedStatuses: InvoiceStatus[] = ["PAID", "VOID"];
export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
