"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError, type Product } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  SurfaceCard,
  useToast,
} from "@/components/ui";

export default function SellerProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const { pushToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ products: Product[] }>("/seller/products");
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "seller") {
      setLoading(false);
      return;
    }
    load();
  }, [user, authLoading, reloadToken]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    // Capture before await — React nulls e.currentTarget after the handler yields.
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const rawImage = String(form.get("image_url") || "").trim();
    const imageUrl =
      !rawImage || rawImage.toLowerCase() === "nil" ? null : rawImage;
    try {
      await api("/seller/products", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          price_cents: Math.round(Number(form.get("price")) * 100),
          stock: Number(form.get("stock")),
          category: form.get("category"),
          image_url: imageUrl,
        }),
      });
      formEl.reset();
      pushToast("Product created", "success");
      await load();
    } catch (err) {
      const msg =
        err instanceof ApiError &&
        typeof err.body === "object" &&
        err.body &&
        "errors" in err.body
          ? (err.body as { errors: string[] }).errors.join(", ")
          : err instanceof Error
            ? err.message
            : "Could not create product";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function archive(id: number) {
    await api(`/seller/products/${id}`, { method: "DELETE" });
    pushToast("Product archived", "info");
    await load();
  }

  async function restore(id: number) {
    await api(`/seller/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: true }),
    });
    pushToast("Product restored", "success");
    await load();
  }

  if (authLoading || loading) return <LoadingState label="Loading products…" />;
  if (!user || user.role !== "seller") {
    return (
      <EmptyState
        title="Seller access required"
        description="Log in with a seller account to manage products."
        actionHref="/login"
        actionLabel="Log in"
      />
    );
  }
  if (error) {
    return (
      <ErrorState message={error} onRetry={() => setReloadToken((n) => n + 1)} />
    );
  }

  return (
    <div>
      <h1 className="page-title">My products</h1>

      <SurfaceCard className="p-4 mb-4">
        <h2 className="h5 mb-3">Create product</h2>
        {formError && <ErrorState message={formError} />}
        <form className="row g-3" onSubmit={onCreate}>
          <div className="col-md-6">
            <label className="form-label" htmlFor="title">
              Title
            </label>
            <input id="title" name="title" className="form-control" required />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="price">
              Price (USD)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="stock">
              Stock
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              className="form-control"
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              name="category"
              className="form-control"
              required
            />
          </div>
          <div className="col-md-8">
            <label className="form-label" htmlFor="image_url">
              Image URL
            </label>
            <input id="image_url" name="image_url" className="form-control" />
          </div>
          <div className="col-12">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create product"}
            </Button>
          </div>
        </form>
      </SurfaceCard>

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create your first listing with the form above."
        />
      ) : (
        <>
          <div className="seller-product-table table-responsive surface-card">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className={p.active === false ? "muted-row" : undefined}
                  >
                    <td>{p.title}</td>
                    <td>{formatMoney(p.price_cents)}</td>
                    <td>{p.stock}</td>
                    <td>{p.category}</td>
                    <td>
                      {p.active === false ? (
                        <StatusBadge status="archived" />
                      ) : (
                        <StatusBadge status="active" />
                      )}
                    </td>
                    <td className="text-end">
                      {p.active !== false ? (
                        <Button
                          variant="outline-danger"
                          className="btn-sm"
                          type="button"
                          onClick={() => archive(p.id)}
                        >
                          Archive
                        </Button>
                      ) : (
                        <Button
                          variant="outline-secondary"
                          className="btn-sm"
                          type="button"
                          onClick={() => restore(p.id)}
                        >
                          Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="seller-product-list">
            {products.map((p) => (
              <SurfaceCard
                key={p.id}
                className={`p-3 ${p.active === false ? "muted-row" : ""}`}
              >
                <div className="d-flex justify-content-between gap-2 mb-2">
                  <h2 className="h6 mb-0">{p.title}</h2>
                  {p.active === false ? (
                    <StatusBadge status="archived" />
                  ) : (
                    <StatusBadge status="active" />
                  )}
                </div>
                <div className="small text-muted mb-3">
                  {p.category} · {formatMoney(p.price_cents)} · Stock {p.stock}
                </div>
                {p.active !== false ? (
                  <Button
                    variant="outline-danger"
                    className="btn-sm"
                    type="button"
                    onClick={() => archive(p.id)}
                  >
                    Archive
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    className="btn-sm"
                    type="button"
                    onClick={() => restore(p.id)}
                  >
                    Restore
                  </Button>
                )}
              </SurfaceCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
