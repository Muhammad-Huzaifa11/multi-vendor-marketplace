export type CartItem = {
  product_id: number;
  title: string;
  price_cents: number;
  quantity: number;
  seller_name?: string;

  image_url?: string | null;
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
  if (existing) {
    existing.quantity += item.quantity;
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
    cart = cart.map((c) =>
      c.product_id === productId ? { ...c, quantity } : c
    );
  }
  writeCart(cart);
}

export function clearCart(): void {
  writeCart([]);
}
