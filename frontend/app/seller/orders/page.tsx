"use client";

import { useEffect, useState } from "react";
import { api, formatMoney, type Order } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateMessage";

export default function SellerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

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
  }, [user, authLoading]);

  async function shipItem(id: number) {
    setBusyId(id);
    try {
      await api(`/seller/order_items/${id}/ship`, { method: "POST", body: "{}" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark shipped");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || loading) return <LoadingState />;
  if (!user || user.role !== "seller") {
    return <EmptyState label="Seller access required." />;
  }
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1 className="h3 mb-3">Seller orders</h1>
      <p className="text-muted">
        Platform commission (10%) is shown per order. Mark each item as shipped.
      </p>
      {orders.length === 0 ? (
        <EmptyState label="No orders yet." />
      ) : (
        <div className="vstack gap-3">
          {orders.map((order) => (
            <div className="card shadow-sm" key={order.id}>
              <div className="card-body">
                <div className="d-flex justify-content-between flex-wrap gap-2 mb-2">
                  <div>
                    <h2 className="h6 mb-1">
                      Order #{order.id}{" "}
                      <span
                        className={`badge ${
                          order.status === "shipped"
                            ? "text-bg-success"
                            : order.status === "partially_shipped"
                              ? "text-bg-info"
                              : "text-bg-secondary"
                        }`}
                      >
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </h2>
                    <div className="small text-muted">
                      Buyer: {order.buyer?.email}
                      {order.created_at
                        ? ` · ${new Date(order.created_at).toLocaleString()}`
                        : ""}
                    </div>

                  </div>
                  <div className="text-end small">
                    <div>Subtotal {formatMoney(order.subtotal_cents)}</div>
                    <div className="text-danger">
                      Commission {formatMoney(order.commission_cents)}
                    </div>
                    <div className="fw-semibold">
                      Your earnings {formatMoney(order.seller_earnings_cents)}
                    </div>
                  </div>
                </div>
                <ul className="list-group">
                  {order.items.map((item) => (
                    <li
                      className="list-group-item d-flex justify-content-between align-items-center"
                      key={item.id}
                    >
                      <span>
                        {item.title} × {item.quantity} @{" "}
                        {formatMoney(item.unit_price_cents)}
                      </span>
                      {item.shipped ? (
                        <span className="badge text-bg-success">Shipped</span>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => shipItem(item.id)}
                        >
                          {busyId === item.id ? "Updating…" : "Mark shipped"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
