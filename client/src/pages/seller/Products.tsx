import type { ProductSummary } from "@stefanmarket/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export function Products() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["seller", "products"],
    queryFn: () => apiFetch<{ products: ProductSummary[]; total: number }>("/seller/products"),
  });

  async function toggleActive(product: ProductSummary) {
    await apiFetch(`/seller/products/${product.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    queryClient.invalidateQueries({ queryKey: ["seller", "products"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} product(s)</p>
        <Link to="/seller/products/new" className={buttonVariants({})}>
          New product
        </Link>
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <p className="mt-6 text-sm text-destructive">
          Your seller account must be approved before you can manage products.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {data?.products.map((product) => (
          <li key={product.id} className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
            <div>
              <p className={cn("font-medium", !product.isActive && "text-muted-foreground")}>
                {product.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {product.category.name} · {product.basePrice} {product.currency} · Stock:{" "}
                {product.stockQuantity}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                to={`/seller/products/${product.id}/edit`}
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                Edit
              </Link>
              <Button size="sm" variant={product.isActive ? "outline" : "default"} onClick={() => toggleActive(product)}>
                {product.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
