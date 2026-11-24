import { scopeThreadRef } from "@lancer/client-runtime/environment";
import { EnvironmentId, ThreadId } from "@lancer/contracts";
import { beforeEach, expect, it } from "vite-plus/test";
import {
  ensureGitTreePanel,
  selectThreadRightPanelState,
  useRightPanelStore,
} from "./rightPanelStore";
const a = scopeThreadRef(EnvironmentId.make("local"), ThreadId.make("a"));
const b = scopeThreadRef(EnvironmentId.make("local"), ThreadId.make("b"));
const panel = () => selectThreadRightPanelState(useRightPanelStore.getState().byThreadKey, a);
beforeEach(() => useRightPanelStore.setState(useRightPanelStore.getInitialState()));
it("pins one GitTree per conversation without modifying other conversations", () => {
  ensureGitTreePanel(a);
  ensureGitTreePanel(a);
  expect(panel()).toMatchObject({
    isOpen: true,
    activeSurfaceId: "gittree",
    surfaces: [{ id: "gittree", kind: "gittree" }],
  });
  expect(
    selectThreadRightPanelState(useRightPanelStore.getState().byThreadKey, b).surfaces,
  ).toEqual([]);
});
it("preserves active files when registering the pinned tab", () => {
  useRightPanelStore.getState().openFile(a, "README.md");
  ensureGitTreePanel(a);
  expect(panel().activeSurfaceId).toBe("file:README.md");
  expect(panel().surfaces.map((surface) => surface.id)).toEqual(["gittree", "file:README.md"]);
});
it("retains the pin through close, close others, reorder and close all", () => {
  ensureGitTreePanel(a);
  const store = useRightPanelStore.getState();
  store.closeSurface(a, "gittree");
  store.openFile(a, "README.md");
  store.closeOtherSurfaces(a, "file:README.md");
  store.moveSurface(a, "file:README.md", 0);
  expect(panel().surfaces[0]?.id).toBe("gittree");
  store.closeAllSurfaces(a);
  expect(panel().surfaces).toEqual([{ id: "gittree", kind: "gittree" }]);
  expect(panel().activeSurfaceId).toBe("gittree");
});
