"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import {
  groupCartBySeller,
  readCart,
  removeFromCart,
  updateQuantity,
  type CartItem,
} from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import {
  Button,
  EmptyState,
  LoadingState,
  ProductImage,
  SurfaceCard,
} from "@/components/ui";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  const total = useMemo(
    () => items.reduce((s, i) => s + i.price_cents * i.quantity, 0),
    [items]
  );
  const groups = useMemo(() => groupCartBySeller(items), [items]);

  if (authLoading) return <LoadingState label="Loading cart…" />;
  if (!user || user.role !== "buyer") {
    return (
      <EmptyState
        title="Buyer login required"
        description="Log in as a buyer to view and manage your cart."
        actionHref="/login"
        actionLabel="Log in"
      />
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <h1 className="page-title">Cart</h1>
        <EmptyState
          title="Your cart is empty"
          description="Browse the catalog and add items from one or more sellers."
          actionHref="/"
          actionLabel="Browse catalog"
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Cart</h1>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="vstack gap-3">
            {items.map((item) => (
              <SurfaceCard key={item.product_id} className="p-3">
                <div className="cart-line">
                  <div className="cart-line__media">
                    <ProductImage src={item.image_url} alt={item.title} />
                  </div>
                  <div className="cart-line__body">
                    <div className="d-flex justify-content-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <h2 className="h6 mb-1">{item.title}</h2>
                        <div className="small text-muted">
                          {item.seller_name || "Marketplace seller"}
                        </div>
                      </div>
                      <div className="fw-semibold">
                        {formatMoney(item.price_cents * item.quantity)}
                      </div>
                    </div>
                    <div className="cart-line__actions">
                      <div
                        className="qty-stepper"
                        aria-label={`Quantity for ${item.title}`}
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateQuantity(item.product_id, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={
                            typeof item.stock === "number" &&
                            item.quantity >= item.stock
                          }
                          onClick={() =>
                            updateQuantity(item.product_id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <Button
                        variant="outline-danger"
                        className="btn-touch"
                        type="button"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        Remove
                      </Button>
                      <span className="small text-muted">
                        {formatMoney(item.price_cents)} each
                        {typeof item.stock === "number"
                          ? ` · ${item.stock} available`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <div className="col-lg-4">
          <SurfaceCard className="p-4 summary-card">
            <h2 className="h5 mb-3">Order summary</h2>
            <div className="vstack gap-3 mb-3">
              {groups.map(([seller, sellerItems]) => {
                const sub = sellerItems.reduce(
                  (s, i) => s + i.price_cents * i.quantity,
                  0
                );
                return (
                  <div key={seller}>
                    <div className="small text-muted mb-1">{seller}</div>
                    <ul className="list-unstyled mb-1 small">
                      {sellerItems.map((i) => (
                        <li
                          key={i.product_id}
                          className="d-flex justify-content-between gap-2"
                        >
                          <span>
                            {i.title} × {i.quantity}
                          </span>
                          <span>{formatMoney(i.price_cents * i.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex justify-content-between fw-semibold">
                      <span>Seller subtotal</span>
                      <span>{formatMoney(sub)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold mb-3">
              <span>Estimated total</span>
              <span>{formatMoney(total)}</span>
            </div>
            <Link className="btn btn-primary w-100 btn-lg" href="/checkout">
              Proceed to checkout
            </Link>
            <p className="small text-muted mt-3 mb-0">
              Final prices are confirmed by the server. Checkout splits into one
              order per seller.
            </p>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
