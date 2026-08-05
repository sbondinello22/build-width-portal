import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getPaymentsStatus } from "../api/settings";
import { FormField } from "../components/ui/FormField";

type SettingsTab = "profile" | "payments";

function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await updateProfile({
        name,
        email,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setCurrentPassword("");
      setNewPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Could not save changes. Check your current password and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      {saved && (
        <div className="mb-4 rounded-md bg-[var(--banner-success-bg)] px-3 py-2 text-sm text-[var(--banner-success-text)]">
          Profile updated.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md bg-[var(--banner-error-bg)] px-3 py-2 text-sm text-[var(--banner-error-text)]">
          {error}
        </div>
      )}
      <FormField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
      <FormField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

      <div className="mb-1 mt-4 text-sm font-medium text-[var(--text-primary)]">Change password</div>
      <p className="mb-3 text-xs text-[var(--text-muted)]">Leave blank to keep your current password.</p>
      <FormField
        label="Current Password"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
      />
      <FormField
        label="New Password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-md bg-[var(--brand-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        ok ? "bg-[var(--banner-success-bg)] text-[var(--banner-success-text)]" : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
      }`}
    >
      {label}
    </span>
  );
}

function PaymentsTab() {
  const { data: status, isLoading } = useQuery({ queryKey: ["settings", "payments-status"], queryFn: getPaymentsStatus });

  if (isLoading) return <p className="text-[var(--text-secondary)]">Loading…</p>;

  return (
    <div className="max-w-md space-y-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-primary)]">Stripe</h3>
          <StatusBadge
            ok={!!status?.stripeConfigured}
            label={status?.stripeConfigured ? `Connected · ${status.stripeMode === "live" ? "Live mode" : "Test mode"}` : "Not connected"}
          />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {status?.stripeConfigured
            ? "Invoices can be paid online via Stripe Checkout. Payouts go to whatever bank account is linked to this Stripe account."
            : "Add a Stripe secret key to your backend environment to accept online card payments."}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-primary)]">PayPal</h3>
          <StatusBadge ok={!!status?.paypalConfigured} label={status?.paypalConfigured ? "Connected" : "Not connected"} />
        </div>
        <p className="mb-3 text-sm text-[var(--text-secondary)]">
          Add your PayPal Client ID and Secret to your backend environment to enable PayPal as a payment option on
          invoices.
        </p>
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-muted)]"
        >
          Connect PayPal
        </button>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const isAdmin = user?.role === "ADMIN";

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: "profile", label: "Profile" },
    ...(isAdmin ? ([{ key: "payments", label: "Payments" }] as const) : []),
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>

      <div className="mb-6 flex overflow-hidden rounded-md border border-[var(--border)] w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.key ? "bg-[var(--brand-blue)] text-white" : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab />}
      {tab === "payments" && isAdmin && <PaymentsTab />}
    </div>
  );
}
