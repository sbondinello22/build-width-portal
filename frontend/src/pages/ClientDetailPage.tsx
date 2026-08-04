import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { deleteClient, getClient, updateClient } from "../api/clients";
import { createProjectForClient, listProjectsForClient, updateProject } from "../api/projects";
import type { ProjectStatus } from "../api/projects";
import { Modal } from "../components/ui/Modal";
import { FormField } from "../components/ui/FormField";

const statusStyles: Record<ProjectStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = id!;
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const [showEditClient, setShowEditClient] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  const { data: client } = useQuery({ queryKey: ["clients", clientId], queryFn: () => getClient(clientId) });
  const { data: projects } = useQuery({
    queryKey: ["clients", clientId, "projects"],
    queryFn: () => listProjectsForClient(clientId),
  });

  const updateClientMutation = useMutation({
    mutationFn: (input: { name: string; email: string; company?: string; hourlyRate: number }) =>
      updateClient(clientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setShowEditClient(false);
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: () => deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      navigate("/clients");
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (input: { name: string; rate: number; budgetHours?: number }) =>
      createProjectForClient(clientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", clientId, "projects"] });
      setShowNewProject(false);
    },
  });

  const projectStatusMutation = useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: ProjectStatus }) =>
      updateProject(projectId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", clientId, "projects"] }),
  });

  if (!client) {
    return <p className="text-gray-500">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
          <p className="text-gray-500">
            {client.company ? `${client.company} · ` : ""}
            {client.email} · ${client.hourlyRate}/hr default rate
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowEditClient(true)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete client "${client.name}"? This cannot be undone.`)) {
                  deleteClientMutation.mutate();
                }
              }}
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowNewProject(true)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            New Project
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">Budget (hrs)</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects?.map((project) => (
              <tr key={project.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-900">{project.name}</td>
                <td className="px-4 py-3 text-gray-600">${project.rate}/hr</td>
                <td className="px-4 py-3 text-gray-600">{project.budgetHours ?? "—"}</td>
                <td className="px-4 py-3">
                  {isAdmin ? (
                    <select
                      value={project.status}
                      onChange={(e) =>
                        projectStatusMutation.mutate({ projectId: project.id, status: e.target.value as ProjectStatus })
                      }
                      className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${statusStyles[project.status]}`}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ON_HOLD">ON_HOLD</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  ) : (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[project.status]}`}>
                      {project.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {projects?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showEditClient && (
        <Modal title="Edit Client" onClose={() => setShowEditClient(false)}>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              const form = new FormData(e.target as HTMLFormElement);
              updateClientMutation.mutate({
                name: String(form.get("name")),
                email: String(form.get("email")),
                company: String(form.get("company") || "") || undefined,
                hourlyRate: Number(form.get("hourlyRate")),
              });
            }}
          >
            <FormField label="Name" name="name" required defaultValue={client.name} />
            <FormField label="Email" name="email" type="email" required defaultValue={client.email} />
            <FormField label="Company" name="company" defaultValue={client.company ?? ""} />
            <FormField
              label="Hourly Rate ($)"
              name="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={client.hourlyRate}
            />
            <button
              type="submit"
              disabled={updateClientMutation.isPending}
              className="mt-2 w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Save
            </button>
          </form>
        </Modal>
      )}

      {showNewProject && (
        <Modal title="New Project" onClose={() => setShowNewProject(false)}>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              const form = new FormData(e.target as HTMLFormElement);
              const budgetHours = String(form.get("budgetHours") || "");
              createProjectMutation.mutate({
                name: String(form.get("name")),
                rate: Number(form.get("rate")),
                budgetHours: budgetHours ? Number(budgetHours) : undefined,
              });
            }}
          >
            <FormField label="Name" name="name" required />
            <FormField label="Rate ($/hr)" name="rate" type="number" min="0" step="0.01" required defaultValue={client.hourlyRate} />
            <FormField label="Budget Hours (optional)" name="budgetHours" type="number" min="0" step="0.5" />
            <button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="mt-2 w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Create Project
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
