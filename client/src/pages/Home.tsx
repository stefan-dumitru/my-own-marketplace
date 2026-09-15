import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";

export function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome to stefanmarket</h1>
      <p className="mt-2 text-muted-foreground">
        Browse products from approved sellers. Cart, checkout, and more land in upcoming
        milestones.
      </p>
      <Link to="/products" className={buttonVariants({ className: "mt-6" })}>
        Browse products
      </Link>
    </main>
  );
}
