"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type Order } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import {
  clearCart,
  groupCartBySeller,
  readCart,
  type CartItem,
} from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  SurfaceCard,
  useToast,
} from "@/components/ui";

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `key-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { pushToast } = useToast();
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
  const groups = useMemo(() => groupCartBySeller(items), [items]);

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
      pushToast("Payment successful", "success");
      router.push(`/orders?created=${data.orders.length}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: string };
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
    return (
      <EmptyState
        title="Buyer login required"
        description="Log in as a buyer to complete checkout."
        actionHref="/login"
        actionLabel="Log in"
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add products before paying."
        actionHref="/"
        actionLabel="Browse catalog"
      />
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-7">
        <h1 className="page-title">Checkout</h1>
        <p className="text-muted">
          Mock payment — one checkout creates a separate order per seller. The
          platform keeps a 10% commission.
        </p>
        {error && <ErrorState message={error} onRetry={pay} />}

        <SurfaceCard className="p-4 mb-3">
          {groups.map(([seller, sellerItems]) => (
            <div key={seller} className="mb-3">
              <div className="fw-semibold mb-2">{seller}</div>
              <ul className="list-unstyled mb-0">
                {sellerItems.map((item) => (
                  <li
                    className="d-flex justify-content-between py-1"
                    key={item.product_id}
                  >
                    <span>
                      {item.title} × {item.quantity}
                    </span>
                    <span>{formatMoney(item.price_cents * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <hr />
          <div className="d-flex justify-content-between fw-bold">
            <span>Estimated total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </SurfaceCard>

        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="success"
            className="btn-lg btn-touch flex-grow-1 flex-sm-grow-0"
            type="button"
            disabled={paying}
            onClick={pay}
          >
            {paying ? "Processing…" : "Pay now"}
          </Button>
          <Link
            className="btn btn-outline-secondary btn-lg btn-touch flex-grow-1 flex-sm-grow-0"
            href="/cart"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}
