import type { DesktopUpdateChannel } from "@lancer/contracts";
import { newestCliReleaseVersion } from "@lancer/shared/cliRelease";
import * as Schema from "effect/Schema";

const decodeReleases = Schema.decodeUnknownSync(
  Schema.Array(Schema.Struct({ tag_name: Schema.String, draft: Schema.Boolean })),
);

/** Resolve assets for the Harness track in a series repository containing other products. */
export async function harnessReleaseFeed(
  owner: string,
  repo: string,
  channel: DesktopUpdateChannel,
  signal: AbortSignal,
  request: typeof fetch = fetch,
): Promise<string | null> {
  const repository = `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  for (let page = 1; ; page += 1) {
    const response = await request(
      `https://api.github.com/repos/${repository}/releases?per_page=100&page=${page}`,
      { headers: { accept: "application/vnd.github+json" }, signal },
    );
    if (!response.ok) throw new Error(`GitHub release lookup failed (HTTP ${response.status}).`);
    const releases = decodeReleases(await response.json());
    const version = newestCliReleaseVersion(releases, channel === "nightly" ? "nightly" : "stable");
    if (version) return `https://github.com/${repository}/releases/download/harness-v${version}/`;
    if (releases.length < 100) return null;
  }
}
