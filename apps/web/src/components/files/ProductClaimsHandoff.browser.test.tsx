import { createMemoryHistory } from "@tanstack/react-router";
import { TurnItemId, type OrchestrationV2TurnItem } from "@lancer/contracts";
import { DEFAULT_CLIENT_SETTINGS } from "@lancer/contracts/settings";
import type * as Context from "effect/Context";
import { expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";
import sample from "../../../../../examples/product-claims-review/sample-review.json";
import sampleText from "../../../../../examples/product-claims-review/sample-review.json?raw";
import { AppRoot } from "~/AppRoot";
// Transform the lazy workspace surfaces before measuring the browser interaction.
import "~/components/ChatView";
import "~/components/lancer-gittree/LancerGitTree";
import "./FilePreviewPanel";
import { __setClientSettingsForTests } from "~/hooks/useSettings";
import "~/index.css";
import { getRouter } from "~/router";
import {
  ENVIRONMENT_ID,
  installFakeEnvironment,
  threadWithHistory,
  type FakeDriver,
} from "../../../test/fakeEnvironment";
import { render } from "../../../test/render";

vi.mock("../../../../../packages/client-runtime/src/connection/driver.ts", async (original) => {
  const [actual, { fakeDriver }, Layer] = await Promise.all([
    original<{ readonly ConnectionDriver: Context.Key<unknown, FakeDriver> }>(),
    import("../../../test/fakeEnvironment"),
    import("effect/Layer"),
  ]);
  return { ...actual, layer: Layer.succeed(actual.ConnectionDriver, fakeDriver) };
});

it("opens a listing review from a handoff and shows the source behind each decision", async () => {
  const fixture = threadWithHistory("ridge-listing", 1);
  const thread = {
    ...fixture,
    title: "Ridge 600 listing review",
    items: fixture.items.flatMap((entry): OrchestrationV2TurnItem[] => {
      if (entry.type === "user_message")
        return [
          {
            ...entry,
            title: "Review assignment",
            text: "Which claims can we publish for the Ridge 600 bottle?",
          },
        ];
      if (entry.type !== "assistant_message") return [entry];
      return [
        {
          ...entry,
          id: TurnItemId.make("read-release-packet"),
          type: "dynamic_tool",
          title: "Read release records",
          toolName: "read_file",
          input: { path: "SOURCES.md" },
          output: "Release records include the current specification, care card and carton check.",
        },
        {
          ...entry,
          title: "Deliver listing review",
          text: "Publish the capacity. Revise the care instructions. Hold the lid count until packing and QA agree.\n\n[Open listing review](/workspace/render/handoff/review.json)",
        },
      ];
    }),
  };
  using _fixture = installFakeEnvironment([thread], new Map([["handoff/review.json", sampleText]]));
  await page.viewport(1440, 890);
  __setClientSettingsForTests({
    ...DEFAULT_CLIENT_SETTINGS,
    onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
  });
  const router = getRouter(
    createMemoryHistory({ initialEntries: [`/${ENVIRONMENT_ID}/${thread.id}`] }),
  );
  await router.load();
  const container = document.createElement("div");
  container.style.cssText = "height: 100dvh; width: 100%";
  await using screen = await render(<AppRoot router={router} />, { container, router: false });

  await expect.element(screen.getByText(/Publish the capacity/)).toBeVisible();
  const areas = screen.getByRole("navigation", { name: "Workspace areas" });
  await areas.getByRole("button", { name: "GitTree", exact: true }).click();
  const delivery = screen.getByRole("button", {
    name: /Deliver listing review.*Open handoff\/review\.json/,
  });
  await expect.element(delivery).toBeVisible();
  await delivery.click();
  const report = screen.getByRole("region", { name: "Product claims review" });
  await expect.element(report).toBeVisible();
  expect(report.element().textContent).toContain(`SKU ${sample.sku} · Revision ${sample.revision}`);
  for (const claim of sample.claims) {
    const card = report.getByRole("article", { name: `Claim ${claim.id}` });
    await expect
      .element(
        card.getByText(
          { approve: "Approved", revise: "Revised", hold: "On hold" }[claim.decision]!,
          { exact: true },
        ),
      )
      .toBeVisible();
    await expect
      .element(card.getByText(claim.proposed_copy, { exact: true }).first())
      .toBeVisible();
    for (const evidence of claim.evidence) {
      expect(card.element().textContent).toContain(evidence.source_id);
      expect(card.element().textContent).toContain(evidence.quote);
    }
    if (claim.operator_question) {
      await expect.element(card.getByText("Fallback copy", { exact: true })).toBeVisible();
      expect(card.element().textContent).toContain(claim.operator_question);
    }
  }
  await screen.getByRole("button", { name: "Show JSON source" }).click();
  await expect.element(screen.getByRole("button", { name: "Show claims review" })).toBeVisible();
  await expect.element(screen.getByText('"sku"', { exact: false }).first()).toBeVisible();
  await screen.getByRole("button", { name: "Show claims review" }).click();
  await expect.element(report).toBeVisible();
  await areas.getByRole("button", { name: "GitTree", exact: true }).click();
  await expect.element(delivery).toBeVisible();
  await screen.getByRole("link", { name: "review.json", exact: true }).click();
  await expect.element(report).toBeVisible();
});
