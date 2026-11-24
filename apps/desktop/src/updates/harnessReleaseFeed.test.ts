import { describe, expect, it } from "vite-plus/test";
import { harnessReleaseFeed } from "./harnessReleaseFeed.ts";

describe("Harness desktop releases", () => {
  const records = [
    { tag_name: "v9.0.0", draft: false },
    { tag_name: "harness-v2.0.0", draft: true },
    { tag_name: "harness-v1.2.1-nightly.20261123.1", draft: false },
    { tag_name: "harness-v1.2.0", draft: false },
  ];
  const lookup = (channel: "latest" | "nightly", releases = records) =>
    harnessReleaseFeed("owner", "series", channel, new AbortController().signal, async () =>
      Response.json(releases),
    );

  it("pins the platform updater to a published Harness release on its chosen channel", async () => {
    expect(await lookup("latest")).toBe(
      "https://github.com/owner/series/releases/download/harness-v1.2.0/",
    );
    expect(await lookup("nightly")).toContain("harness-v1.2.1-nightly.20261123.1/");
    expect(await lookup("latest", records.slice(0, 2))).toBeNull();
  });
});
