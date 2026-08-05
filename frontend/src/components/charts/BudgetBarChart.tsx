export interface BudgetBarDatum {
  label: string;
  percentUsed: number;
}

function colorFor(pct: number): string {
  if (pct >= 100) return "#d03b3b";
  if (pct >= 90) return "#fab219";
  return "var(--brand-blue)";
}

export function BudgetBarChart({ data }: { data: BudgetBarDatum[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">No projects with a budget set yet.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const width = Math.min(100, d.percentUsed);
        const color = colorFor(d.percentUsed);
        return (
          <div key={d.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-[var(--text-primary)]">{d.label}</span>
              <span className="text-[var(--text-secondary)]">{d.percentUsed}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
