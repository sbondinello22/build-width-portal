import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-[var(--text-primary)]">Create account</h1>
        {error && <div className="mb-4 rounded-md bg-[var(--banner-error-bg)] px-3 py-2 text-sm text-[var(--banner-error-text)]">{error}</div>}
        <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
        <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
        <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[var(--brand-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[var(--text-primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
