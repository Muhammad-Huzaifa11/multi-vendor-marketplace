"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, formatMoney, type Order } from "@/lib/api";
import { clearCart, readCart, type CartItem } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateMessage";

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `key-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(readCart());
  }, []);

  const total = useMemo(
    () => items.reduce((s, i) => s + i.price_cents * i.quantity, 0),
    [items]
  );

  async function pay() {
    setPaying(true);
    setError(null);
    try {
      const data = await api<{ orders: Order[] }>("/checkout", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
        }),
      });
      clearCart();
      router.push(`/orders?created=${data.orders.length}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: string; unavailable?: unknown };
        setError(body.error || err.message);
      } else {
        setError("Payment failed");
      }
    } finally {
      setPaying(false);
    }
  }

  if (authLoading) return <LoadingState />;
  if (!user || user.role !== "buyer") {
    return <EmptyState label="Log in as a buyer to checkout." />;
  }
  if (items.length === 0) {
    return <EmptyState label="Your cart is empty." />;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-7">
        <h1 className="h3 mb-3">Checkout</h1>
        <p className="text-muted">
          Mock payment — one checkout creates a separate order per seller. The
          platform keeps a 10% commission.
        </p>
        {error && <ErrorState message={error} />}
        <ul className="list-group mb-3 shadow-sm">
          {items.map((item) => (
            <li
              className="list-group-item d-flex justify-content-between"
              key={item.product_id}
            >
              <span>
                {item.title} × {item.quantity}
                <span className="text-muted small d-block">{item.seller_email}</span>
              </span>
              <span>{formatMoney(item.price_cents * item.quantity)}</span>
            </li>
          ))}
          <li className="list-group-item d-flex justify-content-between fw-semibold">
            <span>Estimated total</span>
            <span>{formatMoney(total)}</span>
          </li>
        </ul>
        <button
          className="btn btn-success btn-lg"
          type="button"
          disabled={paying}
          onClick={pay}
        >
          {paying ? "Processing…" : "Pay now"}
        </button>
      </div>
    </div>
  );
}
