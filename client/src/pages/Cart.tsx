import type { CartView } from "@stefanmarket/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function Cart() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiFetch<CartView>("/buyer/cart"),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;
    await apiFetch(`/buyer/cart/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
    invalidate();
  }

  async function removeItem(itemId: string) {
    await apiFetch(`/buyer/cart/${itemId}`, { method: "DELETE" });
    invalidate();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
      {data && data.items.length === 0 && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Link to="/products" className={buttonVariants({ className: "mt-4" })}>
            Browse products
          </Link>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {data?.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 rounded-md border border-border p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.product.imageUrl && (
                <img src={item.product.imageUrl} alt={item.product.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <Link to={`/products/${item.product.slug}`} className="text-sm font-medium hover:underline">
                {item.product.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {item.product.basePrice} {item.product.currency}
              </p>
            </div>
            <input
              type="number"
              min={1}
              max={item.product.stockQuantity}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
              className="w-16 rounded-md border border-input bg-background px-2 py-2 text-sm"
            />
            <Button variant="outline" size="sm" onClick={() => removeItem(item.id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>

      {data && data.items.length > 0 && (
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <p className="text-lg font-medium">
            Subtotal: {data.subtotal} {data.currency}
          </p>
          <Link to="/checkout" className={buttonVariants({})}>
            Proceed to checkout
          </Link>
        </div>
      )}
    </main>
  );
}
