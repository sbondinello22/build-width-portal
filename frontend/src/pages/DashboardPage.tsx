import { useQuery } from "@tanstack/react-query";
import { getDashboardActivity, getDashboardSummary } from "../api/dashboard";
import { StatTile } from "../components/ui/StatTile";

function formatCurrency(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DashboardPage() {
  const { data: summary } = useQuery({ queryKey: ["dashboard", "summary"], queryFn: getDashboardSummary });
  const { data: activity } = useQuery({ queryKey: ["dashboard", "activity"], queryFn: getDashboardActivity });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Outstanding Balance" value={summary ? formatCurrency(summary.outstandingBalance) : "…"} />
        <StatTile
          label="Overdue Invoices"
          value={summary ? String(summary.overdueCount) : "…"}
          tone={summary && summary.overdueCount > 0 ? "critical" : "default"}
        />
        <StatTile
          label="Overdue Amount"
          value={summary ? formatCurrency(summary.overdueAmount) : "…"}
          tone={summary && summary.overdueAmount > 0 ? "critical" : "default"}
        />
        <StatTile label="Hours This Month" value={summary ? `${summary.hoursThisMonth}h` : "…"} />
      </div>

      <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent Activity</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {activity?.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No activity yet.</p>
        ) : (
          <ul>
            {activity?.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm last:border-0">
                <span className="text-gray-900">{entry.message}</span>
                <span className="text-gray-400">{new Date(entry.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
