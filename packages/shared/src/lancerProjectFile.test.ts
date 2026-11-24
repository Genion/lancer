import * as Schema from "effect/Schema";
import { describe, expect, it } from "vite-plus/test";

import { parseLancerProjectFile, LancerProjectFileFromJson } from "./lancerProjectFile.ts";

const decodeJson = Schema.decodeUnknownSync(LancerProjectFileFromJson);

describe("LancerProjectFileFromJson", () => {
  it("decodes lenient JSONC with comments and trailing commas", () => {
    const decoded = decodeJson(`{
      // team scripts
      "iconPath": "assets/logo.svg",
      "scripts": [
        { "name": "Dev", "command": "pnpm dev", "stopOnSettle": true, },
      ],
    }`);

    expect(decoded.iconPath).toBe("assets/logo.svg");
    expect(decoded.scripts?.[0]).toEqual({ name: "Dev", command: "pnpm dev", stopOnSettle: true });
  });
});

describe("parseLancerProjectFile", () => {
  it("reads project defaults from JSONC with a URL in a block comment", () => {
    expect(
      parseLancerProjectFile(`{
        /* See ./schema/lancer.json */
        "defaultThreadEnvMode": "worktree"
      }`),
    ).toEqual({ defaultThreadEnvMode: "worktree" });
  });
});
