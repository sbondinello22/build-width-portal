export function Logo() {
  return (
    <span className="inline-flex items-center gap-1.5 select-none">
      <span className="text-2xl font-bold tracking-tight text-gray-900">build</span>
      <svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true" className="mb-1">
        <rect x="0" y="1" width="26" height="4" rx="2" fill="#f59e0b" />
        <rect x="0" y="8" width="20" height="4" rx="2" fill="#0ea5e9" />
        <rect x="0" y="15" width="14" height="4" rx="2" fill="#8b5cf6" />
      </svg>
      <span className="text-2xl font-medium tracking-tight text-gray-900">width</span>
    </span>
  );
}
