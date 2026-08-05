import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listInvoices } from "../api/invoices";
import { InvoicesSubNav } from "../components/layout/InvoicesSubNav";
import { statusStyles } from "../lib/invoiceDisplay";

function formatCurrency(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DraftInvoicesPage() {
  const { data: invoices, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: listInvoices });
  const drafts = (invoices ?? []).filter((inv) => inv.status === "DRAFT");
  const totalDraft = drafts.reduce((sum, inv) => sum + Number(inv.total), 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[var(--text-primary)]">Invoices</h1>
      <InvoicesSubNav />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Draft Invoices</h2>
          <p className="text-sm text-[var(--text-secondary)]">Invoices that haven't been sent to the client yet.</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-right">
          <div className="text-xs text-[var(--text-muted)]">Total Draft</div>
          <div className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(totalDraft)}</div>
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
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3">
                    <Link to={`/invoices/${invoice.id}`} className="font-medium text-[var(--text-primary)] hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{invoice.client.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">${invoice.total}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
              {drafts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--text-muted)]">
                    No draft invoices.
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
