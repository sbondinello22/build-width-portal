import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { listClients } from "../api/clients";
import { listProjectsForClient } from "../api/projects";
import { listTimeEntriesForProject } from "../api/timeEntries";
import { generateInvoice, listInvoices } from "../api/invoices";
import type { InvoiceStatus } from "../api/invoices";
import { Modal } from "../components/ui/Modal";

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  VOID: "bg-gray-100 text-gray-400",
};

function GenerateInvoiceModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const { data: projects } = useQuery({
    queryKey: ["clients", clientId, "projects"],
    queryFn: () => listProjectsForClient(clientId),
    enabled: !!clientId,
  });

  const entryQueries = useQueries({
    queries: (projects ?? []).map((project) => ({
      queryKey: ["projects", project.id, "time-entries"],
      queryFn: () => listTimeEntriesForProject(project.id),
      enabled: !!projects,
    })),
  });

  const billableEntries = (projects ?? []).flatMap((project, i) =>
    (entryQueries[i]?.data ?? [])
      .filter((entry) => !entry.billed && entry.endedAt !== null)
      .map((entry) => ({ ...entry, projectName: project.name }))
  );

  const generateMutation = useMutation({
    mutationFn: () => generateInvoice({ clientId, timeEntryIds: Array.from(selected) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onClose();
    },
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal title="Generate Invoice" onClose={onClose}>
      <label className="mb-4 block text-sm">
        <span className="mb-1 block font-medium text-gray-700">Client</span>
        <select
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setSelected(new Set());
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        >
          <option value="">Select a client</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {clientId && (
        <div className="mb-4 max-h-64 overflow-y-auto rounded-md border border-gray-200">
          {billableEntries.length === 0 ? (
            <p className="p-3 text-sm text-gray-400">No unbilled time entries for this client.</p>
          ) : (
            billableEntries.map((entry) => (
              <label key={entry.id} className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm last:border-0">
                <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggle(entry.id)} />
                <span className="flex-1">
                  {entry.projectName} — {entry.description || "(no description)"}
                </span>
                <span className="text-gray-500">{((entry.durationMinutes ?? 0) / 60).toFixed(2)}h</span>
              </label>
            ))
          )}
        </div>
      )}

      <button
        type="button"
        disabled={selected.size === 0 || generateMutation.isPending}
        onClick={() => generateMutation.mutate()}
        className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {generateMutation.isPending ? "Generating…" : `Generate Invoice (${selected.size} entries)`}
      </button>
    </Modal>
  );
}

export function InvoicesPage() {
  const { user } = useAuth();
  const [showGenerate, setShowGenerate] = useState(false);
  const { data: invoices, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: listInvoices });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        {user?.role === "ADMIN" && (
          <button
            type="button"
            onClick={() => setShowGenerate(true)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Generate Invoice
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices?.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/invoices/${invoice.id}`} className="font-medium text-gray-900 hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{invoice.client.name}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">${invoice.total}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
              {invoices?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showGenerate && <GenerateInvoiceModal onClose={() => setShowGenerate(false)} />}
    </div>
  );
}
