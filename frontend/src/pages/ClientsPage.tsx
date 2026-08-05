import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { createClient, listClients } from "../api/clients";
import { Modal } from "../components/ui/Modal";
import { FormField } from "../components/ui/FormField";
import { SearchJump } from "../components/ui/SearchJump";

export function ClientsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: clients, isLoading } = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setShowCreate(false);
      setName("");
      setEmail("");
      setCompany("");
      setHourlyRate("");
      setError(null);
    },
    onError: () => setError("Failed to create client"),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name, email, company: company || undefined, hourlyRate: Number(hourlyRate) });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Clients</h1>
        {user?.role === "ADMIN" && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)]"
          >
            New Client
          </button>
        )}
      </div>

      <div className="mb-4">
        <SearchJump
          placeholder="Search clients by name, company, or email…"
          items={(clients ?? []).map((c) => ({
            id: c.id,
            label: c.name,
            sublabel: c.company ? `${c.company} · ${c.email}` : c.email,
            to: `/clients/${c.id}`,
          }))}
        />
      </div>

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {clients?.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="cursor-pointer border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-2)]"
                >
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{client.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{client.company ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{client.email}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">${client.hourlyRate}/hr</td>
                </tr>
              ))}
              {clients?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[var(--text-muted)]">
                    No clients yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <Modal title="New Client" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            {error && <div className="mb-3 rounded-md bg-[var(--banner-error-bg)] px-3 py-2 text-sm text-[var(--banner-error-text)]">{error}</div>}
            <FormField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <FormField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <FormField label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            <FormField
              label="Hourly Rate ($)"
              type="number"
              min="0"
              step="0.01"
              required
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="mt-2 w-full rounded-md bg-[var(--brand-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating…" : "Create Client"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
