import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHoursTimeSeries, getProjectAnalytics } from "../api/analytics";
import type { GroupBy } from "../api/analytics";
import { useAllProjects } from "../hooks/useAllProjects";
import { BarChart } from "../components/charts/BarChart";
import { BudgetBarChart } from "../components/charts/BudgetBarChart";

const groupByOptions: { value: GroupBy; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

function formatPeriodLabel(iso: string, groupBy: GroupBy): string {
  const d = new Date(iso);
  if (groupBy === "month") return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  if (groupBy === "week") return `Wk of ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AnalyticsPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [projectId, setProjectId] = useState("");
  const { projects: allProjects } = useAllProjects();

  const { data: series } = useQuery({
    queryKey: ["analytics", "time-series", groupBy, projectId],
    queryFn: () => getHoursTimeSeries({ groupBy, projectId: projectId || undefined }),
  });

  const { data: projectAnalytics } = useQuery({
    queryKey: ["analytics", "projects"],
    queryFn: getProjectAnalytics,
  });

  const chartData =
    series?.map((point) => ({
      label: formatPeriodLabel(point.periodStart, groupBy),
      values: { billable: point.billableHours, nonBillable: point.nonBillableHours },
    })) ?? [];

  const budgetData = (projectAnalytics ?? [])
    .filter((p) => p.percentUsed !== null)
    .map((p) => ({
      label: p.name,
      percentHoursUsed: p.percentUsed!,
      hoursLogged: p.hoursLogged,
      budgetHours: p.budgetHours!,
      percentCostUsed: p.percentCostUsed!,
      billableAmount: p.billableAmount,
      budgetAmount: p.budgetAmount!,
    }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[var(--text-primary)]">Analytics &amp; Reports</h1>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--text-secondary)]">Period</span>
          <div className="flex overflow-hidden rounded-md border border-[var(--border)]">
            {groupByOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGroupBy(opt.value)}
                className={`px-3 py-2 text-sm font-medium ${
                  groupBy === opt.value ? "bg-[var(--brand-blue)] text-white" : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--text-secondary)]">Project</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
          >
            <option value="">All Projects</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clientName} — {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">Hours Logged</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">Billable vs non-billable hours over time.</p>
        <BarChart data={chartData} series={[
          { key: "billable", label: "Billable", color: "var(--brand-blue)" },
          { key: "nonBillable", label: "Non-billable", color: "var(--brand-orange)" },
        ]} valueFormatter={(n) => `${n}h`} />
      </div>

      <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">Utilization by Project</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Hours and cost utilization per project.
        </p>
        <BudgetBarChart data={budgetData} />
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <h2 className="border-b border-[var(--border-subtle)] px-5 py-4 text-lg font-semibold text-[var(--text-primary)]">Project Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Budget (hrs)</th>
                <th className="px-4 py-3 font-medium">Logged</th>
                <th className="px-4 py-3 font-medium">Remaining</th>
                <th className="px-4 py-3 font-medium">Billable</th>
                <th className="px-4 py-3 font-medium">Non-billable</th>
              </tr>
            </thead>
            <tbody>
              {projectAnalytics?.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{p.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{p.clientName}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{p.budgetHours ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{p.hoursLogged}h</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {p.hoursRemaining !== null ? `${p.hoursRemaining}h` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {p.billableHours}h ({formatCurrency(p.billableAmount)})
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {p.nonBillableHours}h ({formatCurrency(p.nonBillableAmount)})
                  </td>
                </tr>
              ))}
              {projectAnalytics?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-[var(--text-muted)]">
                    No projects yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
