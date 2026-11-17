"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ErrorState } from "@/components/StateMessage";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
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
      router.push(data.user.role === "seller" ? "/seller/products" : "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <h1 className="h3 mb-3">Log in</h1>
        {error && <ErrorState message={error} />}
        <form className="card card-body shadow-sm" onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-control" required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              className="form-control"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Log in"}
          </button>
        </form>
        <div className="alert alert-light border mt-3 small mb-0">
          <div className="fw-semibold mb-1">Demo accounts (password: <code>password</code>)</div>
          <ul className="mb-0 ps-3">
            <li>
              Buyer: <code>buyer@example.com</code>
            </li>
            <li>
              Seller: <code>seller1@example.com</code> / <code>seller2@example.com</code>
            </li>
          </ul>
        </div>
        <p className="mt-3 small">
          No account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
