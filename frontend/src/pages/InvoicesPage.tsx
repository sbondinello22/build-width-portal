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
import { SearchJump } from "../components/ui/SearchJump";
import { BarChart } from "../components/charts/BarChart";

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  VOID: "bg-gray-100 text-gray-400",
};

const openStatuses: InvoiceStatus[] = ["DRAFT", "SENT", "OVERDUE"];
const closedStatuses: InvoiceStatus[] = ["PAID", "VOID"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type StatusTab = "all" | "open" | "closed";

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
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [clientFilter, setClientFilter] = useState("");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: invoices, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: listInvoices });
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const clientFilteredInvoices = (invoices ?? []).filter((inv) => !clientFilter || inv.clientId === clientFilter);

  const tableInvoices = clientFilteredInvoices.filter((inv) => {
    if (statusTab === "open") return openStatuses.includes(inv.status);
    if (statusTab === "closed") return closedStatuses.includes(inv.status);
    return true;
  });

  const years = Array.from(new Set((invoices ?? []).map((inv) => new Date(inv.issueDate).getFullYear())));
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort((a, b) => b - a);

  const monthlyData = monthNames.map((label, i) => {
    const monthInvoices = clientFilteredInvoices.filter((inv) => {
      if (inv.status === "VOID") return false;
      const d = new Date(inv.issueDate);
      return d.getFullYear() === year && d.getMonth() === i;
    });
    const paid = monthInvoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + Number(inv.total), 0);
    const open = monthInvoices
      .filter((inv) => inv.status !== "PAID")
      .reduce((sum, inv) => sum + Number(inv.total), 0);
    return { label, values: { paid: Math.round(paid * 100) / 100, open: Math.round(open * 100) / 100 } };
  });

  const tabs: { key: StatusTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "closed", label: "Closed" },
  ];

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

      <div className="mb-6">
        <SearchJump
          placeholder="Search invoices by number or client…"
          items={(invoices ?? []).map((inv) => ({
            id: inv.id,
            label: inv.invoiceNumber,
            sublabel: `${inv.client.name} · $${inv.total} · ${inv.status}`,
            to: `/invoices/${inv.id}`,
          }))}
        />
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
            <p className="text-sm text-gray-500">Paid vs. open invoice totals per month (voided invoices excluded).</p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <BarChart
          data={monthlyData}
          series={[
            { key: "paid", label: "Paid", color: "#0ca30c" },
            { key: "open", label: "Open", color: "#2a78d6" },
          ]}
          valueFormatter={(n) => `$${n.toLocaleString()}`}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-hidden rounded-md border border-gray-300">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium ${
                statusTab === tab.key ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        >
          <option value="">All Clients</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
              {tableInvoices.map((invoice) => (
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
              {tableInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No invoices match this filter.
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
