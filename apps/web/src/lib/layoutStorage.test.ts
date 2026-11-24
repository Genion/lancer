import { describe, expect, it } from "vite-plus/test";
import { resolveLayoutStorage } from "./storage";

describe("Lancer layout storage", () => {
  const key = "lancer:right-panel-state:v2";
  const oldKey = "t3code:right-panel-state:v2";

  it("moves the previous layout and keeps an existing Lancer layout authoritative", () => {
    const entries = new Map([[oldKey, "previous"]]);
    const storage = {
      getItem: (name: string) => entries.get(name) ?? null,
      setItem: (name: string, value: string) => {
        entries.set(name, value);
      },
      removeItem: (name: string) => {
        entries.delete(name);
      },
    };
    const layout = resolveLayoutStorage(storage);
    expect(layout.getItem(key)).toBe("previous");
    expect(entries.has(oldKey)).toBe(false);
    entries.set(oldKey, "stale");
    layout.setItem(key, "new");
    expect(layout.getItem(key)).toBe("new");
    layout.removeItem(key);
    expect(layout.getItem(key)).toBeNull();
  });

  it("restores the previous layout when writing the new key exceeds quota", () => {
    const layout = resolveLayoutStorage({
      getItem: (name) => (name === oldKey ? "previous" : null),
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {
        throw new Error("unexpected removal");
      },
    });
    expect(layout.getItem(key)).toBe("previous");
  });
});
