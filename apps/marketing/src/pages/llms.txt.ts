import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
  new Response(
    "# Lancer Harness\n\nLocal runtime for business agents. Start from the source checkout with vp i and vp run dev. See /download for setup and examples/product-claims-review/README.md for a fictional review task.\n",
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
