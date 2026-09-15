import type { CartView, ProductDetail as ProductDetailType } from "@stefanmarket/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, status } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [addError, setAddError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["catalog", "product", slug],
    queryFn: () => apiFetch<{ product: ProductDetailType }>(`/catalog/products/${slug}`),
  });

  if (isLoading) return <p className="p-8 text-center text-muted-foreground">Loading…</p>;
  if (error || !data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/products" className="mt-4 inline-block text-sm underline">
          Back to products
        </Link>
      </main>
    );
  }

  const { product } = data;

  async function addToCart() {
    setAddError(null);
    setAdded(false);
    try {
      await apiFetch<CartView>("/buyer/cart", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setAdded(true);
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/products" className="text-sm text-muted-foreground underline">
        ← Back to products
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          {product.images.length === 0 && (
            <div className="aspect-square rounded-md bg-muted" />
          )}
          {product.images.map((img) => (
            <img
              key={img.url}
              src={img.url}
              alt={img.altText ?? product.title}
              className="aspect-square rounded-md object-cover"
            />
          ))}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{product.category.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{product.title}</h1>
          <p className="mt-2 text-xl font-medium">
            {product.basePrice} {product.currency}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm">{product.description}</p>
          <p className="mt-6 text-sm text-muted-foreground">Sold by {product.seller.companyName}</p>

          {status !== "loading" && (
            <div className="mt-6">
              {user?.role === "buyer" ? (
                product.stockQuantity > 0 ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={product.stockQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-16 rounded-md border border-input bg-background px-2 py-2 text-sm"
                    />
                    <Button onClick={addToCart}>Add to cart</Button>
                    {added && <span className="text-sm text-success">Added!</span>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Out of stock</p>
                )
              ) : (
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Log in to buy
                </Button>
              )}
              {addError && <p className="mt-2 text-sm text-destructive">{addError}</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
