import type { APIRoute } from "astro";

import { buildLancerProjectFileJsonSchema } from "@lancer/shared/lancerProjectFile";

export const GET: APIRoute = () =>
  new Response(`${JSON.stringify(buildLancerProjectFileJsonSchema(), null, 2)}\n`, {
    headers: { "Content-Type": "application/json" },
  });
