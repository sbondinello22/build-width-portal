import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex overflow-hidden rounded-md border border-[var(--border)]">
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`px-3 py-2 text-sm font-medium ${
          theme === "dark"
            ? "bg-[var(--brand-blue)] text-white"
            : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
        }`}
      >
        Dark
      </button>
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`px-3 py-2 text-sm font-medium ${
          theme === "light"
            ? "bg-[var(--brand-blue)] text-white"
            : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
        }`}
      >
        Light
      </button>
    </div>
  );
}
