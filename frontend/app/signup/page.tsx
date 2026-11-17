"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ErrorState } from "@/components/StateMessage";

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const passwordConfirmation = String(form.get("password_confirmation"));
    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
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
        }),
      });
      await refresh();
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
    <div className="row justify-content-center">
      <div className="col-md-5">
        <h1 className="h3 mb-3">Sign up</h1>
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
              minLength={6}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm password</label>
            <input
              name="password_confirmation"
              type="password"
              className="form-control"
              minLength={6}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Role</label>
            <select name="role" className="form-select" defaultValue="buyer">
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-3 small">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
