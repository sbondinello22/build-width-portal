import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteInvoice, listInvoices, updateInvoice } from "../api/invoices";
import type { Invoice } from "../api/invoices";
import { InvoicesSubNav } from "../components/layout/InvoicesSubNav";
import { statusStyles } from "../lib/invoiceDisplay";
import { Modal } from "../components/ui/Modal";
import { FormField } from "../components/ui/FormField";

function formatCurrency(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toDateInputValue(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function EditInvoiceModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [dueDate, setDueDate] = useState(toDateInputValue(invoice.dueDate));
  const [tax, setTax] = useState(String(invoice.tax));
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () => updateInvoice(invoice.id, { dueDate, tax: Number(tax), notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onClose();
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Modal title={`Edit ${invoice.invoiceNumber}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Due Date" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <FormField
          label="Tax ($)"
          type="number"
          min="0"
          step="0.01"
          required
          value={tax}
          onChange={(e) => setTax(e.target.value)}
        />
        <FormField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 w-full rounded-md bg-[var(--brand-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </Modal>
  );
}

export function DraftInvoicesPage() {
  const queryClient = useQueryClient();
  const { data: invoices, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: listInvoices });
  const drafts = (invoices ?? []).filter((inv) => inv.status === "DRAFT");
  const totalDraft = drafts.reduce((sum, inv) => sum + Number(inv.total), 0);

  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

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
          <div className="text-xs text-[var(--text-muted)]">Total Drafts</div>
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
                <th className="px-4 py-3 font-medium"></th>
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingInvoice(invoice)}
                        className="text-sm font-medium text-[var(--text-secondary)] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete draft invoice ${invoice.invoiceNumber}? This cannot be undone.`)) {
                            deleteMutation.mutate(invoice.id);
                          }
                        }}
                        className="text-sm font-medium text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {drafts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[var(--text-muted)]">
                    No draft invoices.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingInvoice && <EditInvoiceModal invoice={editingInvoice} onClose={() => setEditingInvoice(null)} />}
    </div>
  );
}
