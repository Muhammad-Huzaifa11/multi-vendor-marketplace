"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, ErrorState, SurfaceCard, useToast } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { pushToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const data = await api<{ user: User }>("/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      await refresh();
      pushToast("Welcome back", "success");
      router.push(data.user.role === "seller" ? "/seller/products" : "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="page-title text-center">Log in</h1>
      {error && <ErrorState message={error} />}
      <SurfaceCard className="p-4">
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              autoComplete="email"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              autoComplete="current-password"
              required
            />
          </div>
          <Button className="w-100" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Log in"}
          </Button>
        </form>
      </SurfaceCard>

      <SurfaceCard className="p-3 mt-3">
        <div className="fw-semibold mb-2">Demo accounts</div>
        <p className="small text-muted mb-2">
          Password for all accounts: <code>password</code>
        </p>
        <ul className="small mb-0 ps-3">
          <li>
            Buyer: <code>buyer@example.com</code>
          </li>
          <li>
            Sellers: <code>seller1@example.com</code>,{" "}
            <code>seller2@example.com</code>
          </li>
        </ul>
      </SurfaceCard>

      <p className="mt-3 small text-center">
        No account? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  );
}
