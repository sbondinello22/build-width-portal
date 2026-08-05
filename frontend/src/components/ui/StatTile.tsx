import { Link } from "react-router-dom";

const accentColors = {
  blue: "var(--brand-blue)",
  orange: "var(--brand-orange)",
  violet: "var(--brand-violet)",
} as const;

export function StatTile({
  label,
  value,
  secondary,
  tone = "default",
  accent = "blue",
  to,
}: {
  label: string;
  value: string;
  secondary?: string;
  tone?: "default" | "critical";
  accent?: keyof typeof accentColors;
  to?: string;
}) {
  const content = (
    <>
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundColor: tone === "critical" ? "#d03b3b" : accentColors[accent] }}
      />
      <div className="text-sm font-medium text-[var(--text-secondary)]">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone === "critical" ? "text-red-500" : "text-[var(--text-primary)]"}`}>
        {value}
      </div>
      {secondary && <div className="mt-1 text-xs text-[var(--text-muted)]">{secondary}</div>}
    </>
  );

  const className =
    "relative block overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-shadow hover:shadow-md" +
    (to ? " cursor-pointer hover:border-[var(--brand-blue)]" : "");

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
