import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { duplicateInvoice, listInvoices } from "../api/invoices";
import { InvoicesSubNav } from "../components/layout/InvoicesSubNav";
import { statusStyles } from "../lib/invoiceDisplay";

export function RecurringInvoicesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: invoices, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: listInvoices });
  const eligible = (invoices ?? []).filter((inv) => inv.status !== "VOID");

  const repeatMutation = useMutation({
    mutationFn: (id: string) => duplicateInvoice(id),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      navigate(`/invoices/${invoice.id}`);
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[var(--text-primary)]">Invoices</h1>
      <InvoicesSubNav />

      <h2 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">Recurring Invoices</h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Pick a past invoice to repeat — it creates a new draft with the same client and line items.
      </p>

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {eligible.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{invoice.client.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">${invoice.total}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user?.role === "ADMIN" && (
                      <button
                        type="button"
                        onClick={() => repeatMutation.mutate(invoice.id)}
                        disabled={repeatMutation.isPending}
                        className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-50"
                      >
                        Repeat
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {eligible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--text-muted)]">
                    No invoices to repeat yet.
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
