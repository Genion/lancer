import { createMemoryHistory } from "@tanstack/react-router";
import { TurnItemId, type OrchestrationV2TurnItem } from "@lancer/contracts";
import { DEFAULT_CLIENT_SETTINGS } from "@lancer/contracts/settings";
import type * as Context from "effect/Context";
import { expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { AppRoot } from "~/AppRoot";
// Transform the lazy workspace surfaces before measuring the browser interaction.
import "~/components/ChatView";
import "./LancerGitTree";
import "../files/FilePreviewPanel";
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

// Replace the socket driver only. Navigation uses the real app router, graph, and virtualized timeline.
vi.mock("../../../../../packages/client-runtime/src/connection/driver.ts", async (original) => {
  const [actual, { fakeDriver }, Layer] = await Promise.all([
    original<{ readonly ConnectionDriver: Context.Key<unknown, FakeDriver> }>(),
    import("../../../test/fakeEnvironment"),
    import("effect/Layer"),
  ]);
  return { ...actual, layer: Layer.succeed(actual.ConnectionDriver, fakeDriver) };
});

it("reveals the selected GitTree event in the thread's virtualized timeline", async () => {
  const fixture = threadWithHistory("source-navigation", 30);
  const thread = {
    ...fixture,
    title: "Review the documentation",
    items: fixture.items.flatMap((entry): OrchestrationV2TurnItem[] => {
      if (entry.id === "source-navigation-assistant-2" && entry.type === "assistant_message") {
        return [
          {
            ...entry,
            id: TurnItemId.make("proposal-event"),
            title: "Review proposal",
            text: "The proposed guide now links back to each source.",
          },
        ];
      }
      if (entry.id === "source-navigation-assistant-4" && entry.type === "assistant_message") {
        return [
          {
            ...entry,
            id: TurnItemId.make("edit-guides"),
            type: "file_change",
            title: "Update two guides",
            fileName: "docs/intro.md",
            changes: [
              { operation: "update", path: "docs/intro.md" },
              { operation: "update", path: "docs/usage.md" },
            ],
          },
          entry,
        ];
      }
      if (entry.id === "source-navigation-assistant-8" && entry.type === "assistant_message") {
        return [
          {
            ...entry,
            id: TurnItemId.make("read-usage-notes"),
            type: "dynamic_tool",
            title: "Read usage notes",
            toolName: "read_file",
            input: { path: "docs/usage.md" },
            output: "The guide includes source references.",
          },
          entry,
        ];
      }
      return [entry];
    }),
  };
  using _fixture = installFakeEnvironment(
    [thread],
    new Map([["docs/usage.md", "# Local guide\n\nThis is the original file content."]]),
  );
  await page.viewport(1400, 900);
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
  await expect.element(screen.getByText("Answer 29 for source-navigation.")).toBeVisible();

  const target = "The proposed guide now links back to each source.";
  const highlight = () =>
    screen.container.querySelector<HTMLElement>("[data-timeline-row-id][data-gittree-source]");
  expect(highlight()).toBeNull();
  await screen
    .getByRole("button", { name: /Review proposal/ })
    .getByText("Review proposal")
    .click();
  await screen.getByRole("button", { name: "Show in timeline" }).click();
  await vi.waitFor(() => {
    const row = highlight();
    expect(row?.textContent).toContain(target);
    const box = row!.getBoundingClientRect();
    expect(box.bottom).toBeGreaterThan(0);
    expect(box.top).toBeLessThan(window.innerHeight);
  });

  const desktopAreas = screen.getByRole("navigation", { name: "Workspace areas" });
  await screen.getByRole("button", { name: /Update two guides.*Choose from 2 files/ }).click();
  await expect
    .element(desktopAreas.getByRole("button", { name: "GitTree", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  const fileChoices = screen.getByRole("list", { name: "Event files" });
  await expect
    .element(fileChoices.getByRole("button", { name: "Open docs/intro.md" }))
    .toBeVisible();
  await fileChoices.getByRole("button", { name: "Open docs/usage.md" }).click();
  await expect
    .element(screen.getByText("This is the original file content.", { exact: true }))
    .toBeVisible();
  await desktopAreas.getByRole("button", { name: "GitTree", exact: true }).click();

  // On a narrow window the graph moves into a modal sheet. Revealing a source dismisses it.
  await page.viewport(700, 850);
  const drawer = page.getByRole("dialog");
  await expect.element(drawer).toBeVisible();
  (drawer.getByRole("button", { name: /Read usage notes/ }).element() as HTMLButtonElement).focus();
  await userEvent.keyboard("{Enter}");
  const areas = drawer.getByRole("navigation", { name: "Workspace areas" });
  await expect
    .element(areas.getByRole("button", { name: "Files", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  await expect
    .element(drawer.getByText("This is the original file content.", { exact: true }))
    .toBeVisible();
  await areas.getByRole("button", { name: "GitTree", exact: true }).click();
  await expect
    .element(drawer.getByRole("button", { name: "Open docs/usage.md", exact: true }))
    .toBeVisible();
  await drawer.getByRole("button", { name: "Show in timeline" }).click();
  await vi.waitFor(() => {
    const row = highlight();
    expect(row?.textContent).toContain("docs/usage.md");
    expect(row?.textContent).not.toContain(target);
    expect(row?.getBoundingClientRect().top).toBeLessThan(window.innerHeight);
  });
  await expect
    .element(page.getByRole("button", { name: "Toggle right panel" }))
    .toHaveAttribute("aria-pressed", "false");
});
