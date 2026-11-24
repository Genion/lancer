import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";

import { resolvePreviousReleaseTag } from "./resolve-previous-release-tag.ts";

it.effect("selects the latest earlier stable tag and ignores nightlies", () =>
  Effect.gen(function* () {
    const previous = yield* resolvePreviousReleaseTag("stable", "harness-v1.2.0", [
      "harness-v1.1.0",
      "harness-v1.1.1-nightly.20260619.1",
      "harness-v1.1.2",
      "harness-v1.2.0",
    ]);

    assert.equal(previous, "harness-v1.1.2");
  }),
);

it.effect("accepts legacy nightly tags when selecting the previous nightly", () =>
  Effect.gen(function* () {
    const previous = yield* resolvePreviousReleaseTag("nightly", "harness-v1.2.0-nightly.20260620.2", [
      "harness-v1.2.0-nightly.20260620.1",
      "harness-v1.1.0-nightly.20260619.9",
    ]);

    assert.equal(previous, "harness-v1.2.0-nightly.20260620.1");
  }),
);

it.effect("keeps preview tags in their own series", () =>
  Effect.gen(function* () {
    const previous = yield* resolvePreviousReleaseTag("preview", "harness-v1.2.0-preview.20260620.2", [
      "harness-v1.2.0-nightly.20260620.3",
      "harness-v1.2.0-preview.20260620.1",
      "harness-v1.1.9",
    ]);
    assert.equal(previous, "harness-v1.2.0-preview.20260620.1");

    const stable = yield* resolvePreviousReleaseTag("stable", "harness-v1.2.0", [
      "harness-v1.1.9",
      "harness-v1.2.0-preview.20260620.1",
    ]);
    assert.equal(stable, "harness-v1.1.9");
  }),
);
