"use client";

import { useEffect, useState } from "react";
import { api, type Order } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
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

export default function SellerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { pushToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ orders: Order[] }>("/seller/orders");
      setOrders(data.orders);
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

  async function shipItem(id: number) {
    setBusyId(id);
    try {
      await api(`/seller/order_items/${id}/ship`, {
        method: "POST",
        body: "{}",
      });
      pushToast("Item marked as shipped", "success");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark shipped");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || loading) return <LoadingState label="Loading seller orders…" />;
  if (!user || user.role !== "seller") {
    return (
      <EmptyState
        title="Seller access required"
        description="Log in with a seller account to manage fulfillment."
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
      <h1 className="page-title">Seller orders</h1>
      <p className="text-muted">
        Platform commission (10%) is shown per order. Mark each item as shipped.
      </p>
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders appear here when buyers purchase your products."
        />
      ) : (
        <div className="vstack gap-0">
          {orders.map((order) => (
            <SurfaceCard className="order-card p-4" key={order.id}>
              <div className="d-flex justify-content-between flex-wrap gap-3 mb-3">
                <div>
                  <h2 className="h5 mb-2">
                    Order #{order.id} <StatusBadge status={order.status} />
                  </h2>
                  <div className="small text-muted">
                    Buyer: {order.buyer?.email}
                    {order.created_at ? ` · ${formatDate(order.created_at)}` : ""}
                  </div>
                </div>
                <div className="text-end small">
                  <div>Subtotal {formatMoney(order.subtotal_cents)}</div>
                  <div className="text-danger">
                    Commission {formatMoney(order.commission_cents)}
                  </div>
                  <div className="fw-bold text-success">
                    Earnings {formatMoney(order.seller_earnings_cents)}
                  </div>
                </div>
              </div>
              <ul className="list-group list-group-flush">
                {order.items.map((item) => (
                  <li className="list-group-item px-0 order-line" key={item.id}>
                    <span>
                      {item.title} × {item.quantity} @{" "}
                      {formatMoney(item.unit_price_cents)}
                    </span>
                    {item.shipped ? (
                      <StatusBadge status="shipped" />
                    ) : (
                      <Button
                        variant="outline-primary"
                        className="btn-touch"
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => shipItem(item.id)}
                      >
                        {busyId === item.id ? "Updating…" : "Mark shipped"}
                      </Button>
                    )}
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
