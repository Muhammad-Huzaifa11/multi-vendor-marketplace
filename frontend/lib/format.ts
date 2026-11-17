export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(value?: string): string {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

/** Frontend-only label — never expose seller email on buyer-facing UI. */
export function sellerLabel(seller?: {
  id?: number;
  store_name?: string | null;
}): string {
  if (seller?.store_name?.trim()) return seller.store_name.trim();
  if (seller?.id) return `Seller ${seller.id}`;
  return "Marketplace seller";
}

export function soldByLabel(seller?: {
  id?: number;
  store_name?: string | null;
}): string {
  const name = sellerLabel(seller);
  if (name.startsWith("Seller ")) return `Sold by ${name}`;
  return name;
}
