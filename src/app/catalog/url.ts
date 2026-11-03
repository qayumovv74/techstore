import type { CatalogFilters } from "@/lib/catalog";

/** Собирает ссылку каталога из текущих фильтров + изменений. Пустые значения выкидывает. */
export function catalogHref(f: CatalogFilters, patch: Partial<CatalogFilters> = {}) {
  const next = { ...f, page: 1, ...patch };
  const sp = new URLSearchParams();
  if (next.q) sp.set("q", next.q);
  if (next.category) sp.set("category", next.category);
  next.brands.forEach((b) => sp.append("brand", b));
  if (next.min) sp.set("min", String(next.min));
  if (next.max) sp.set("max", String(next.max));
  if (next.inStock) sp.set("stock", "1");
  if (next.sort !== "popular") sp.set("sort", next.sort);
  if (next.page > 1) sp.set("page", String(next.page));
  const qs = sp.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}
