const accentColors = {
  blue: "var(--brand-blue)",
  orange: "var(--brand-orange)",
  violet: "var(--brand-violet)",
} as const;

export function StatTile({
  label,
  value,
  tone = "default",
  accent = "blue",
}: {
  label: string;
  value: string;
  tone?: "default" | "critical";
  accent?: keyof typeof accentColors;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-shadow hover:shadow-md">
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundColor: tone === "critical" ? "#d03b3b" : accentColors[accent] }}
      />
      <div className="text-sm font-medium text-[var(--text-secondary)]">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone === "critical" ? "text-red-600" : "text-[var(--text-primary)]"}`}>
        {value}
      </div>
    </div>
  );
}
