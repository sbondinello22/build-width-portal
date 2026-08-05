import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent, deleteEvent, listEvents, updateEvent } from "../api/schedule";
import type { ScheduleEvent } from "../api/schedule";
import { Modal } from "../components/ui/Modal";
import { FormField } from "../components/ui/FormField";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const REMINDER_OPTIONS = [
  { value: "none", label: "No reminder" },
  { value: "0", label: "At start time" },
  { value: "15", label: "15 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
  { value: "10080", label: "1 week before" },
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface EventFormState {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  reminder: string;
}

function EventModal({
  title,
  initial,
  submitLabel,
  pending,
  onClose,
  onSubmit,
  onDelete,
  deletePending,
}: {
  title: string;
  initial: EventFormState;
  submitLabel: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (state: EventFormState) => void;
  onDelete?: () => void;
  deletePending?: boolean;
}) {
  const [form, setForm] = useState(initial);

  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        <FormField
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <FormField
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <FormField
          label="Start"
          type="datetime-local"
          required
          value={form.startAt}
          onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
        />
        <FormField
          label="End (optional)"
          type="datetime-local"
          value={form.endAt}
          onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
        />
        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium text-[var(--text-secondary)]">Email reminder</span>
          <select
            value={form.reminder}
            onChange={(e) => setForm((f) => ({ ...f, reminder: e.target.value }))}
            className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
          >
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded-md bg-[var(--brand-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deletePending}
            className="mt-2 w-full rounded-md border border-[var(--danger-border,var(--border))] px-3 py-2 text-sm font-medium text-red-500 hover:bg-[var(--danger-hover-bg,var(--surface-2))] disabled:opacity-50"
          >
            {deletePending ? "Deleting…" : "Delete Event"}
          </button>
        )}
      </form>
    </Modal>
  );
}

export function SchedulePage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  const gridStart = useMemo(() => {
    const d = startOfMonth(month);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [month]);

  const gridDays = useMemo(() => {
    const days: Date[] = [];
    const cursor = new Date(gridStart);
    while (days.length < 42) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [gridStart]);

  const gridEnd = gridDays[gridDays.length - 1];

  const { data: events } = useQuery({
    queryKey: ["schedule", gridStart.toISOString(), gridEnd.toISOString()],
    queryFn: () => listEvents(gridStart, gridEnd),
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const event of events ?? []) {
      const key = new Date(event.startAt).toDateString();
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["schedule"] });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      invalidate();
      setNewEventDate(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ReturnType<typeof toInput>> }) => updateEvent(id, input),
    onSuccess: () => {
      invalidate();
      setEditingEvent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      invalidate();
      setEditingEvent(null);
    },
  });

  function toInput(form: EventFormState) {
    const startDate = new Date(form.startAt);
    let reminderAt: string | undefined;
    if (form.reminder !== "none") {
      const offsetMinutes = Number(form.reminder);
      reminderAt = new Date(startDate.getTime() - offsetMinutes * 60_000).toISOString();
    }
    return {
      title: form.title,
      description: form.description || undefined,
      startAt: startDate.toISOString(),
      endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
      reminderAt,
    };
  }

  const today = new Date();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Schedule &amp; Deadlines</h1>
        <button
          type="button"
          onClick={() => setNewEventDate(new Date())}
          className="rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)]"
        >
          New Event
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
          >
            ‹ Prev
          </button>
          <button
            type="button"
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
          >
            Next ›
          </button>
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-2)]">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {gridDays.map((day, i) => {
            const inMonth = day.getMonth() === month.getMonth();
            const isToday = sameDay(day, today);
            const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
            const visible = dayEvents.slice(0, 3);
            const overflow = dayEvents.length - visible.length;

            return (
              <div
                key={i}
                onClick={() => setNewEventDate(day)}
                className={`min-h-[96px] cursor-pointer border-b border-r border-[var(--border-subtle)] p-1.5 last:border-r-0 hover:bg-[var(--surface-2)] ${
                  inMonth ? "" : "opacity-40"
                }`}
              >
                <div
                  className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday ? "bg-[var(--brand-blue)] text-white" : "text-[var(--text-secondary)]"
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {visible.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEvent(event);
                      }}
                      className="block w-full truncate rounded bg-[var(--brand-blue)]/15 px-1.5 py-0.5 text-left text-xs font-medium text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/25"
                    >
                      {event.title}
                    </button>
                  ))}
                  {overflow > 0 && <div className="px-1.5 text-xs text-[var(--text-muted)]">+{overflow} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {newEventDate && (
        <EventModal
          title="New Event"
          submitLabel="Create Event"
          pending={createMutation.isPending}
          onClose={() => setNewEventDate(null)}
          initial={{
            title: "",
            description: "",
            startAt: toDatetimeLocal(
              new Date(
                newEventDate.getFullYear(),
                newEventDate.getMonth(),
                newEventDate.getDate(),
                9,
                0,
                0,
                0
              ).toISOString()
            ),
            endAt: "",
            reminder: "none",
          }}
          onSubmit={(form) => createMutation.mutate(toInput(form))}
        />
      )}

      {editingEvent && (
        <EventModal
          title="Edit Event"
          submitLabel="Save Changes"
          pending={updateMutation.isPending}
          onClose={() => setEditingEvent(null)}
          onDelete={() => deleteMutation.mutate(editingEvent.id)}
          deletePending={deleteMutation.isPending}
          initial={{
            title: editingEvent.title,
            description: editingEvent.description ?? "",
            startAt: toDatetimeLocal(editingEvent.startAt),
            endAt: editingEvent.endAt ? toDatetimeLocal(editingEvent.endAt) : "",
            reminder: editingEvent.reminderAt
              ? String(Math.round((new Date(editingEvent.startAt).getTime() - new Date(editingEvent.reminderAt).getTime()) / 60_000))
              : "none",
          }}
          onSubmit={(form) => updateMutation.mutate({ id: editingEvent.id, input: toInput(form) })}
        />
      )}
    </div>
  );
}
