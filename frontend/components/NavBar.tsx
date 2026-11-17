"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { readCart } from "@/lib/cart";
import { Button } from "@/components/ui";

export default function NavBar() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [open, setOpen] = useState(false);


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

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="site-header">
      <nav className="navbar navbar-expand-lg">
        <div className="container">
          <Link className="navbar-brand" href="/" onClick={closeMenu}>
            Marketplace
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            aria-controls="mainNav"
            aria-expanded={open}
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div
            className={`collapse navbar-collapse ${open ? "show" : ""}`}
            id="mainNav"
          >
            <div className="navbar-nav mx-lg-auto my-2 my-lg-0 gap-lg-1">
              <Link className="nav-link" href="/" onClick={closeMenu}>
                Catalog
              </Link>
              {user?.role === "buyer" && (
                <>
                  <Link className="nav-link" href="/orders" onClick={closeMenu}>
                    Orders
                  </Link>
                </>
              )}
              {user?.role === "seller" && (
                <>
                  <Link
                    className="nav-link"
                    href="/seller/products"
                    onClick={closeMenu}
                  >
                    My products
                  </Link>
                  <Link
                    className="nav-link"
                    href="/seller/orders"
                    onClick={closeMenu}
                  >
                    Seller orders
                  </Link>
                </>
              )}
            </div>

            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 ms-lg-auto">
              {user?.role === "buyer" && (
                <Link
                  className="nav-link cart-link"
                  href="/cart"
                  onClick={closeMenu}
                  aria-label={`Cart, ${cartCount} items`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="9" cy="20" r="1.2" fill="currentColor" />
                    <circle cx="18" cy="20" r="1.2" fill="currentColor" />
                  </svg>
                  <span>Cart</span>


                  {cartCount > 0 && (
                    <span className="cart-badge">{cartCount}</span>
                  )}
                </Link>
              )}

              {!loading && !user && (
                <>
                  <Link
                    className="btn btn-outline-primary btn-sm"
                    href="/login"
                    onClick={closeMenu}
                  >
                    Log in
                  </Link>
                  <Link
                    className="btn btn-primary btn-sm"
                    href="/signup"
                    onClick={closeMenu}
                  >
                    Sign up
                  </Link>
                </>
              )}

              {user && (
                <>
                  <div className="user-chip">
                    <strong>{user.email}</strong>
                    <span>{user.role}</span>
                  </div>
                  <Button
                    variant="outline-secondary"
                    className="btn-sm"
                    type="button"
                    onClick={async () => {
                      closeMenu();
                      await logout();
                      router.push("/");
                    }}
                  >
                    Log out
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
