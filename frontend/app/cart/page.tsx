"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/api";
import { readCart, updateQuantity, type CartItem } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { EmptyState, LoadingState } from "@/components/StateMessage";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  if (authLoading) return <LoadingState />;
  if (!user || user.role !== "buyer") {
    return (
      <EmptyState label="Log in as a buyer to view your cart." />
    );
  }

  const total = items.reduce((s, i) => s + i.price_cents * i.quantity, 0);

  return (
    <div>
      <h1 className="h3 mb-3">Cart</h1>
      {items.length === 0 ? (
        <EmptyState label="Your cart is empty." />
      ) : (
        <>
          <div className="table-responsive card shadow-sm">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product_id}>
                    <td>{item.title}</td>
                    <td className="small text-muted">{item.seller_email}</td>
                    <td>{formatMoney(item.price_cents)}</td>
                    <td style={{ maxWidth: 100 }}>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min={0}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.product_id, Number(e.target.value))
                        }
                      />
                    </td>
                    <td>{formatMoney(item.price_cents * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <strong>Estimated total: {formatMoney(total)}</strong>
            <Link className="btn btn-primary" href="/checkout">
              Checkout
            </Link>
          </div>
          <p className="small text-muted mt-2">
            Final prices are confirmed by the server at checkout.
          </p>
        </>
      )}
    </div>
  );
}
