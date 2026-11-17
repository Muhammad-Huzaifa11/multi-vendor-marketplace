"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

type ToastTone = "info" | "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  pushToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item toast-item--${toast.tone}`}
            role="status"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.replaceAll(" ", "_").toLowerCase();
  const className =
    normalized === "shipped"
      ? "status-badge status-badge--shipped"
      : normalized === "partially_shipped"
        ? "status-badge status-badge--partially_shipped"
        : normalized === "archived"
          ? "status-badge status-badge--archived"
          : normalized === "pending"
            ? "status-badge status-badge--pending"
            : "status-badge status-badge--neutral";

  return (
    <span className={className}>{status.replaceAll("_", " ")}</span>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline-primary" | "success" | "outline-danger" | "outline-secondary" | "light";
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`.trim()}
      {...props}
    />
  );
}

export function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`surface-card ${className}`.trim()}>{children}</div>;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="spinner-border text-primary mb-3" aria-hidden="true" />
      <div className="text-muted">{label}</div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="empty-state">
      <h2 className="h5 mb-2">{title}</h2>
      {description && <p className="text-muted mb-3">{description}</p>}
      {actionHref && actionLabel && (
        <Link className="btn btn-primary" href={actionHref}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <div className="fw-semibold mb-2">Something went wrong</div>
      <div className="mb-3">{message}</div>
      {onRetry && (
        <Button variant="outline-primary" type="button" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function ProductImage({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  const fallback =
    "https://placehold.co/800x600/e2e8f0/64748b/png?text=Product";
  const [current, setCurrent] = useState(src || fallback);

  useEffect(() => {
    setCurrent(src || fallback);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      onError={() => setCurrent(fallback)}
    />
  );
}
