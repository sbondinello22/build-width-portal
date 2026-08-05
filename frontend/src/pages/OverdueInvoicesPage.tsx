import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listInvoices } from "../api/invoices";
import { InvoicesSubNav } from "../components/layout/InvoicesSubNav";
import { statusStyles } from "../lib/invoiceDisplay";

function daysOverdue(dueDate: string): number {
  const diff = Date.now() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OverdueInvoicesPage() {
  const { data: invoices, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: listInvoices });
  const overdue = (invoices ?? []).filter((inv) => inv.status === "OVERDUE");
  const totalOverdue = overdue.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid || 0)), 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[var(--text-primary)]">Invoices</h1>
      <InvoicesSubNav />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Overdue Invoices</h2>
          <p className="text-sm text-[var(--text-secondary)]">Sent invoices that are past their due date.</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-right">
          <div className="text-xs text-[var(--text-muted)]">Total Overdue</div>
          <div className="text-lg font-bold text-red-500">{formatCurrency(totalOverdue)}</div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Days Overdue</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3">
                    <Link to={`/invoices/${invoice.id}`} className="font-medium text-[var(--text-primary)] hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{invoice.client.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-red-500">{daysOverdue(invoice.dueDate)}d</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">${invoice.total}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
              {overdue.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[var(--text-muted)]">
                    No overdue invoices.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
