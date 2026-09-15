import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProductSchema,
  type CategoryView,
  type ProductSummary,
  type CreateProductInput,
} from "@stefanmarket/shared";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";

type FormFields = Omit<CreateProductInput, "imageUrls">;

export function ProductForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(createProductSchema.omit({ imageUrls: true })),
  });

  const [categories, setCategories] = useState<CategoryView[]>([]);

  useEffect(() => {
    apiFetch<{ categories: CategoryView[] }>("/catalog/categories").then((res) => {
      setCategories(res.categories);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ products: ProductSummary[] }>("/seller/products").then((res) => {
      const product = res.products.find((p) => p.id === id);
      if (!product) return;
      reset({
        title: product.title,
        description: "",
        categoryId: product.category.id,
        basePrice: Number(product.basePrice),
        stockQuantity: product.stockQuantity,
      });
      if (product.imageUrl) setImageUrlsText(product.imageUrl);
    });
  }, [id, reset]);

  async function onSubmit(fields: FormFields) {
    setError(null);
    const imageUrls = imageUrlsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsed = createProductSchema.safeParse({ ...fields, imageUrls });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    try {
      if (isEditMode) {
        await apiFetch(`/seller/products/${id}`, { method: "PATCH", body: JSON.stringify(parsed.data) });
      } else {
        await apiFetch("/seller/products", { method: "POST", body: JSON.stringify(parsed.data) });
      }
      navigate("/seller/products", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <main>
      <h2 className="text-xl font-semibold tracking-tight">{isEditMode ? "Edit product" : "New product"}</h2>
      <form className="mt-6 max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("title")}
          />
          {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="categoryId">
            Category
          </label>
          <select
            id="categoryId"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("categoryId")}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-destructive">{errors.categoryId.message}</p>
          )}
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium" htmlFor="basePrice">
              Price (RON)
            </label>
            <input
              id="basePrice"
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register("basePrice", { valueAsNumber: true })}
            />
            {errors.basePrice && (
              <p className="mt-1 text-sm text-destructive">{errors.basePrice.message}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium" htmlFor="stockQuantity">
              Stock
            </label>
            <input
              id="stockQuantity"
              type="number"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register("stockQuantity", { valueAsNumber: true })}
            />
            {errors.stockQuantity && (
              <p className="mt-1 text-sm text-destructive">{errors.stockQuantity.message}</p>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="imageUrls">
            Image URLs (one per line)
          </label>
          <textarea
            id="imageUrls"
            rows={3}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={imageUrlsText}
            onChange={(e) => setImageUrlsText(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isEditMode ? "Save changes" : "Create product"}
        </Button>
      </form>
    </main>
  );
}
