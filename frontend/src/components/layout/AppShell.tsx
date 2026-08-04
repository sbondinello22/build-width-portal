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

function ClientsDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: listClients, enabled: open });

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
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

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <NavLink to="/dashboard">
            <Logo />
          </NavLink>
          <div className="flex items-center gap-4 text-sm">
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
        </div>
        <nav className="flex items-center gap-1 border-t border-gray-100 px-6">
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
      </header>
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  );
}
