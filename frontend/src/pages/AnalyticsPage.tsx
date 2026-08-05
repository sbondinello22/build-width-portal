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
    .map((p) => ({ label: p.name, percentUsed: p.percentUsed! }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Analytics &amp; Reports</h1>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-gray-700">Period</span>
          <div className="flex overflow-hidden rounded-md border border-gray-300">
            {groupByOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGroupBy(opt.value)}
                className={`px-3 py-2 text-sm font-medium ${
                  groupBy === opt.value ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-gray-700">Project</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
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

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Hours Logged</h2>
        <p className="mb-4 text-sm text-gray-500">Billable vs non-billable hours over time.</p>
        <BarChart data={chartData} series={[
          { key: "billable", label: "Billable", color: "#2a78d6" },
          { key: "nonBillable", label: "Non-billable", color: "#eb6834" },
        ]} valueFormatter={(n) => `${n}h`} />
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Budget Utilization by Project</h2>
        <p className="mb-4 text-sm text-gray-500">Percent of budgeted hours used per project.</p>
        <BudgetBarChart data={budgetData} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-100 px-5 py-4 text-lg font-semibold text-gray-900">Project Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
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
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.clientName}</td>
                  <td className="px-4 py-3 text-gray-600">{p.budgetHours ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.hoursLogged}h</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.hoursRemaining !== null ? `${p.hoursRemaining}h` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.billableHours}h ({formatCurrency(p.billableAmount)})
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.nonBillableHours}h ({formatCurrency(p.nonBillableAmount)})
                  </td>
                </tr>
              ))}
              {projectAnalytics?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
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
