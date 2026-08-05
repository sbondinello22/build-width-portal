import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "./Logo";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-3 text-sm font-semibold border-b-2 transition-colors ${
    isActive
      ? "border-[var(--brand-blue)] text-[var(--brand-blue)]"
      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-semibold ${
    isActive ? "bg-[var(--brand-blue)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
  }`;

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-[var(--brand-blue)] via-[var(--brand-orange)] to-[var(--brand-violet)]" />
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <NavLink to="/dashboard" onClick={() => setMobileOpen(false)}>
            <Logo />
          </NavLink>

          <div className="hidden items-center gap-4 text-sm md:flex">
            <div className="text-right">
              <div className="font-medium text-[var(--text-primary)]">{user?.name}</div>
              <div className="text-[var(--text-secondary)]">{user?.role}</div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            >
              Log out
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] md:hidden"
            aria-label="Toggle menu"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>

        <nav className="hidden items-center gap-1 border-t border-[var(--border-subtle)] px-6 md:flex">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/clients" className={navLinkClass}>
            Clients
          </NavLink>
          <NavLink to="/time-tracking" className={navLinkClass}>
            Time Tracking
          </NavLink>
          <NavLink to="/invoices" className={navLinkClass}>
            Invoices
          </NavLink>
          {user?.role === "ADMIN" && (
            <NavLink to="/analytics" className={navLinkClass}>
              Analytics
            </NavLink>
          )}
          {user?.role === "ADMIN" && (
            <NavLink to="/users" className={navLinkClass}>
              Users
            </NavLink>
          )}
          <NavLink to="/settings" className={navLinkClass}>
            Settings
          </NavLink>
        </nav>

        {mobileOpen && (
          <nav className="space-y-1 border-t border-[var(--border-subtle)] px-4 py-3 md:hidden">
            <NavLink to="/dashboard" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/clients" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
              Clients
            </NavLink>
            <NavLink to="/time-tracking" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
              Time Tracking
            </NavLink>
            <NavLink to="/invoices" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
              Invoices
            </NavLink>
            {user?.role === "ADMIN" && (
              <NavLink to="/analytics" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                Analytics
              </NavLink>
            )}
            {user?.role === "ADMIN" && (
              <NavLink to="/users" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                Users
              </NavLink>
            )}
            <NavLink to="/settings" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
              Settings
            </NavLink>
            <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
              <div className="px-3 text-sm font-medium text-[var(--text-primary)]">{user?.name}</div>
              <div className="px-3 text-sm text-[var(--text-secondary)]">{user?.role}</div>
              <button
                type="button"
                onClick={() => void logout()}
                className="mt-2 w-full rounded-md border border-[var(--border)] px-3 py-2 text-left text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              >
                Log out
              </button>
            </div>
          </nav>
        )}
      </header>
      <main className="p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
