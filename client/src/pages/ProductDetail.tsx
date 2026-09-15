import type { ProductDetail as ProductDetailType } from "@stefanmarket/shared";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { apiFetch } from "@/lib/api";

export function ProductDetail() {
  const { slug } = useParams();

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
        </div>
      </div>
    </main>
  );
}
