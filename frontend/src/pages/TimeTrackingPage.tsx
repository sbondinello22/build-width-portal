import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useAllProjects } from "../hooks/useAllProjects";
import {
  createTimeEntryForProject,
  deleteTimeEntry,
  listTimeEntriesForProject,
  stopTimeEntry,
  updateTimeEntry,
} from "../api/timeEntries";

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "running…";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function TimeTrackingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { projects, isLoading: projectsLoading } = useAllProjects();
  const [projectId, setProjectId] = useState("");
  const [timerDescription, setTimerDescription] = useState("");

  const { data: entries } = useQuery({
    queryKey: ["time-entries", projectId],
    queryFn: () => listTimeEntriesForProject(projectId),
    enabled: !!projectId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["time-entries", projectId] });

  const startTimerMutation = useMutation({
    mutationFn: () => createTimeEntryForProject(projectId, { description: timerDescription || undefined }),
    onSuccess: () => {
      setTimerDescription("");
      invalidate();
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: (id: string) => stopTimeEntry(id),
    onSuccess: invalidate,
  });

  const createManualMutation = useMutation({
    mutationFn: (input: { description?: string; startedAt: string; endedAt: string }) =>
      createTimeEntryForProject(projectId, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTimeEntry(id),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { description?: string } }) => updateTimeEntry(id, input),
    onSuccess: invalidate,
  });

  const runningEntry = entries?.find((e) => e.userId === user?.id && e.endedAt === null);

  function handleManualSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const description = String(form.get("description") || "") || undefined;
    const start = String(form.get("startedAt"));
    const end = String(form.get("endedAt"));
    createManualMutation.mutate({
      description,
      startedAt: new Date(start).toISOString(),
      endedAt: new Date(end).toISOString(),
    });
    e.currentTarget.reset();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[var(--text-primary)]">Time Tracking</h1>

      <label className="mb-6 block max-w-sm text-sm">
        <span className="mb-1 block font-medium text-[var(--text-secondary)]">Project</span>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        >
          <option value="">{projectsLoading ? "Loading projects…" : "Select a project"}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.clientName} — {p.name}
            </option>
          ))}
        </select>
      </label>

      {projectId && (
        <>
          <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            {runningEntry ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                  <span className="font-medium text-[var(--text-primary)]">Timer running</span>
                  {runningEntry.description && <span className="text-[var(--text-secondary)]"> — {runningEntry.description}</span>}
                  <span className="ml-2 text-[var(--text-muted)]">since {new Date(runningEntry.startedAt).toLocaleTimeString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => stopTimerMutation.mutate(runningEntry.id)}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Stop Timer
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                  placeholder="What are you working on?"
                  className="flex-1 rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => startTimerMutation.mutate()}
                  className="rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)]"
                >
                  Start Timer
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-[var(--text-secondary)]">Description</span>
              <input name="description" className="rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-[var(--text-secondary)]">Start</span>
              <input name="startedAt" type="datetime-local" required className="rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-[var(--text-secondary)]">End</span>
              <input name="endedAt" type="datetime-local" required className="rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none" />
            </label>
            <button
              type="submit"
              disabled={createManualMutation.isPending}
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-50"
            >
              Log Time
            </button>
          </form>

          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
                <tr>
                  {user?.role === "ADMIN" && <th className="px-4 py-3 font-medium">Employee</th>}
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Billed</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {entries?.map((entry) => {
                  const canEdit = !entry.billed && (entry.userId === user?.id || user?.role === "ADMIN");
                  return (
                    <tr key={entry.id} className="border-b border-[var(--border-subtle)] last:border-0">
                      {user?.role === "ADMIN" && (
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{entry.userId === user.id ? "You" : entry.userId.slice(0, 8)}</td>
                      )}
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(entry.startedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-[var(--text-primary)]">
                        {canEdit ? (
                          <input
                            defaultValue={entry.description ?? ""}
                            onBlur={(e) => {
                              if (e.target.value !== (entry.description ?? "")) {
                                updateMutation.mutate({ id: entry.id, input: { description: e.target.value } });
                              }
                            }}
                            className="w-full rounded border border-transparent px-1 hover:border-[var(--border)] focus:border-[var(--brand-blue)] focus:outline-none"
                          />
                        ) : (
                          entry.description ?? "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDuration(entry.durationMinutes)}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{entry.billed ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-right">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(entry.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {entries?.length === 0 && (
                  <tr>
                    <td colSpan={user?.role === "ADMIN" ? 6 : 5} className="px-4 py-6 text-center text-[var(--text-muted)]">
                      No time entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

