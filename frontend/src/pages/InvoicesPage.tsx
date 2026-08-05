import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { listClients } from "../api/clients";
import { listProjectsForClient } from "../api/projects";
import { listTimeEntriesForProject } from "../api/timeEntries";
import { generateInvoice, listInvoices } from "../api/invoices";
import { Modal } from "../components/ui/Modal";
import { SearchJump } from "../components/ui/SearchJump";
import { BarChart } from "../components/charts/BarChart";
import { InvoicesSubNav } from "../components/layout/InvoicesSubNav";
import { statusStyles, openStatuses, closedStatuses, monthNames } from "../lib/invoiceDisplay";

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
        <span className="mb-1 block font-medium text-[var(--text-secondary)]">Client</span>
        <select
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setSelected(new Set());
          }}
          className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
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
        <div className="mb-4 max-h-64 overflow-y-auto rounded-md border border-[var(--border)]">
          {billableEntries.length === 0 ? (
            <p className="p-3 text-sm text-[var(--text-muted)]">No unbilled time entries for this client.</p>
          ) : (
            billableEntries.map((entry) => (
              <label key={entry.id} className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2 text-sm last:border-0">
                <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggle(entry.id)} />
                <span className="flex-1">
                  {entry.projectName} — {entry.description || "(no description)"}
                </span>
                <span className="text-[var(--text-secondary)]">{((entry.durationMinutes ?? 0) / 60).toFixed(2)}h</span>
              </label>
            ))
          )}
        </div>
      )}

      <button
        type="button"
        disabled={selected.size === 0 || generateMutation.isPending}
        onClick={() => generateMutation.mutate()}
        className="w-full rounded-md bg-[var(--brand-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
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
    const draft = monthInvoices
      .filter((inv) => inv.status === "DRAFT")
      .reduce((sum, inv) => sum + Number(inv.total), 0);
    const open = monthInvoices
      .filter((inv) => inv.status !== "PAID" && inv.status !== "DRAFT")
      .reduce((sum, inv) => sum + Number(inv.total), 0);
    return {
      label,
      values: {
        paid: Math.round(paid * 100) / 100,
        open: Math.round(open * 100) / 100,
        draft: Math.round(draft * 100) / 100,
      },
    };
  });

  const totalPaid = monthlyData.reduce((sum, m) => sum + m.values.paid, 0);
  const totalOpen = monthlyData.reduce((sum, m) => sum + m.values.open, 0);
  const totalDraft = monthlyData.reduce((sum, m) => sum + m.values.draft, 0);

  function formatCurrency(n: number) {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const tabs: { key: StatusTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Invoices</h1>
        {user?.role === "ADMIN" && (
          <button
            type="button"
            onClick={() => setShowGenerate(true)}
            className="rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)]"
          >
            Generate Invoice
          </button>
        )}
      </div>

      <InvoicesSubNav />

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

      <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Invoice History</h2>
            <p className="text-sm text-[var(--text-secondary)]">Paid vs. open invoice totals per month (voided invoices excluded).</p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <BarChart
              data={monthlyData}
              series={[
                { key: "paid", label: "Paid", color: "#0ca30c" },
                { key: "open", label: "Open", color: "var(--brand-blue)" },
                { key: "draft", label: "Draft", color: "var(--text-muted)" },
              ]}
              valueFormatter={(n) => `$${n.toLocaleString()}`}
            />
          </div>
          <div className="flex shrink-0 flex-row gap-3 lg:w-48 lg:flex-col">
            <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#0ca30c" }} />
                Paid
              </div>
              <div className="mt-1 text-xl font-bold text-[var(--text-primary)]">{formatCurrency(totalPaid)}</div>
            </div>
            <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--brand-blue)" }} />
                Open
              </div>
              <div className="mt-1 text-xl font-bold text-[var(--text-primary)]">{formatCurrency(totalOpen)}</div>
            </div>
            <Link
              to="/invoices/draft"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 hover:bg-[var(--surface)]"
            >
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--text-muted)" }} />
                Draft
              </div>
              <div className="mt-1 text-xl font-bold text-[var(--text-primary)]">{formatCurrency(totalDraft)}</div>
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-hidden rounded-md border border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium ${
                statusTab === tab.key ? "bg-[var(--brand-blue)] text-white" : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
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
              {tableInvoices.map((invoice) => (
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
              {tableInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--text-muted)]">
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
