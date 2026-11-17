"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, formatMoney, type Product } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateMessage";

type Meta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export default function CatalogPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("price_asc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: "12",
          sort,
        });
        if (q) params.set("q", q);
        if (category) params.set("category", category);
        const data = await api<{ products: Product[]; meta: Meta }>(
          `/products?${params}`
        );
        if (!cancelled) {
          setProducts(data.products);
          setMeta(data.meta);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [q, category, sort, page]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    setQ(String(data.get("q") || ""));
    setCategory(String(data.get("category") || ""));
    setSort(String(data.get("sort") || "price_asc"));
  }

  function handleAdd(product: Product) {
    if (user?.role !== "buyer") {
      setMessage("Log in as a buyer to add items to your cart.");
      return;
    }
    if (product.stock < 1) {
      setMessage("Out of stock.");
      return;
    }
    addToCart({
      product_id: product.id,
      title: product.title,
      price_cents: product.price_cents,
      quantity: 1,
      seller_name: product.seller?.store_name,
      image_url: product.image_url,
    });
    setMessage(`Added “${product.title}” to cart.`);
  }

  const canBuy = user?.role === "buyer";


  return (
    <div>
      <h1 className="h3 mb-3">Catalog</h1>

      <form className="row g-2 mb-4" onSubmit={onSearch}>
        <div className="col-md-4">
          <input
            name="q"
            className="form-control"
            placeholder="Search title"
            defaultValue={q}
          />
        </div>
        <div className="col-md-3">
          <select name="category" className="form-select" defaultValue={category}>
            <option value="">All categories</option>
            {["Home", "Office", "Electronics", "Fashion", "Food", "Sports"].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>
        </div>
        <div className="col-md-3">
          <select name="sort" className="form-select" defaultValue={sort}>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" type="submit">
            Apply
          </button>
        </div>
      </form>

      {message && <div className="alert alert-info">{message}</div>}
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && products.length === 0 && (
        <EmptyState label="No products match your filters." />
      )}

      <div className="row g-3">
        {products.map((product) => (
          <div className="col-sm-6 col-lg-4" key={product.id}>
            <div className="card product-card shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  product.image_url ||
                  "https://placehold.co/400x400/e9ecef/495057/png?text=Product"
                }
                alt={product.title}
              />
              <div className="card-body d-flex flex-column">
                <h2 className="h6 card-title">{product.title}</h2>
                <p className="card-text small text-muted mb-1">
                  {product.category} · {product.seller?.store_name}
                </p>
                <p className="fw-semibold mb-1">{formatMoney(product.price_cents)}</p>
                <p className="small mb-3">Stock: {product.stock}</p>
                {canBuy ? (
                  <button
                    className="btn btn-outline-primary mt-auto"
                    type="button"
                    disabled={product.stock < 1}
                    onClick={() => handleAdd(product)}
                  >
                    Add to cart
                  </button>
                ) : (
                  <p className="small text-muted mt-auto mb-0">
                    {user?.role === "seller"
                      ? "Switch to a buyer account to purchase."
                      : "Log in as a buyer to add to cart."}
                  </p>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {meta && meta.total_pages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <button
            className="btn btn-outline-secondary"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-muted small">
            Page {meta.page} of {meta.total_pages} ({meta.total} items)
          </span>
          <button
            className="btn btn-outline-secondary"
            type="button"
            disabled={page >= meta.total_pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
