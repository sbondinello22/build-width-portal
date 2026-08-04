import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { listClients } from "../../api/clients";
import { Logo } from "./Logo";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-3 text-sm font-medium border-b-2 ${
    isActive ? "border-gray-900 text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
  }`;

function ClientsDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: listClients, enabled: open });

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => navigate("/clients")}
        className={`flex items-center gap-1 px-3 py-3 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 ${
          open ? "text-gray-900" : ""
        }`}
      >
        Clients
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 w-56 rounded-md border border-gray-200 bg-white py-2 shadow-lg">
          <NavLink to="/clients" className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50">
            All Clients
          </NavLink>
          {clients && clients.length > 0 && <div className="my-1 border-t border-gray-100" />}
          {clients?.slice(0, 8).map((client) => (
            <NavLink
              key={client.id}
              to={`/clients/${client.id}`}
              className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              {client.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <NavLink to="/dashboard" onClick={() => setMobileOpen(false)}>
            <Logo />
          </NavLink>

          <div className="hidden items-center gap-4 text-sm md:flex">
            <div className="text-right">
              <div className="font-medium text-gray-900">{user?.name}</div>
              <div className="text-gray-500">{user?.role}</div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Log out
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Toggle menu"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>

        <nav className="hidden items-center gap-1 border-t border-gray-100 px-6 md:flex">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <ClientsDropdown />
          <NavLink to="/time-tracking" className={navLinkClass}>
            Time Tracking
          </NavLink>
          <NavLink to="/invoices" className={navLinkClass}>
            Invoices
          </NavLink>
          {user?.role === "ADMIN" && (
            <NavLink to="/users" className={navLinkClass}>
              Users
            </NavLink>
          )}
        </nav>

        {mobileOpen && (
          <nav className="space-y-1 border-t border-gray-100 px-4 py-3 md:hidden">
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
              <NavLink to="/users" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                Users
              </NavLink>
            )}
            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="px-3 text-sm font-medium text-gray-900">{user?.name}</div>
              <div className="px-3 text-sm text-gray-500">{user?.role}</div>
              <button
                type="button"
                onClick={() => void logout()}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
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
