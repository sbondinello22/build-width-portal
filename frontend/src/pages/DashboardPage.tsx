import { useQuery } from "@tanstack/react-query";
import { getDashboardActivity, getDashboardSummary } from "../api/dashboard";
import { StatTile } from "../components/ui/StatTile";
import { ThemeToggle } from "../components/ui/ThemeToggle";

function formatCurrency(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DashboardPage() {
  const { data: summary } = useQuery({ queryKey: ["dashboard", "summary"], queryFn: getDashboardSummary });
  const { data: activity } = useQuery({ queryKey: ["dashboard", "activity"], queryFn: getDashboardActivity });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Dashboard</h1>
        <ThemeToggle />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Outstanding Balance"
          value={summary ? formatCurrency(summary.outstandingBalance) : "…"}
          accent="blue"
          to="/invoices"
        />
        <StatTile
          label="Overdue Invoices"
          value={summary ? String(summary.overdueCount) : "…"}
          tone={summary && summary.overdueCount > 0 ? "critical" : "default"}
          accent="orange"
        />
        <StatTile
          label="Overdue Amount"
          value={summary ? formatCurrency(summary.overdueAmount) : "…"}
          tone={summary && summary.overdueAmount > 0 ? "critical" : "default"}
          accent="orange"
        />
        <StatTile
          label="Billable Hours (This Month)"
          value={summary ? `${summary.billableHoursThisMonth}h` : "…"}
          secondary={summary ? `${summary.billableHoursThisWeek}h this week` : undefined}
          accent="violet"
          to="/analytics"
        />
      </div>

      <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Recent Activity</h2>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {activity?.length === 0 ? (
          <p className="p-4 text-sm text-[var(--text-muted)]">No activity yet.</p>
        ) : (
          <ul>
            {activity?.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1 border-b border-[var(--border-subtle)] px-4 py-3 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="text-[var(--text-primary)]">{entry.message}</span>
                <span className="shrink-0 text-[var(--text-muted)]">{new Date(entry.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
