"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError, formatMoney, type Product } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateMessage";

export default function SellerProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
  }, [user, authLoading]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api("/seller/products", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          price_cents: Math.round(Number(form.get("price")) * 100),
          stock: Number(form.get("stock")),
          category: form.get("category"),
          image_url: form.get("image_url"),
        }),
      });
      e.currentTarget.reset();
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
    await load();
  }

  async function restore(id: number) {
    await api(`/seller/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: true }),
    });
    await load();
  }


  if (authLoading || loading) return <LoadingState />;
  if (!user || user.role !== "seller") {
    return <EmptyState label="Seller access required." />;
  }
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1 className="h3 mb-3">My products</h1>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h6">Create product</h2>
          {formError && <ErrorState message={formError} />}
          <form className="row g-2" onSubmit={onCreate}>
            <div className="col-md-4">
              <input name="title" className="form-control" placeholder="Title" required />
            </div>
            <div className="col-md-2">
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="Price"
                required
              />
            </div>
            <div className="col-md-2">
              <input
                name="stock"
                type="number"
                min="0"
                className="form-control"
                placeholder="Stock"
                required
              />
            </div>
            <div className="col-md-2">
              <input
                name="category"
                className="form-control"
                placeholder="Category"
                required
              />
            </div>
            <div className="col-md-8">
              <input
                name="image_url"
                className="form-control"
                placeholder="Image URL"
              />
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary w-100" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState label="No products yet." />
      ) : (
        <div className="table-responsive card shadow-sm">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.active === false ? "table-secondary" : ""}>
                  <td>{p.title}</td>
                  <td>{formatMoney(p.price_cents)}</td>
                  <td>{p.stock}</td>
                  <td>{p.category}</td>
                  <td>{p.active === false ? "No" : "Yes"}</td>
                  <td className="text-end">
                    {p.active !== false ? (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        type="button"
                        onClick={() => archive(p.id)}
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        type="button"
                        onClick={() => restore(p.id)}
                      >
                        Restore
                      </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
