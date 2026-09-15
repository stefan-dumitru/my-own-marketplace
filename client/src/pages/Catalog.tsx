import type { CategoryView, ProductSummary } from "@stefanmarket/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function Catalog() {
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: () => apiFetch<{ categories: CategoryView[] }>("/catalog/categories"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["catalog", "products", { categoryId, q, minPrice, maxPrice, page }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (categoryId) params.set("category", categoryId);
      if (q) params.set("q", q);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("page", String(page));
      return apiFetch<{ products: ProductSummary[]; total: number; limit: number }>(
        `/catalog/products?${params.toString()}`,
      );
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPage(1);
      setter(v);
    };
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Products</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Search…"
          value={q}
          onChange={(e) => resetPageAnd(setQ)(e.target.value)}
        />
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={categoryId}
          onChange={(e) => resetPageAnd(setCategoryId)(e.target.value)}
        >
          <option value="">All categories</option>
          {categoriesData?.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Min price"
          type="number"
          value={minPrice}
          onChange={(e) => resetPageAnd(setMinPrice)(e.target.value)}
        />
        <input
          className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Max price"
          type="number"
          value={maxPrice}
          onChange={(e) => resetPageAnd(setMaxPrice)(e.target.value)}
        />
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
      {data && data.products.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No products match your filters.</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {data?.products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.slug}`}
            className="rounded-md border border-border p-3 hover:border-primary"
          >
            <div className="aspect-square overflow-hidden rounded-md bg-muted">
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
              )}
            </div>
            <p className="mt-2 truncate text-sm font-medium">{product.title}</p>
            <p className="text-sm text-muted-foreground">
              {product.basePrice} {product.currency}
            </p>
          </Link>
        ))}
      </div>

      {data && data.total > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </main>
  );
}
