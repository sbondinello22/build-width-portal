import type { InputHTMLAttributes } from "react";

export function FormField({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium text-[var(--text-secondary)]">{label}</span>
      <input
        {...props}
        className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
      />
    </label>
  );
}
