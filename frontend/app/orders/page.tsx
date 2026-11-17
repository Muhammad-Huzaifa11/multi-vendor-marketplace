"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, formatMoney, type Order } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateMessage";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "shipped":
      return "text-bg-success";
    case "partially_shipped":
      return "text-bg-info";
    default:
      return "text-bg-secondary";
  }
}

function formatDate(value?: string): string {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function OrdersContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || loading) return <LoadingState />;
  if (!user || user.role !== "buyer") {
    return <EmptyState label="Log in as a buyer to view order history." />;
  }
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1 className="h3 mb-3">Your orders</h1>
      {created && (
        <div className="alert alert-success">
          Checkout complete — created {created} order(s).
        </div>
      )}
      {orders.length === 0 ? (
        <EmptyState label="No orders yet." />
      ) : (
        <div className="vstack gap-3">
          {orders.map((order) => (
            <div className="card shadow-sm" key={order.id}>
              <div className="card-body">
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <div>
                    <h2 className="h6 mb-1">
                      Order #{order.id}{" "}
                      <span className={`badge ${statusBadgeClass(order.status)}`}>
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </h2>
                    <div className="small text-muted">
                      {order.seller?.store_name}
                      {order.created_at ? ` · ${formatDate(order.created_at)}` : ""}
                    </div>
                  </div>
                  <div className="text-end small">
                    <div className="fw-semibold">
                      Total {formatMoney(order.subtotal_cents)}
                    </div>
                  </div>
                </div>
                <ul className="list-group list-group-flush mt-3">
                  {order.items.map((item) => (
                    <li
                      className="list-group-item px-0 d-flex justify-content-between"
                      key={item.id}
                    >
                      <span>
                        {item.title} × {item.quantity}
                        {item.shipped && (
                          <span className="badge text-bg-success ms-2">Shipped</span>
                        )}
                      </span>
                      <span>{formatMoney(item.unit_price_cents * item.quantity)}</span>
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

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrdersContent />
    </Suspense>
  );
}
