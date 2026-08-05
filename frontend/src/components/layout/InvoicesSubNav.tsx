import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium rounded-md ${
    isActive ? "bg-[var(--brand-blue)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
  }`;

export function InvoicesSubNav() {
  const { user } = useAuth();

  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-[var(--border-subtle)] pb-3">
      <NavLink to="/invoices" end className={linkClass}>
        Overview
      </NavLink>
      <NavLink to="/invoices/draft" className={linkClass}>
        Draft
      </NavLink>
      <NavLink to="/invoices/overdue" className={linkClass}>
        Overdue
      </NavLink>
      <NavLink to="/invoices/recurring" className={linkClass}>
        Recurring
      </NavLink>
      {user?.role === "ADMIN" && (
        <NavLink to="/invoices/configure" className={linkClass}>
          Configure
        </NavLink>
      )}
    </nav>
  );
}
