import { useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getClient } from "../api/clients";
import { createProjectForClient, deleteProject, listProjectsForClient, updateProject } from "../api/projects";
import type { Project, ProjectStatus } from "../api/projects";
import { Modal } from "../components/ui/Modal";
import { FormField } from "../components/ui/FormField";

const statusStyles: Record<ProjectStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  ARCHIVED: "bg-[var(--surface-2)] text-[var(--text-secondary)]",
};

function ProjectForm({
  title,
  initialName,
  initialTotal,
  initialHours,
  submitLabel,
  pending,
  onClose,
  onSubmit,
}: {
  title: string;
  initialName: string;
  initialTotal: string;
  initialHours: string;
  submitLabel: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; rate: number; budgetHours: number }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [total, setTotal] = useState(initialTotal);
  const [hours, setHours] = useState(initialHours);

  const computedRate = total && hours && Number(hours) > 0 ? Number(total) / Number(hours) : null;

  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (computedRate === null) return;
          onSubmit({ name, rate: Math.round(computedRate * 100) / 100, budgetHours: Number(hours) });
        }}
      >
        <FormField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <FormField
          label="Total Budget ($)"
          type="number"
          min="0"
          step="0.01"
          required
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
        <FormField
          label="Budget Hours"
          type="number"
          min="0"
          step="any"
          required
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
        <div className="mb-3 rounded-md bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          Effective hourly rate:{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            {computedRate !== null ? `$${computedRate.toFixed(2)}/hr` : "—"}
          </span>
        </div>
        <button
          type="submit"
          disabled={pending || computedRate === null}
          className="mt-2 w-full rounded-md bg-[var(--brand-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </form>
    </Modal>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = id!;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data: client } = useQuery({ queryKey: ["clients", clientId], queryFn: () => getClient(clientId) });
  const { data: projects } = useQuery({
    queryKey: ["clients", clientId, "projects"],
    queryFn: () => listProjectsForClient(clientId),
  });

  const invalidateProjects = () => queryClient.invalidateQueries({ queryKey: ["clients", clientId, "projects"] });

  const createProjectMutation = useMutation({
    mutationFn: (input: { name: string; rate: number; budgetHours: number }) =>
      createProjectForClient(clientId, input),
    onSuccess: () => {
      invalidateProjects();
      setShowNewProject(false);
    },
  });

  const editProjectMutation = useMutation({
    mutationFn: (input: { name: string; rate: number; budgetHours: number }) =>
      updateProject(editingProject!.id, input),
    onSuccess: () => {
      invalidateProjects();
      setEditingProject(null);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => invalidateProjects(),
  });

  const projectStatusMutation = useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: ProjectStatus }) =>
      updateProject(projectId, { status }),
    onSuccess: () => invalidateProjects(),
  });

  if (!client) {
    return <p className="text-[var(--text-secondary)]">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{client.name}</h1>
        <p className="text-[var(--text-secondary)]">
          {client.company ? `${client.company} · ` : ""}
          {client.email} · ${client.hourlyRate}/hr default rate
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Projects</h2>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowNewProject(true)}
            className="rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)]"
          >
            New Project
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">Budget (hrs)</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {isAdmin && <th className="px-4 py-3 font-medium"></th>}
            </tr>
          </thead>
          <tbody>
            {projects?.map((project) => (
              <tr key={project.id} className="border-b border-[var(--border-subtle)] last:border-0">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{project.name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">${project.rate}/hr</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{project.budgetHours ?? "—"}</td>
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
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingProject(project)}
                        className="text-sm font-medium text-[var(--text-secondary)] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
                            deleteProjectMutation.mutate(project.id);
                          }
                        }}
                        className="text-sm font-medium text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {projects?.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-6 text-center text-[var(--text-muted)]">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNewProject && (
        <ProjectForm
          title="New Project"
          initialName=""
          initialTotal=""
          initialHours=""
          submitLabel={createProjectMutation.isPending ? "Creating…" : "Create Project"}
          pending={createProjectMutation.isPending}
          onClose={() => setShowNewProject(false)}
          onSubmit={(input) => createProjectMutation.mutate(input)}
        />
      )}

      {editingProject && (
        <ProjectForm
          title="Edit Project"
          initialName={editingProject.name}
          initialTotal={
            editingProject.budgetHours
              ? String(Math.round(Number(editingProject.rate) * Number(editingProject.budgetHours) * 100) / 100)
              : ""
          }
          initialHours={editingProject.budgetHours ?? ""}
          submitLabel={editProjectMutation.isPending ? "Saving…" : "Save Changes"}
          pending={editProjectMutation.isPending}
          onClose={() => setEditingProject(null)}
          onSubmit={(input) => editProjectMutation.mutate(input)}
        />
      )}
    </div>
  );
}
