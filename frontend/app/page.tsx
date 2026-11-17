"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, type Product } from "@/lib/api";
import { formatMoney, soldByLabel } from "@/lib/format";
import { addToCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import {
  Button,
  CatalogSkeleton,
  EmptyState,
  ErrorState,
  ProductImage,
  useToast,
} from "@/components/ui";

type Meta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  categories?: string[];
};

const FALLBACK_CATEGORIES = [
  "Home",
  "Office",
  "Electronics",
  "Fashion",
  "Food",
  "Sports",
];


function stockLabel(stock: number) {
  if (stock <= 0) return { text: "Out of stock", className: "stock-out" };
  if (stock <= 5)
    return { text: `Only ${stock} left`, className: "stock-low" };
  return { text: `${stock} in stock`, className: "stock-ok" };
}

export default function CatalogPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("price_asc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(
    async (attempt = 1) => {
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
        setProducts(data.products);
        setMeta(data.meta);
      } catch (e) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
          return load(attempt + 1);
        }
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [q, category, sort, page]
  );

  useEffect(() => {
    load();
  }, [load, reloadToken]);

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
      pushToast("Log in as a buyer to add items to your cart.", "info");
      return;
    }
    if (product.stock < 1) {
      pushToast("Out of stock.", "error");
      return;
    }
    addToCart({
      product_id: product.id,
      title: product.title,
      price_cents: product.price_cents,
      quantity: 1,
      seller_id: product.seller?.id,
      seller_name:
        product.seller?.store_name?.trim() ||
        (product.seller?.id ? `Seller ${product.seller.id}` : "Marketplace seller"),
      image_url: product.image_url,
      stock: product.stock,
    });

    pushToast(`Added “${product.title}” to cart`, "success");
  }

  const canBuy = user?.role === "buyer";
  const pageNumbers =
    meta && meta.total_pages > 0
      ? Array.from({ length: meta.total_pages }, (_, i) => i + 1).slice(
          Math.max(0, page - 3),
          Math.max(0, page - 3) + 5
        )
      : [];

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <h1 className="page-title mb-1">Catalog</h1>
          <p className="text-muted mb-0">
            Browse products from multiple sellers in one place.
          </p>
        </div>
        {meta && !loading && !error && (
          <div className="text-muted small">
            {meta.total} result{meta.total === 1 ? "" : "s"}
          </div>
        )}
      </div>

      <form className="filter-bar row g-2 align-items-end" onSubmit={onSearch}>
        <div className="col-md-4">
          <label className="form-label" htmlFor="catalog-q">
            Search
          </label>
          <input
            id="catalog-q"
            name="q"
            className="form-control"
            placeholder="Search by title"
            defaultValue={q}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="catalog-category">
            Category
          </label>
          <select
            id="catalog-category"
            name="category"
            className="form-select"
            defaultValue={category}
            key={`categories-${(meta?.categories || FALLBACK_CATEGORIES).join("|")}-${category}`}
          >
            <option value="">All categories</option>
            {(meta?.categories?.length
              ? meta.categories
              : FALLBACK_CATEGORIES
            ).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="catalog-sort">
            Sort
          </label>
          <select
            id="catalog-sort"
            name="sort"
            className="form-select"
            defaultValue={sort}
          >
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
        <div className="col-12 col-md-2">
          <Button className="w-100 btn-touch" type="submit">
            Apply
          </Button>
        </div>
      </form>

      {loading && <CatalogSkeleton />}
      {error && (
        <ErrorState
          message={error}
          onRetry={() => setReloadToken((n) => n + 1)}
        />
      )}
      {!loading && !error && products.length === 0 && (
        <EmptyState
          title="No products match your filters"
          description="Try clearing search or picking another category."
          actionHref="/"
          actionLabel="Reset catalog"
        />
      )}

      {!loading && !error && products.length > 0 && (
        <div className="product-grid">
          {products.map((product) => {
            const stock = stockLabel(product.stock);
            return (
              <article className="product-card" key={product.id}>
                <div className="product-card__media">
                  <ProductImage src={product.image_url} alt={product.title} />
                </div>
                <div className="product-card__body">
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="chip">{product.category}</span>
                    <span className="chip">{soldByLabel(product.seller)}</span>
                  </div>
                  <h2 className="product-card__title">{product.title}</h2>
                  <p className="product-card__price">
                    {formatMoney(product.price_cents)}
                  </p>
                  <p className={`${stock.className} mb-2`}>{stock.text}</p>
                  {canBuy ? (
                    <Button
                      variant="outline-primary"
                      className="mt-auto"
                      type="button"
                      disabled={product.stock < 1}
                      onClick={() => handleAdd(product)}
                    >
                      Add to cart
                    </Button>
                  ) : (
                    <p className="small text-muted mt-auto mb-0">
                      {user?.role === "seller"
                        ? "Switch to a buyer account to purchase."
                        : "Log in as a buyer to add to cart."}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {meta && meta.total_pages > 1 && !loading && !error && (
        <nav
          className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4"
          aria-label="Catalog pagination"
        >
          <Button
            variant="outline-secondary"
            className="btn-touch"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <div className="d-flex gap-1 flex-wrap">
            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                className={`btn pagination-btn ${
                  n === page ? "btn-primary" : "btn-outline-secondary"
                }`}
                aria-current={n === page ? "page" : undefined}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <Button
            variant="outline-secondary"
            className="btn-touch"
            type="button"
            disabled={page >= meta.total_pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
