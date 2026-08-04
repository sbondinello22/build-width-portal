export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "critical";
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone === "critical" ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}
