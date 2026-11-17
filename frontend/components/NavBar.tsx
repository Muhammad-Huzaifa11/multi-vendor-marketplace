"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { readCart } from "@/lib/cart";

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const sync = () =>
      setCartCount(readCart().reduce((sum, i) => sum + i.quantity, 0));
    sync();
    window.addEventListener("cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand" href="/">
          Marketplace
        </Link>
        <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
          <Link className="nav-link" href="/">
            Catalog
          </Link>
          {user?.role === "buyer" && (
            <>
              <Link className="nav-link" href="/cart">
                Cart ({cartCount})
              </Link>
              <Link className="nav-link" href="/orders">
                Orders
              </Link>
            </>
          )}
          {user?.role === "seller" && (
            <>
              <Link className="nav-link" href="/seller/products">
                My products
              </Link>
              <Link className="nav-link" href="/seller/orders">
                Seller orders
              </Link>
            </>
          )}
          {!loading && !user && (
            <>
              <Link className="nav-link" href="/login">
                Log in
              </Link>
              <Link className="nav-link" href="/signup">
                Sign up
              </Link>
            </>
          )}
          {user && (
            <>
              <span className="navbar-text text-white-50 small">
                {user.email} ({user.role})
              </span>
              <button
                className="btn btn-outline-light btn-sm"
                type="button"
                onClick={() => logout()}
              >
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
