export type CartItem = {
  product_id: number;
  title: string;
  price_cents: number;
  quantity: number;
  seller_id?: number;
  seller_name?: string;
  image_url?: string | null;
  stock?: number;
};

const KEY = "marketplace_cart";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: CartItem): void {
  const cart = readCart();
  const existing = cart.find((c) => c.product_id === item.product_id);
  const maxStock = item.stock ?? existing?.stock;
  if (existing) {
    const nextQty = existing.quantity + item.quantity;
    existing.quantity =
      typeof maxStock === "number" ? Math.min(nextQty, maxStock) : nextQty;
    if (item.stock != null) existing.stock = item.stock;
    if (item.seller_name) existing.seller_name = item.seller_name;
    if (item.seller_id != null) existing.seller_id = item.seller_id;
  } else {
    cart.push(item);
  }
  writeCart(cart);
}

export function updateQuantity(productId: number, quantity: number): void {
  let cart = readCart();
  if (quantity <= 0) {
    cart = cart.filter((c) => c.product_id !== productId);
  } else {
    cart = cart.map((c) => {
      if (c.product_id !== productId) return c;
      const capped =
        typeof c.stock === "number" ? Math.min(quantity, c.stock) : quantity;
      return { ...c, quantity: capped };
    });
  }
  writeCart(cart);
}

export function removeFromCart(productId: number): void {
  writeCart(readCart().filter((c) => c.product_id !== productId));
}

export function clearCart(): void {
  writeCart([]);
}

export function groupCartBySeller(items: CartItem[]) {
  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = item.seller_name || (item.seller_id ? `Seller ${item.seller_id}` : "Seller");
    const list = groups.get(key) || [];
    list.push(item);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}
