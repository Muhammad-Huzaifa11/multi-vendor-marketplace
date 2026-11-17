"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, type Order } from "@/lib/api";
import { formatDate, formatMoney, sellerLabel } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  SurfaceCard,
} from "@/components/ui";

function OrdersContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const created = searchParams.get("created");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "buyer") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api<{ orders: Order[] }>("/orders");
        if (!cancelled) setOrders(data.orders);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, reloadToken]);

  if (authLoading || loading) return <LoadingState label="Loading orders…" />;
  if (!user || user.role !== "buyer") {
    return (
      <EmptyState
        title="Buyer login required"
        description="Log in as a buyer to view order history."
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
      <h1 className="page-title">Your orders</h1>
      {created && (
        <div className="alert alert-success border-0 shadow-sm">
          Checkout complete — created {created} order(s).
        </div>
      )}
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you check out, each seller gets their own order."
          actionHref="/"
          actionLabel="Browse catalog"
        />
      ) : (
        <div className="vstack gap-0">
          {orders.map((order) => (
            <SurfaceCard className="order-card p-4" key={order.id}>
              <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-2">
                    Order #{order.id}{" "}
                    <StatusBadge status={order.status} />
                  </h2>
                  <div className="small text-muted">
                    {sellerLabel(order.seller)}
                    {order.created_at ? ` · ${formatDate(order.created_at)}` : ""}
                  </div>
                </div>
                <div className="text-end">
                  <div className="fw-bold">{formatMoney(order.subtotal_cents)}</div>
                  <div className="small text-muted">Order total</div>
                </div>
              </div>
              <ul className="list-group list-group-flush">
                {order.items.map((item) => (
                  <li className="list-group-item px-0 order-line" key={item.id}>
                    <span>
                      {item.title} × {item.quantity}{" "}
                      {item.shipped && <StatusBadge status="shipped" />}
                    </span>
                    <span>
                      {formatMoney(item.unit_price_cents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrdersContent />
    </Suspense>
  );
}
