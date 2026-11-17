"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, ErrorState, SurfaceCard, useToast } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { pushToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const passwordConfirmation = String(form.get("password_confirmation"));
    if (password !== passwordConfirmation) {
      setFieldError("Passwords do not match");
      setSubmitting(false);
      return;
    }
    try {
      const data = await api<{ user: User }>("/signup", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password,
          password_confirmation: passwordConfirmation,
          role: form.get("role"),
          store_name: form.get("store_name") || undefined,
        }),
      });
      await refresh();
      pushToast("Account created", "success");
      router.push(data.user.role === "seller" ? "/seller/products" : "/");
    } catch (err) {
      const msg =
        err instanceof ApiError &&
        typeof err.body === "object" &&
        err.body &&
        "errors" in err.body
          ? (err.body as { errors: string[] }).errors.join(", ")
          : err instanceof Error
            ? err.message
            : "Signup failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="page-title text-center">Sign up</h1>
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
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="password_confirmation">
              Confirm password
            </label>
            <input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              className={`form-control ${fieldError ? "is-invalid" : ""}`}
              minLength={6}
              autoComplete="new-password"
              required
            />
            {fieldError && (
              <div className="invalid-feedback d-block">{fieldError}</div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="role">
              Role
            </label>
            <select id="role" name="role" className="form-select" defaultValue="buyer">
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="store_name">
              Store name (sellers)
            </label>
            <input
              id="store_name"
              name="store_name"
              className="form-control"
              placeholder="Shown on your products instead of your email"
            />
          </div>
          <Button className="w-100" type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </Button>
        </form>
      </SurfaceCard>
      <p className="mt-3 small text-center">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
