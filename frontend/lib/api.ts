export type User = {
  id: number;
  email: string;
  role: "buyer" | "seller";
};

export type Product = {
  id: number;
  title: string;
  price_cents: number;
  stock: number;
  image_url: string | null;
  category: string;
  active?: boolean;
  seller?: { id: number; email: string };
};

export type OrderItem = {
  id: number;
  product_id: number;
  title: string;
  unit_price_cents: number;
  quantity: number;
  shipped: boolean;
};

export type Order = {
  id: number;
  subtotal_cents: number;
  commission_cents: number;
  seller_earnings_cents: number;
  status: string;
  created_at?: string;
  seller?: { id: number; email: string };
  buyer?: { id: number; email: string };
  items: OrderItem[];
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(typeof body === "object" && body && "error" in body ? String((body as { error: string }).error) : `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: "include",
  });


  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }

  return body as T;
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
