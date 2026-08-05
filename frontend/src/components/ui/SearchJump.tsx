import { useState } from "react";
import { Link } from "react-router-dom";

export interface SearchJumpItem {
  id: string;
  label: string;
  sublabel?: string;
  to: string;
}

export function SearchJump({ items, placeholder }: { items: SearchJumpItem[]; placeholder: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const trimmed = query.trim().toLowerCase();
  const matches = trimmed
    ? items
        .filter((item) => item.label.toLowerCase().includes(trimmed) || item.sublabel?.toLowerCase().includes(trimmed))
        .slice(0, 8)
    : [];

  return (
    <div className="relative">
      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full rounded-md border border-[var(--border)] py-2 pl-9 pr-3 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
      </div>
      {open && trimmed && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[var(--text-muted)]">No matches.</p>
          ) : (
            matches.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className="block px-3 py-2 text-sm hover:bg-[var(--surface-2)]"
                onClick={() => setQuery("")}
              >
                <div className="font-medium text-[var(--text-primary)]">{item.label}</div>
                {item.sublabel && <div className="text-[var(--text-secondary)]">{item.sublabel}</div>}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
