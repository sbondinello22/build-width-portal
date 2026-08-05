export interface BudgetBarDatum {
  label: string;
  percentHoursUsed: number;
  hoursLogged: number;
  budgetHours: number;
  percentCostUsed: number;
  billableAmount: number;
  budgetAmount: number;
}

function colorFor(pct: number): string {
  if (pct >= 100) return "#d03b3b";
  if (pct >= 90) return "#fab219";
  return "var(--brand-blue)";
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function Bar({
  rowLabel,
  percent,
  detail,
}: {
  rowLabel: string;
  percent: number;
  detail: string;
}) {
  const width = Math.min(100, percent);
  const color = colorFor(percent);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-[var(--text-secondary)]">{rowLabel}</span>
        <span className="text-[var(--text-muted)]">{detail}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function BudgetBarChart({ data }: { data: BudgetBarDatum[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">No projects with a budget set yet.</p>;
  }

  return (
    <div className="space-y-5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-2 font-medium text-[var(--text-primary)]">{d.label}</div>
          <div className="space-y-2">
            <Bar
              rowLabel="Hours"
              percent={d.percentHoursUsed}
              detail={`${d.percentHoursUsed}% · ${d.hoursLogged}h of ${d.budgetHours}h`}
            />
            <Bar
              rowLabel="Cost"
              percent={d.percentCostUsed}
              detail={`${d.percentCostUsed}% · ${formatCurrency(d.billableAmount)} of ${formatCurrency(d.budgetAmount)}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
