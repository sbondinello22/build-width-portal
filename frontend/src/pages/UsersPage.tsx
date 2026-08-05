import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { createUser, deleteUser, listUsers } from "../api/users";
import type { Role } from "../api/auth";
import { Modal } from "../components/ui/Modal";
import { FormField } from "../components/ui/FormField";

const roleStyles: Record<Role, string> = {
  ADMIN: "bg-violet-100 text-violet-800",
  EMPLOYEE: "bg-blue-100 text-blue-800",
};

function AddUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.error ?? "Failed to create user"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name, email, password, role });
  }

  return (
    <Modal title="Add User" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-3 rounded-md bg-[var(--banner-error-bg)] px-3 py-2 text-sm text-[var(--banner-error-text)]">{error}</div>}
        <FormField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <FormField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField
          label="Temporary Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium text-[var(--text-secondary)]">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="mt-2 w-full rounded-md bg-[var(--brand-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
        >
          {createMutation.isPending ? "Adding…" : "Add User"}
        </button>
      </form>
    </Modal>
  );
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Users</h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)]"
        >
          + Add User
        </button>
      </div>

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    {u.name}
                    {u.id === currentUser?.id && <span className="ml-2 text-xs text-[var(--text-muted)]">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${roleStyles[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        u.active ? "bg-green-100 text-green-800" : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {u.active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.active && u.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete ${u.name}? They will immediately lose access.`)) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--text-muted)]">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
