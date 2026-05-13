import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { token, login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (token) {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="text-sm text-text-tertiary mt-1">Sign in to your account</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl bg-surface-secondary border border-border-primary p-6"
        >
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-border-primary bg-surface-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-primary bg-surface-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              placeholder="Enter password"
              required
            />
          </div>
          {error && (
            <div className="rounded-lg bg-danger-muted px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 px-4 py-2.5 text-sm text-white font-semibold transition-colors"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
